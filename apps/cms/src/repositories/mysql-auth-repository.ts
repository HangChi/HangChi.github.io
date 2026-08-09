import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import type {
  AdminRecord,
  AuthRepository,
  NewSession,
  SessionRecord,
} from '../services/auth-service.js';

type AdminRow = RowDataPacket & {
  id: string | number;
  username: string;
  password_hash: string;
};

type SessionRow = RowDataPacket & {
  id: string | number;
  admin_user_id: string | number;
  username: string;
  token_hash: Buffer;
  csrf_hash: Buffer;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  last_seen_at: Date;
  revoked_at: Date | null;
};

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: String(row.id),
    adminUserId: String(row.admin_user_id),
    username: row.username,
    tokenHash: row.token_hash,
    csrfHash: row.csrf_hash,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    revokedAt: row.revoked_at,
  };
}

export class MysqlAuthRepository implements AuthRepository {
  constructor(private readonly pool: Pool) {}

  async findAdminByUsername(username: string): Promise<AdminRecord | null> {
    const [rows] = await this.pool.execute<AdminRow[]>(`
      SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1
    `, [username]);
    const row = rows[0];
    return row ? { id: String(row.id), username: row.username, passwordHash: row.password_hash } : null;
  }

  async createSession(session: NewSession): Promise<SessionRecord> {
    const [result] = await this.pool.execute<ResultSetHeader>(`
      INSERT INTO admin_sessions (
        admin_user_id, token_hash, csrf_hash, ip_address, user_agent, expires_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      session.adminUserId,
      session.tokenHash,
      session.csrfHash,
      session.ipAddress,
      session.userAgent,
      session.expiresAt,
      session.lastSeenAt,
    ]);
    const stored = await this.findSessionById(String(result.insertId));
    if (!stored) throw new Error('创建会话后无法读取会话');
    return stored;
  }

  private async findSessionById(id: string): Promise<SessionRecord | null> {
    const [rows] = await this.pool.execute<SessionRow[]>(`
      SELECT s.id, s.admin_user_id, u.username, s.token_hash, s.csrf_hash,
        s.ip_address, s.user_agent, s.expires_at, s.last_seen_at, s.revoked_at
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.id = ?
    `, [id]);
    return rows[0] ? mapSession(rows[0]) : null;
  }

  async findSessionByTokenHash(tokenHash: Buffer): Promise<SessionRecord | null> {
    const [rows] = await this.pool.execute<SessionRow[]>(`
      SELECT s.id, s.admin_user_id, u.username, s.token_hash, s.csrf_hash,
        s.ip_address, s.user_agent, s.expires_at, s.last_seen_at, s.revoked_at
      FROM admin_sessions s
      INNER JOIN admin_users u ON u.id = s.admin_user_id
      WHERE s.token_hash = ?
      LIMIT 1
    `, [tokenHash]);
    return rows[0] ? mapSession(rows[0]) : null;
  }

  async touchSession(id: string, at: Date): Promise<void> {
    await this.pool.execute('UPDATE admin_sessions SET last_seen_at = ? WHERE id = ?', [at, id]);
  }

  async revokeSession(tokenHash: Buffer): Promise<void> {
    await this.pool.execute(`
      UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP(3)) WHERE token_hash = ?
    `, [tokenHash]);
  }

  async updatePassword(adminUserId: string, passwordHash: string): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(`
        UPDATE admin_users
        SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP(3)
        WHERE id = ?
      `, [passwordHash, adminUserId]);
      await connection.execute(`
        UPDATE admin_sessions
        SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP(3))
        WHERE admin_user_id = ?
      `, [adminUserId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
