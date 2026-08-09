import { createPool, type Pool } from 'mysql2/promise';

export function createDatabasePool(databaseUrl: string): Pool {
  const url = new URL(databaseUrl);
  if (url.protocol !== 'mysql:') {
    throw new Error('CMS_DATABASE_URL 必须使用 mysql://');
  }

  return createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
    charset: 'utf8mb4',
    timezone: 'Z',
    connectionLimit: 10,
    enableKeepAlive: true,
    multipleStatements: true,
    namedPlaceholders: false,
    decimalNumbers: true,
  });
}
