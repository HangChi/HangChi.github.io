import type { PostQuery } from '@blog/contracts';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { describe, expect, it } from 'vitest';

import { MysqlPostRepository } from './mysql-post-repository.js';
import { MysqlPublishJobStore } from './mysql-publish-job-store.js';

function mysql84Pool(): Pool {
  const result = (rows: RowDataPacket[]) => [rows, []] as never;

  return {
    execute: async (sql: string) => {
      if (/LIMIT\s+\?/i.test(sql)) {
        const error = new Error('Incorrect arguments to mysqld_stmt_execute') as Error & { code: string };
        error.code = 'ER_WRONG_ARGUMENTS';
        throw error;
      }
      if (/COUNT\(\*\)/i.test(sql)) return result([{ total: 0 } as RowDataPacket]);
      return result([]);
    },
    query: async () => result([]),
  } as unknown as Pool;
}

const defaultQuery: PostQuery = {
  search: '',
  status: 'all',
  sort: 'updated-desc',
  page: 1,
  pageSize: 20,
};

describe('MySQL 8.4 LIMIT parameter compatibility', () => {
  it('lists posts without using a prepared LIMIT parameter', async () => {
    const repository = new MysqlPostRepository(mysql84Pool());

    await expect(repository.list(defaultQuery)).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
  });

  it('lists post versions without using a prepared LIMIT parameter', async () => {
    const repository = new MysqlPostRepository(mysql84Pool());

    await expect(repository.listVersions('1')).resolves.toEqual([]);
  });

  it('lists publish jobs without using a prepared LIMIT parameter', async () => {
    const store = new MysqlPublishJobStore(mysql84Pool());

    await expect(store.list()).resolves.toEqual([]);
  });
});
