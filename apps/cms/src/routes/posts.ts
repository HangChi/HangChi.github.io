import { EntityIdSchema, PostInputSchema, PostQuerySchema } from '@blog/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { requireCsrf, requireSession } from '../plugins/auth.js';
import type { AuthService } from '../services/auth-service.js';
import type { PostService } from '../services/post-service.js';

type PostRouteOptions = {
  authService: AuthService;
  postService: PostService;
};

const IdParamsSchema = z.object({ id: EntityIdSchema });
const VersionParamsSchema = z.object({ id: EntityIdSchema, versionId: EntityIdSchema });
const VersionBodySchema = z.object({ version: z.number().int().positive() });

async function secureMutation(request: FastifyRequest, authService: AuthService): Promise<void> {
  const session = await requireSession(request, authService);
  requireCsrf(request, authService, session);
}

export async function registerPostRoutes(app: FastifyInstance, options: PostRouteOptions): Promise<void> {
  const { authService, postService } = options;

  app.get('/api/posts', async (request) => {
    await requireSession(request, authService);
    return postService.list(PostQuerySchema.parse(request.query));
  });

  app.post('/api/posts', async (request, reply) => {
    await secureMutation(request, authService);
    const post = await postService.create(PostInputSchema.parse(request.body));
    return reply.status(201).send(post);
  });

  app.get('/api/posts/:id', async (request) => {
    await requireSession(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    const includeDeleted = z.stringbool().catch(false).parse((request.query as { includeDeleted?: string }).includeDeleted);
    return postService.get(id, includeDeleted);
  });

  app.patch('/api/posts/:id', async (request) => {
    await secureMutation(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    return postService.update(id, PostInputSchema.parse(request.body));
  });

  app.post('/api/posts/:id/publish', async (request) => {
    await secureMutation(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    const { version } = VersionBodySchema.parse(request.body);
    return postService.publish(id, version);
  });

  app.post('/api/posts/:id/unpublish', async (request) => {
    await secureMutation(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    const { version } = VersionBodySchema.parse(request.body);
    return postService.unpublish(id, version);
  });

  app.delete('/api/posts/:id', async (request) => {
    await secureMutation(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    const { version } = VersionBodySchema.parse(request.body);
    return postService.softDelete(id, version);
  });

  app.post('/api/posts/:id/restore', async (request) => {
    await secureMutation(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    const { version } = VersionBodySchema.parse(request.body);
    return postService.restore(id, version);
  });

  app.delete('/api/posts/:id/permanent', async (request, reply) => {
    await secureMutation(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    await postService.permanentlyDelete(id);
    return reply.status(204).send();
  });

  app.get('/api/posts/:id/versions', async (request) => {
    await requireSession(request, authService);
    const { id } = IdParamsSchema.parse(request.params);
    return { items: await postService.listVersions(id) };
  });

  app.post('/api/posts/:id/versions/:versionId/restore', async (request) => {
    await secureMutation(request, authService);
    const { id, versionId } = VersionParamsSchema.parse(request.params);
    const { version } = VersionBodySchema.parse(request.body);
    return postService.restoreVersion(id, versionId, version);
  });
}
