import type { FastifyRequest } from 'fastify';

import type { AuthenticatedSession, AuthService } from '../services/auth-service.js';

export const SESSION_COOKIE = 'blog_cms_session';
export const CSRF_COOKIE = 'blog_cms_csrf';

export class HttpAuthError extends Error {
  constructor(
    readonly statusCode: 401 | 403,
    readonly code: 'UNAUTHORIZED' | 'CSRF_INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'HttpAuthError';
  }
}

export async function requireSession(request: FastifyRequest, authService: AuthService): Promise<AuthenticatedSession> {
  const session = await authService.authenticate(request.cookies[SESSION_COOKIE]);
  if (!session) throw new HttpAuthError(401, 'UNAUTHORIZED', '请先登录');
  return session;
}

export function requireCsrf(request: FastifyRequest, authService: AuthService, session: AuthenticatedSession): void {
  const header = request.headers['x-csrf-token'];
  const csrfToken = Array.isArray(header) ? header[0] : header;
  if (!authService.verifyCsrf(session, csrfToken)) {
    throw new HttpAuthError(403, 'CSRF_INVALID', '安全令牌无效，请刷新后重试');
  }
}
