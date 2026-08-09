import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { HttpAuthError } from './plugins/auth.js';
import { registerAuthRoutes } from './routes/auth.js';
import { InvalidCredentialsError, type AuthService } from './services/auth-service.js';

export type AppDependencies = {
  authService: AuthService;
  cookieSecure: boolean;
  logger?: boolean;
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
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: 'VALIDATION_ERROR',
        message: '提交的数据不符合要求',
        fields: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }
    request.log.error({ err: error }, 'request failed');
    return reply.status(500).send({ code: 'INTERNAL_ERROR', message: '服务器暂时无法完成请求' });
  });

  await app.ready();
  return app;
}
