import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RowDataPacket } from 'mysql2/promise';
import { describe, expect, it } from 'vitest';

import { createDatabasePool } from './client.js';
import { runMigrations } from './migrate.js';

const databaseUrl = process.env.CMS_TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration('database migrations', () => {
  it('can run twice and creates every required table', async () => {
    const pool = createDatabasePool(databaseUrl!);
    const migrationDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
    try {
      await runMigrations(pool, migrationDirectory);
      await runMigrations(pool, migrationDirectory);
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `);
      const names = rows.map((row) => String(row.table_name)).sort();
      expect(names).toEqual(expect.arrayContaining([
        'admin_sessions',
        'admin_users',
        'categories',
        'deployment_state',
        'post_tags',
        'post_versions',
        'posts',
        'publish_jobs',
        'schema_migrations',
        'tags',
      ]));
    } finally {
      await pool.end();
    }
  });
});
