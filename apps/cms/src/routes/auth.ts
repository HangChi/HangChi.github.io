import { ChangePasswordRequestSchema, LoginRequestSchema } from '@blog/contracts';
import type { FastifyInstance } from 'fastify';

import { CSRF_COOKIE, requireCsrf, requireSession, SESSION_COOKIE } from '../plugins/auth.js';
import type { AuthService } from '../services/auth-service.js';

type AuthRouteOptions = {
  authService: AuthService;
  cookieSecure: boolean;
};

const cookieBase = {
  path: '/',
  sameSite: 'strict' as const,
};

export async function registerAuthRoutes(app: FastifyInstance, options: AuthRouteOptions): Promise<void> {
  const { authService, cookieSecure } = options;

  app.post('/api/auth/login', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const input = LoginRequestSchema.parse(request.body);
    const userAgent = request.headers['user-agent'];
    const issued = await authService.login(input.username, input.password, {
      ipAddress: request.ip,
      ...(userAgent ? { userAgent } : {}),
    });
    const maxAge = Math.max(1, Math.floor((issued.expiresAt.getTime() - Date.now()) / 1000));
    reply.setCookie(SESSION_COOKIE, issued.token, {
      ...cookieBase,
      httpOnly: true,
      secure: cookieSecure,
      maxAge,
    });
    reply.setCookie(CSRF_COOKIE, issued.csrfToken, {
      ...cookieBase,
      httpOnly: false,
      secure: cookieSecure,
      maxAge,
    });
    return {
      admin: issued.admin,
      csrfToken: issued.csrfToken,
      expiresAt: issued.expiresAt.toISOString(),
    };
  });

  app.get('/api/auth/session', async (request) => {
    const session = await requireSession(request, authService);
    const csrfToken = request.cookies[CSRF_COOKIE] ?? '';
    return {
      admin: session.admin,
      csrfToken: authService.verifyCsrf(session, csrfToken) ? csrfToken : '',
      expiresAt: session.expiresAt.toISOString(),
    };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const session = await requireSession(request, authService);
    requireCsrf(request, authService, session);
    await authService.logout(request.cookies[SESSION_COOKIE]);
    reply.clearCookie(SESSION_COOKIE, cookieBase);
    reply.clearCookie(CSRF_COOKIE, cookieBase);
    return reply.status(204).send();
  });

  app.post('/api/auth/password', async (request, reply) => {
    const session = await requireSession(request, authService);
    requireCsrf(request, authService, session);
    const input = ChangePasswordRequestSchema.parse(request.body);
    await authService.changePassword(
      request.cookies[SESSION_COOKIE]!,
      input.currentPassword,
      input.newPassword,
    );
    reply.clearCookie(SESSION_COOKIE, cookieBase);
    reply.clearCookie(CSRF_COOKIE, cookieBase);
    return reply.status(204).send();
  });
}
