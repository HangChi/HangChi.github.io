import { hash } from 'argon2';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import {
  AuthService,
  type AuthRepository,
  type NewSession,
  type SessionRecord,
} from '../services/auth-service.js';

class RouteAuthRepository implements AuthRepository {
  private readonly sessions: SessionRecord[] = [];

  constructor(private readonly passwordHash: string) {}

  async findAdminByUsername(username: string) {
    return username === 'admin'
      ? { id: '1', username: 'admin', passwordHash: this.passwordHash }
      : null;
  }

  async createSession(session: NewSession) {
    const record: SessionRecord = {
      ...session,
      id: String(this.sessions.length + 1),
      username: 'admin',
      revokedAt: null,
    };
    this.sessions.push(record);
    return record;
  }

  async findSessionByTokenHash(tokenHash: Buffer) {
    return this.sessions.find((session) => session.tokenHash.equals(tokenHash)) ?? null;
  }

  async touchSession() {}

  async revokeSession(tokenHash: Buffer) {
    const session = await this.findSessionByTokenHash(tokenHash);
    if (session) session.revokedAt = new Date();
  }

  async updatePassword() {}
}

describe('authentication routes', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    const repository = new RouteAuthRepository(await hash('correct password'));
    app = await buildApp({
      authService: new AuthService(repository, { sessionHours: 12 }),
      cookieSecure: false,
    });
  });

  it('rejects session lookup without a login cookie', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/session' });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ code: 'UNAUTHORIZED', message: '请先登录' });
  });

  it('logs in, exposes the safe session, and requires CSRF for logout', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { username: 'admin', password: 'correct password' },
    });
    expect(login.statusCode).toBe(200);
    const setCookieHeader = login.headers['set-cookie'];
    const cookie = (Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader])
      .filter((value): value is string => Boolean(value))
      .map((value) => value.split(';')[0])
      .join('; ');
    expect(cookie).toMatch(/(?:^|; )blog_cms_session=/);
    expect(cookie).toMatch(/(?:^|; )blog_cms_csrf=/);
    const loginBody = login.json();
    expect(loginBody).toMatchObject({ admin: { id: '1', username: 'admin' } });
    expect(loginBody.csrfToken).toHaveLength(43);

    const session = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: { cookie },
    });
    expect(session.statusCode).toBe(200);
    expect(session.json()).not.toHaveProperty('tokenHash');

    const missingCsrf = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie },
    });
    expect(missingCsrf.statusCode).toBe(403);

    const logout = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie, 'x-csrf-token': loginBody.csrfToken },
    });
    expect(logout.statusCode).toBe(204);

    const afterLogout = await app.inject({
      method: 'GET',
      url: '/api/auth/session',
      headers: { cookie },
    });
    expect(afterLogout.statusCode).toBe(401);
  });
});
