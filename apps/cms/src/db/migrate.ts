import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Pool, RowDataPacket } from 'mysql2/promise';

import { loadConfig } from '../config.js';
import { createDatabasePool } from './client.js';

type MigrationRow = RowDataPacket & { name: string };

export async function listMigrationFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^\d{3}_[a-z0-9_-]+\.sql$/i.test(entry.name))
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right), 'en'));
}

export async function runMigrations(pool: Pool, directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const [lockRows] = await connection.query<RowDataPacket[]>('SELECT GET_LOCK(?, 30) AS acquired', ['blog_cms_migrate']);
    if (Number(lockRows[0]?.acquired) !== 1) {
      throw new Error('无法获取数据库迁移锁');
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    const [rows] = await connection.query<MigrationRow[]>('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name));

    for (const file of await listMigrationFiles(directory)) {
      const name = path.basename(file);
      if (applied.has(name)) continue;
      const sql = await readFile(file, 'utf8');
      await connection.query(sql);
      await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
    }
  } finally {
    await connection.query('SELECT RELEASE_LOCK(?)', ['blog_cms_migrate']).catch(() => undefined);
    connection.release();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  const pool = createDatabasePool(config.databaseUrl);
  runMigrations(pool)
    .then(() => console.log('CMS database migrations completed.'))
    .finally(() => pool.end());
}
