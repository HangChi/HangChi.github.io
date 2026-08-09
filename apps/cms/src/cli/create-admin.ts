import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hash } from 'argon2';
import type { RowDataPacket } from 'mysql2/promise';

import { loadConfig } from '../config.js';
import { createDatabasePool } from '../db/client.js';
import { runMigrations } from '../db/migrate.js';

type CountRow = RowDataPacket & { total: number };

export async function createInitialAdmin(environment: NodeJS.ProcessEnv = process.env): Promise<void> {
  const username = (environment.CMS_ADMIN_USERNAME ?? 'admin').trim().toLocaleLowerCase('en-US');
  const password = environment.CMS_ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('CMS_ADMIN_PASSWORD 必须通过环境变量提供，且至少 12 个字符');
  }

  const config = loadConfig(environment);
  const pool = createDatabasePool(config.databaseUrl);
  try {
    await runMigrations(pool);
    const [rows] = await pool.query<CountRow[]>('SELECT COUNT(*) AS total FROM admin_users');
    if (Number(rows[0]?.total ?? 0) !== 0) {
      throw new Error('管理员已经存在，拒绝创建第二个账户');
    }
    await pool.execute(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [username, await hash(password)],
    );
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createInitialAdmin()
    .then(() => console.log('Initial CMS administrator created.'))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
