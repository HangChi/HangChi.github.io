import { hash } from 'argon2';
import { describe, expect, it } from 'vitest';

import {
  AuthService,
  InvalidCredentialsError,
  type AuthRepository,
  type NewSession,
  type SessionRecord,
} from './auth-service.js';

class MemoryAuthRepository implements AuthRepository {
  sessions: SessionRecord[] = [];

  constructor(private readonly passwordHash: string) {}

  async findAdminByUsername(username: string) {
    return username === 'admin'
      ? { id: '1', username: 'admin', passwordHash: this.passwordHash }
      : null;
  }

  async createSession(session: NewSession) {
    const record = {
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
    if (session) session.revokedAt = new Date('2026-08-09T02:00:00.000Z');
  }

  async updatePassword() {}
}

describe('AuthService', () => {
  it('stores only hashes and authenticates the issued opaque token', async () => {
    const passwordHash = await hash('correct password');
    const repository = new MemoryAuthRepository(passwordHash);
    const auth = new AuthService(repository, {
      now: () => new Date('2026-08-09T00:00:00.000Z'),
      sessionHours: 12,
    });

    const issued = await auth.login('admin', 'correct password', {
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });

    expect(repository.sessions[0]?.tokenHash.toString('hex')).not.toContain(issued.token);
    expect(repository.sessions[0]?.csrfHash.toString('hex')).not.toContain(issued.csrfToken);
    await expect(auth.authenticate(issued.token)).resolves.toMatchObject({
      admin: { id: '1', username: 'admin' },
    });
  });

  it('rejects a wrong password with a generic credentials error', async () => {
    const repository = new MemoryAuthRepository(await hash('correct password'));
    const auth = new AuthService(repository, {
      now: () => new Date('2026-08-09T00:00:00.000Z'),
      sessionHours: 12,
    });

    await expect(auth.login('admin', 'wrong password', {})).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects a revoked session', async () => {
    const repository = new MemoryAuthRepository(await hash('correct password'));
    const auth = new AuthService(repository, {
      now: () => new Date('2026-08-09T00:00:00.000Z'),
      sessionHours: 12,
    });
    const issued = await auth.login('admin', 'correct password', {});
    await auth.logout(issued.token);

    await expect(auth.authenticate(issued.token)).resolves.toBeNull();
  });
});
