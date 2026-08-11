import type { PublishTrigger } from '@blog/contracts';

import type { PublishedSnapshot, StoredPost } from '../repositories/types.js';

export type PublishRequest = {
  id: string;
  trigger: PublishTrigger;
};

export type PublisherPorts = {
  snapshot(): Promise<PublishedSnapshot>;
  prepareWorkspace(request: PublishRequest, revision: number): Promise<string>;
  exportPosts(workspace: string, posts: StoredPost[]): Promise<void>;
  build(workspace: string): Promise<void>;
  verify(workspace: string): Promise<void>;
  activate(workspace: string, revision: number): Promise<void>;
  sync?(workspace: string, revision: number): Promise<void>;
  recordSuccess(request: PublishRequest, workspace: string, revision: number): Promise<void>;
  recordFailure(request: PublishRequest, error: Error): Promise<void>;
};

export type PublishResult = {
  workspace: string;
  revision: number;
};

export class Publisher {
  constructor(private readonly ports: PublisherPorts) {}

  async publish(request: PublishRequest): Promise<PublishResult> {
    try {
      const snapshot = await this.ports.snapshot();
      const workspace = await this.ports.prepareWorkspace(request, snapshot.revision);
      await this.ports.exportPosts(workspace, snapshot.posts);
      await this.ports.build(workspace);
      await this.ports.verify(workspace);
      await this.ports.activate(workspace, snapshot.revision);
      await this.ports.sync?.(workspace, snapshot.revision);
      await this.ports.recordSuccess(request, workspace, snapshot.revision);
      return { workspace, revision: snapshot.revision };
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      await this.ports.recordFailure(request, failure);
      throw failure;
    }
  }
}
