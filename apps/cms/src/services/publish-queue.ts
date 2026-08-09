import type { DeploymentStateDto, PublishJobStatus, PublishTrigger } from '@blog/contracts';

export type PublishJobRecord = {
  id: string;
  revision: number;
  trigger: PublishTrigger;
  status: PublishJobStatus;
  releaseName: string | null;
  errorSummary: string | null;
  log: string;
  queuedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

export interface PublishJobStore {
  enqueue(trigger: PublishTrigger): Promise<PublishJobRecord>;
  claimNext(): Promise<PublishJobRecord | null>;
  find(id: string): Promise<PublishJobRecord | null>;
  list(limit?: number): Promise<PublishJobRecord[]>;
  state(): Promise<DeploymentStateDto>;
  markSucceeded(id: string, releaseName: string, revision: number, log: string): Promise<void>;
  markFailed(id: string, errorSummary: string, log: string): Promise<void>;
}

export class PublishQueue {
  private draining: Promise<void> | null = null;

  constructor(
    private readonly store: PublishJobStore,
    private readonly worker: (job: PublishJobRecord) => Promise<void>,
  ) {}

  async enqueue(trigger: PublishTrigger): Promise<void> {
    await this.store.enqueue(trigger);
    void this.drain();
  }

  async drain(): Promise<void> {
    if (this.draining) return this.draining;
    this.draining = this.run().finally(() => {
      this.draining = null;
    });
    return this.draining;
  }

  private async run(): Promise<void> {
    for (;;) {
      const job = await this.store.claimNext();
      if (!job) return;
      try {
        await this.worker(job);
      } catch {
        // The publisher records bounded failure details before rethrowing.
      }
    }
  }
}
