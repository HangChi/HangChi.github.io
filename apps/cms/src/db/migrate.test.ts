import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { listMigrationFiles } from './migrate.js';

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

describe('listMigrationFiles', () => {
  it('returns only numbered SQL migrations in deterministic order', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'blog-cms-migrations-'));
    cleanup.push(directory);
    await Promise.all([
      writeFile(path.join(directory, '002_second.sql'), 'SELECT 2;'),
      writeFile(path.join(directory, '001_first.sql'), 'SELECT 1;'),
      writeFile(path.join(directory, 'README.md'), 'not a migration'),
    ]);

    await expect(listMigrationFiles(directory)).resolves.toEqual([
      path.join(directory, '001_first.sql'),
      path.join(directory, '002_second.sql'),
    ]);
  });
});
