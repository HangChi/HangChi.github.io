import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { hash, verify } from 'argon2';

export type AdminRecord = {
  id: string;
  username: string;
  passwordHash: string;
};

export type NewSession = {
  adminUserId: string;
  tokenHash: Buffer;
  csrfHash: Buffer;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  lastSeenAt: Date;
};

export type SessionRecord = NewSession & {
  id: string;
  username: string;
  revokedAt: Date | null;
};

export interface AuthRepository {
  findAdminByUsername(username: string): Promise<AdminRecord | null>;
  createSession(session: NewSession): Promise<SessionRecord>;
  findSessionByTokenHash(tokenHash: Buffer): Promise<SessionRecord | null>;
  touchSession(id: string, at: Date): Promise<void>;
  revokeSession(tokenHash: Buffer): Promise<void>;
  updatePassword(adminUserId: string, passwordHash: string): Promise<void>;
}

export type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

export type IssuedSession = {
  token: string;
  csrfToken: string;
  admin: { id: string; username: string };
  expiresAt: Date;
};

export type AuthenticatedSession = {
  sessionId: string;
  tokenHash: Buffer;
  csrfHash: Buffer;
  admin: { id: string; username: string };
  expiresAt: Date;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super('用户名或密码错误');
    this.name = 'InvalidCredentialsError';
  }
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function opaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export class AuthService {
  private readonly now: () => Date;
  private readonly sessionHours: number;
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly repository: AuthRepository,
    options: { now?: () => Date; sessionHours: number },
  ) {
    this.now = options.now ?? (() => new Date());
    this.sessionHours = options.sessionHours;
    this.dummyHash = hash('blog-cms-invalid-user-placeholder');
  }

  async login(username: string, password: string, meta: RequestMeta): Promise<IssuedSession> {
    const normalizedUsername = username.trim().toLocaleLowerCase('en-US');
    const admin = await this.repository.findAdminByUsername(normalizedUsername);
    const passwordHash = admin?.passwordHash ?? await this.dummyHash;
    const passwordMatches = await verify(passwordHash, password).catch(() => false);
    if (!admin || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const now = this.now();
    const expiresAt = new Date(now.getTime() + this.sessionHours * 60 * 60 * 1000);
    const token = opaqueToken();
    const csrfToken = opaqueToken();
    await this.repository.createSession({
      adminUserId: admin.id,
      tokenHash: digest(token),
      csrfHash: digest(csrfToken),
      ipAddress: meta.ipAddress?.slice(0, 64) ?? null,
      userAgent: meta.userAgent?.slice(0, 512) ?? null,
      expiresAt,
      lastSeenAt: now,
    });

    return {
      token,
      csrfToken,
      admin: { id: admin.id, username: admin.username },
      expiresAt,
    };
  }

  async authenticate(token: string | undefined): Promise<AuthenticatedSession | null> {
    if (!token || token.length < 32 || token.length > 128) return null;
    const tokenHash = digest(token);
    const session = await this.repository.findSessionByTokenHash(tokenHash);
    const now = this.now();
    if (!session || session.revokedAt || session.expiresAt.getTime() <= now.getTime()) return null;
    if (now.getTime() - session.lastSeenAt.getTime() >= 5 * 60 * 1000) {
      await this.repository.touchSession(session.id, now);
    }
    return {
      sessionId: session.id,
      tokenHash,
      csrfHash: session.csrfHash,
      admin: { id: session.adminUserId, username: session.username },
      expiresAt: session.expiresAt,
    };
  }

  verifyCsrf(session: AuthenticatedSession, csrfToken: string | undefined): boolean {
    if (!csrfToken) return false;
    const candidate = digest(csrfToken);
    return candidate.length === session.csrfHash.length && timingSafeEqual(candidate, session.csrfHash);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.repository.revokeSession(digest(token));
  }

  async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const session = await this.authenticate(token);
    if (!session) throw new InvalidCredentialsError();
    const admin = await this.repository.findAdminByUsername(session.admin.username);
    if (!admin || !(await verify(admin.passwordHash, currentPassword).catch(() => false))) {
      throw new InvalidCredentialsError();
    }
    await this.repository.updatePassword(admin.id, await hash(newPassword));
  }
}
