import { EntityIdSchema } from '@blog/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { requireCsrf, requireSession } from '../plugins/auth.js';
import { publishJobDto } from '../repositories/mysql-publish-job-store.js';
import type { AuthService } from '../services/auth-service.js';
import type { PublishJobStore } from '../services/publish-queue.js';
import type { PublishQueuePort } from '../services/post-service.js';

const IdParamsSchema = z.object({ id: EntityIdSchema });

async function secureMutation(request: FastifyRequest, authService: AuthService): Promise<void> {
  const session = await requireSession(request, authService);
  requireCsrf(request, authService, session);
}

export async function registerPublishingRoutes(
  app: FastifyInstance,
  options: { authService: AuthService; publishJobStore: PublishJobStore; publishQueue: PublishQueuePort },
): Promise<void> {
  app.get('/api/publishing/state', async (request) => {
    await requireSession(request, options.authService);
    return options.publishJobStore.state();
  });

  app.get('/api/publishing/jobs', async (request) => {
    await requireSession(request, options.authService);
    return { items: (await options.publishJobStore.list()).map(publishJobDto) };
  });

  app.get('/api/publishing/jobs/:id', async (request, reply) => {
    await requireSession(request, options.authService);
    const { id } = IdParamsSchema.parse(request.params);
    const job = await options.publishJobStore.find(id);
    return job
      ? publishJobDto(job)
      : reply.status(404).send({ code: 'PUBLISH_JOB_NOT_FOUND', message: '发布任务不存在' });
  });

  app.post('/api/publishing/jobs/:id/retry', async (request, reply) => {
    await secureMutation(request, options.authService);
    const { id } = IdParamsSchema.parse(request.params);
    const job = await options.publishJobStore.find(id);
    if (!job) return reply.status(404).send({ code: 'PUBLISH_JOB_NOT_FOUND', message: '发布任务不存在' });
    if (job.status !== 'failed') {
      return reply.status(409).send({ code: 'PUBLISH_JOB_NOT_FAILED', message: '只有失败的任务可以重试' });
    }
    await options.publishQueue.enqueue('retry');
    return reply.status(202).send({ queued: true });
  });

  app.post('/api/publishing/publish', async (request, reply) => {
    await secureMutation(request, options.authService);
    await options.publishQueue.enqueue('manual');
    return reply.status(202).send({ queued: true });
  });
}
