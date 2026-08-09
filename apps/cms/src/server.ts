import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabasePool } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { MysqlAuthRepository } from './repositories/mysql-auth-repository.js';
import { MysqlPostRepository } from './repositories/mysql-post-repository.js';
import { MysqlTaxonomyRepository } from './repositories/taxonomy-repository.js';
import { MysqlPublishJobStore } from './repositories/mysql-publish-job-store.js';
import { AuthService } from './services/auth-service.js';
import { EasyImageService } from './services/easyimage-service.js';
import { LocalReleaseAdapter } from './services/local-release-adapter.js';
import { PostService } from './services/post-service.js';
import { PublishQueue } from './services/publish-queue.js';
import { Publisher } from './services/publisher.js';
import path from 'node:path';

const config = loadConfig();
const pool = createDatabasePool(config.databaseUrl);

await runMigrations(pool);

const authRepository = new MysqlAuthRepository(pool);
const postRepository = new MysqlPostRepository(pool);
const taxonomyRepository = new MysqlTaxonomyRepository(pool);
const publishJobStore = new MysqlPublishJobStore(pool);
const releaseAdapter = new LocalReleaseAdapter({
  sourceRoot: config.sourceRoot,
  releasesRoot: config.releasesRoot,
  activeLink: config.activeLink,
  packageManagerCommand: config.packageManagerCommand,
});
const publishQueue = new PublishQueue(publishJobStore, async (job) => {
  const publisher = new Publisher({
    snapshot: () => postRepository.snapshotPublished(),
    prepareWorkspace: (request, revision) => releaseAdapter.prepareWorkspace(request, revision),
    exportPosts: (workspace, posts) => releaseAdapter.exportPosts(workspace, posts),
    build: (workspace) => releaseAdapter.build(workspace),
    verify: (workspace) => releaseAdapter.verify(workspace),
    activate: (workspace) => releaseAdapter.activate(workspace),
    recordSuccess: (request, workspace, revision) => publishJobStore.markSucceeded(
      request.id,
      path.basename(workspace),
      revision,
      releaseAdapter.executionLog,
    ),
    recordFailure: (request, error) => publishJobStore.markFailed(
      request.id,
      error.message,
      `${releaseAdapter.executionLog}\n${error.stack ?? error.message}`,
    ),
  });
  await publisher.publish({ id: job.id, trigger: job.trigger });
});
const postService = new PostService(postRepository, publishQueue);
const app = await buildApp({
  authService: new AuthService(authRepository, { sessionHours: config.sessionHours }),
  cookieSecure: config.cookieSecure,
  postService,
  taxonomyRepository,
  imageUploadService: new EasyImageService(config.easyImageBaseUrl),
  publishJobStore,
  publishQueue,
  logger: true,
});

const shutdown = async () => {
  await publishQueue.drain();
  await app.close();
  await pool.end();
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await app.listen({ host: config.host, port: config.port });
void publishQueue.drain();
