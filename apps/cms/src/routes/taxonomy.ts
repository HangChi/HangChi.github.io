import { EntityIdSchema, TaxonomyInputSchema } from '@blog/contracts';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { requireCsrf, requireSession } from '../plugins/auth.js';
import type { TaxonomyKind, TaxonomyRepository } from '../repositories/taxonomy-repository.js';
import type { AuthService } from '../services/auth-service.js';

const IdParamsSchema = z.object({ id: EntityIdSchema });

async function secureMutation(request: FastifyRequest, authService: AuthService): Promise<void> {
  const session = await requireSession(request, authService);
  requireCsrf(request, authService, session);
}

export async function registerTaxonomyRoutes(
  app: FastifyInstance,
  options: { authService: AuthService; taxonomyRepository: TaxonomyRepository },
): Promise<void> {
  for (const kind of ['categories', 'tags'] as const satisfies readonly TaxonomyKind[]) {
    app.get(`/api/${kind}`, async (request) => {
      await requireSession(request, options.authService);
      return { items: await options.taxonomyRepository.list(kind) };
    });

    app.post(`/api/${kind}`, async (request, reply) => {
      await secureMutation(request, options.authService);
      const value = await options.taxonomyRepository.create(kind, TaxonomyInputSchema.parse(request.body));
      return reply.status(201).send(value);
    });

    app.patch(`/api/${kind}/:id`, async (request) => {
      await secureMutation(request, options.authService);
      const { id } = IdParamsSchema.parse(request.params);
      return options.taxonomyRepository.update(kind, id, TaxonomyInputSchema.parse(request.body));
    });

    app.delete(`/api/${kind}/:id`, async (request, reply) => {
      await secureMutation(request, options.authService);
      const { id } = IdParamsSchema.parse(request.params);
      await options.taxonomyRepository.delete(kind, id);
      return reply.status(204).send();
    });
  }
}
