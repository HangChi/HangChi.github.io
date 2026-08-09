import { describe, expect, it } from 'vitest';

import { MemoryPostRepository } from '../test/memory-post-repository.js';
import { PostService } from './post-service.js';

const draft = {
  id: '1', slug: 'draft', title: '草稿', description: '', markdown: '# 草稿',
  status: 'draft' as const, category: null, tags: [], pinned: false,
  publishedAt: null, sourceExtension: 'md' as const, sourcePath: null, sourceHash: null,
  version: 1, deletedAt: null,
  createdAt: new Date('2026-08-09T00:00:00.000Z'),
  updatedAt: new Date('2026-08-09T00:00:00.000Z'),
};

describe('PostService', () => {
  it('publishes a draft and enqueues a static rebuild', async () => {
    const repository = new MemoryPostRepository([draft]);
    const triggers: string[] = [];
    const service = new PostService(repository, { enqueue: async (trigger) => { triggers.push(trigger); } });

    const post = await service.publish('1', 1);

    expect(post.status).toBe('published');
    expect(post.publishedAt).not.toBeNull();
    expect(triggers).toEqual(['publish']);
  });

  it('creates a draft without enqueueing a public rebuild', async () => {
    const repository = new MemoryPostRepository();
    const triggers: string[] = [];
    const service = new PostService(repository, { enqueue: async (trigger) => { triggers.push(trigger); } });
    await service.create({
      title: '新文章', slug: 'new-post', description: '', markdown: '', status: 'draft',
      categoryId: null, tagIds: [], pinned: false, sourceExtension: 'md', sourcePath: null,
    });
    expect(triggers).toEqual([]);
  });
});
