import { hash } from 'argon2';

import {
  AuthService,
  type AuthRepository,
  type NewSession,
  type SessionRecord,
} from '../services/auth-service.js';

class TestAuthRepository implements AuthRepository {
  private readonly sessions: SessionRecord[] = [];

  constructor(private readonly passwordHash: string) {}

  async findAdminByUsername(username: string) {
    return username === 'admin' ? { id: '1', username, passwordHash: this.passwordHash } : null;
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
  async revokeSession() {}
  async updatePassword() {}
}

export async function createTestAuthService(): Promise<AuthService> {
  return new AuthService(new TestAuthRepository(await hash('correct password')), { sessionHours: 12 });
}

export function cookieHeader(setCookieHeader: string | string[] | undefined): string {
  return (Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader])
    .filter((value): value is string => Boolean(value))
    .map((value) => value.split(';')[0])
    .join('; ');
}
