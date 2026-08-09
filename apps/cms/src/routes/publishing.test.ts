import { describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import type { PublishJobRecord, PublishJobStore } from '../services/publish-queue.js';
import { cookieHeader, createTestAuthService } from '../test/test-auth.js';

class PublishingStore implements PublishJobStore {
  jobs: PublishJobRecord[] = [{
    id: '1', revision: 3, trigger: 'publish', status: 'failed', releaseName: null,
    errorSummary: 'build failed', log: 'build failed', queuedAt: new Date('2026-08-09T00:00:00Z'),
    startedAt: new Date('2026-08-09T00:01:00Z'), completedAt: new Date('2026-08-09T00:02:00Z'),
  }];
  async enqueue(trigger: PublishJobRecord['trigger']) {
    const job = { ...this.jobs[0]!, id: String(this.jobs.length + 1), trigger, status: 'queued' as const };
    this.jobs.push(job); return job;
  }
  async claimNext() { return null; }
  async find(id: string) { return this.jobs.find((job) => job.id === id) ?? null; }
  async list() { return this.jobs; }
  async state() {
    return { databaseRevision: 3, deployedRevision: 2, activeRelease: 'release-2', activeJob: null, lastJob: null };
  }
  async markSucceeded() {}
  async markFailed() {}
}

describe('publishing routes', () => {
  it('shows state and retries a failed job', async () => {
    const store = new PublishingStore();
    const app = await buildApp({
      authService: await createTestAuthService(), cookieSecure: false,
      publishJobStore: store,
      publishQueue: { enqueue: async (trigger) => { await store.enqueue(trigger); } },
    });
    const login = await app.inject({
      method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password: 'correct password' },
    });
    const cookie = cookieHeader(login.headers['set-cookie']);
    const csrf = login.json().csrfToken as string;

    const state = await app.inject({ method: 'GET', url: '/api/publishing/state', headers: { cookie } });
    expect(state.json()).toMatchObject({ databaseRevision: 3, deployedRevision: 2 });

    const retry = await app.inject({
      method: 'POST', url: '/api/publishing/jobs/1/retry', headers: { cookie, 'x-csrf-token': csrf },
    });
    expect(retry.statusCode).toBe(202);
    expect(store.jobs.at(-1)?.trigger).toBe('retry');
  });
});
