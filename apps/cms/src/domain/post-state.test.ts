import { describe, expect, it } from 'vitest';

import { transitionPost } from './post-state.js';
import type { StoredPost } from '../repositories/types.js';

const basePost: StoredPost = {
  id: '1',
  slug: 'astro-cms',
  title: 'Astro CMS',
  description: '说明',
  markdown: '# 正文',
  status: 'draft',
  category: null,
  tags: [],
  pinned: false,
  publishedAt: null,
  sourceExtension: 'md',
  sourcePath: null,
  sourceHash: null,
  version: 3,
  deletedAt: null,
  createdAt: new Date('2026-08-09T00:00:00.000Z'),
  updatedAt: new Date('2026-08-09T00:00:00.000Z'),
};

describe('transitionPost', () => {
  it('publishes a draft with a publish timestamp and rebuild requirement', () => {
    const result = transitionPost(basePost, { type: 'publish' }, new Date('2026-08-09T01:00:00.000Z'));
    expect(result.next.status).toBe('published');
    expect(result.next.publishedAt).toEqual(new Date('2026-08-09T01:00:00.000Z'));
    expect(result.requiresPublish).toBe(true);
    expect(result.reason).toBe('publish');
  });

  it('unpublishes a published post and keeps its original publish timestamp', () => {
    const published = { ...basePost, status: 'published' as const, publishedAt: new Date('2026-08-08T00:00:00.000Z') };
    const result = transitionPost(published, { type: 'unpublish' }, new Date('2026-08-09T01:00:00.000Z'));
    expect(result.next.status).toBe('draft');
    expect(result.next.publishedAt).toEqual(new Date('2026-08-08T00:00:00.000Z'));
    expect(result.requiresPublish).toBe(true);
  });

  it('does not allow permanent deletion outside the recycle bin', () => {
    expect(() => transitionPost(basePost, { type: 'permanently-delete' }, new Date())).toThrow('回收站');
  });
});
