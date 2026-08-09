import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../config.js';
import { createDatabasePool } from '../db/client.js';
import { runMigrations } from '../db/migrate.js';
import { MysqlImportStore } from '../repositories/mysql-import-store.js';
import { Importer } from '../services/importer.js';

export async function runImport(arguments_: string[] = process.argv.slice(2)): Promise<void> {
  const sourceArgument = arguments_.find((value) => value.startsWith('--source='));
  const source = path.resolve(sourceArgument?.slice('--source='.length) || 'src/content/blog');
  const dryRun = arguments_.includes('--dry-run');
  if (dryRun) {
    const importer = new Importer({ upsert: async () => 'unchanged' });
    const report = await importer.dryRun(source);
    console.log(JSON.stringify(report, null, 2));
    if (report.errors.length) process.exitCode = 1;
    return;
  }
  const config = loadConfig();
  const pool = createDatabasePool(config.databaseUrl);
  try {
    await runMigrations(pool);
    const importer = new Importer(new MysqlImportStore(pool));
    const report = await importer.import(source);
    console.log(JSON.stringify(report, null, 2));
    if (report.errors.length) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runImport().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
