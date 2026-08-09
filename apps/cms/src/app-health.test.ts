import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';
import type { AuthService } from './services/auth-service.js';

const temporaryDirectories: string[] = [];
afterEach(async () => Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

describe('health and admin hosting', () => {
  it('reports readiness and serves the SPA for client routes without masking API 404s', async () => {
    const adminDist = await mkdtemp(path.join(tmpdir(), 'blog-cms-admin-'));
    temporaryDirectories.push(adminDist);
    await writeFile(path.join(adminDist, 'index.html'), '<!doctype html><title>Blog CMS</title>', 'utf8');
    const app = await buildApp({
      authService: {} as AuthService, cookieSecure: false, adminDist, readiness: async () => undefined,
    });

    expect((await app.inject({ url: '/api/health/ready' })).statusCode).toBe(200);
    expect((await app.inject({ url: '/articles/1' })).body).toContain('Blog CMS');
    expect((await app.inject({ url: '/api/missing' })).statusCode).toBe(404);
    await app.close();
  });

  it('returns 503 when the database readiness probe fails', async () => {
    const app = await buildApp({
      authService: {} as AuthService, cookieSecure: false,
      readiness: async () => { throw new Error('database unavailable'); },
    });
    expect((await app.inject({ url: '/api/health/ready' })).statusCode).toBe(503);
    await app.close();
  });
});
