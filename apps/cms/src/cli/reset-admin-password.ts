import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ADMIN_PASSWORD_MIN_LENGTH } from '@blog/contracts';
import { hash } from 'argon2';
import type { RowDataPacket } from 'mysql2/promise';

import { loadConfig } from '../config.js';
import { createDatabasePool } from '../db/client.js';

type CountRow = RowDataPacket & { total: number };

export function validatePasswordReset(password: string | undefined, administratorCount: number): asserts password is string {
  if (!password || password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    throw new Error(`CMS_ADMIN_PASSWORD must contain at least ${ADMIN_PASSWORD_MIN_LENGTH} characters`);
  }
  if (administratorCount !== 1) throw new Error('Password reset requires exactly one administrator');
}

export async function resetAdminPassword(environment: NodeJS.ProcessEnv = process.env): Promise<void> {
  const pool = createDatabasePool(loadConfig(environment).databaseUrl);
  try {
    const [rows] = await pool.query<CountRow[]>('SELECT COUNT(*) AS total FROM admin_users');
    const password = environment.CMS_ADMIN_PASSWORD;
    validatePasswordReset(password, Number(rows[0]?.total ?? 0));
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('UPDATE admin_users SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP(3)', [await hash(password)]);
      await connection.execute('UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE revoked_at IS NULL');
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  } finally { await pool.end(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  resetAdminPassword()
    .then(() => console.log('CMS administrator password reset.'))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
