import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDatabasePool } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { MysqlAuthRepository } from './repositories/mysql-auth-repository.js';
import { AuthService } from './services/auth-service.js';

const config = loadConfig();
const pool = createDatabasePool(config.databaseUrl);

await runMigrations(pool);

const authRepository = new MysqlAuthRepository(pool);
const app = await buildApp({
  authService: new AuthService(authRepository, { sessionHours: config.sessionHours }),
  cookieSecure: config.cookieSecure,
  logger: true,
});

const shutdown = async () => {
  await app.close();
  await pool.end();
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await app.listen({ host: config.host, port: config.port });
