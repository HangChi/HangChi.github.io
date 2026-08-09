import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { HttpAuthError } from './plugins/auth.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerPostRoutes } from './routes/posts.js';
import { registerTaxonomyRoutes } from './routes/taxonomy.js';
import { registerUploadRoutes, type ImageUploadService } from './routes/uploads.js';
import { InvalidCredentialsError, type AuthService } from './services/auth-service.js';
import { PostNotFoundError, type PostService } from './services/post-service.js';
import { PostVersionConflictError } from './repositories/types.js';
import type { TaxonomyRepository } from './repositories/taxonomy-repository.js';

export type AppDependencies = {
  authService: AuthService;
  cookieSecure: boolean;
  logger?: boolean;
  postService?: PostService;
  taxonomyRepository?: TaxonomyRepository;
  imageUploadService?: ImageUploadService;
};

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: dependencies.logger ?? false,
    trustProxy: false,
    bodyLimit: 2 * 1024 * 1024,
  });

  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  await registerAuthRoutes(app, dependencies);
  if (dependencies.postService) {
    await registerPostRoutes(app, {
      authService: dependencies.authService,
      postService: dependencies.postService,
    });
  }
  if (dependencies.taxonomyRepository) {
    await registerTaxonomyRoutes(app, {
      authService: dependencies.authService,
      taxonomyRepository: dependencies.taxonomyRepository,
    });
  }
  if (dependencies.imageUploadService) {
    await registerUploadRoutes(app, {
      authService: dependencies.authService,
      imageUploadService: dependencies.imageUploadService,
    });
  }

  app.get('/api/health/live', async () => ({ ok: true }));

  app.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({ code: 'NOT_FOUND', message: '接口不存在' });
  });

  app.setErrorHandler(async (error, request, reply) => {
    if (error instanceof HttpAuthError) {
      return reply.status(error.statusCode).send({ code: error.code, message: error.message });
    }
    if (error instanceof InvalidCredentialsError) {
      return reply.status(401).send({ code: 'INVALID_CREDENTIALS', message: error.message });
    }
    if (error instanceof PostNotFoundError) {
      return reply.status(404).send({ code: 'POST_NOT_FOUND', message: error.message });
    }
    if (error instanceof PostVersionConflictError) {
      return reply.status(409).send({ code: 'POST_VERSION_CONFLICT', message: error.message });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: '提交的数据不符合要求',
        fields: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({ code: 'IMAGE_TOO_LARGE', message: '图片不能超过 10 MiB' });
    }
    request.log.error({ err: error }, 'request failed');
    return reply.status(500).send({ code: 'INTERNAL_ERROR', message: '服务器暂时无法完成请求' });
  });

  await app.ready();
  return app;
}
