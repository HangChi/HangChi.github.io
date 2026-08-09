import { describe, expect, it } from 'vitest';

import { PublishQueue, type PublishJobRecord, type PublishJobStore } from './publish-queue.js';

class MemoryJobStore implements PublishJobStore {
  readonly jobs: PublishJobRecord[] = [];
  async enqueue(trigger: PublishJobRecord['trigger']) {
    const job: PublishJobRecord = {
      id: String(this.jobs.length + 1), revision: this.jobs.length + 1,
      trigger, status: 'queued', releaseName: null, errorSummary: null, log: '',
      queuedAt: new Date(), startedAt: null, completedAt: null,
    };
    this.jobs.push(job);
    return job;
  }
  async claimNext() {
    const job = this.jobs.find((value) => value.status === 'queued') ?? null;
    if (job) job.status = 'running';
    return job;
  }
  async find() { return null; }
  async list() { return this.jobs; }
  async state() { return { databaseRevision: 0, deployedRevision: 0, activeRelease: null, activeJob: null, lastJob: null }; }
  async markSucceeded() {}
  async markFailed() {}
}

describe('PublishQueue', () => {
  it('runs publishing jobs one at a time', async () => {
    const store = new MemoryJobStore();
    let active = 0;
    let maximumActive = 0;
    const queue = new PublishQueue(store, async (job) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      job.status = 'succeeded';
      active -= 1;
    });
    await Promise.all([queue.enqueue('publish'), queue.enqueue('unpublish'), queue.enqueue('delete')]);
    await queue.drain();
    expect(maximumActive).toBe(1);
    expect(store.jobs.map((job) => job.status)).toEqual(['succeeded', 'succeeded', 'succeeded']);
  });
});
