import { describe, expect, it } from 'vitest';

import { PostInputSchema } from './posts.js';

describe('PostInputSchema', () => {
  it('trims a valid title', () => {
    const parsed = PostInputSchema.parse({
      title: '  Astro 发布后台  ',
      slug: 'astro-cms',
      description: '说明',
      markdown: '# 正文',
      status: 'draft',
      tagIds: [],
      pinned: false,
    });

    expect(parsed.title).toBe('Astro 发布后台');
  });

  it('rejects an empty title', () => {
    expect(() => PostInputSchema.parse({
      title: ' ',
      slug: 'astro-cms',
      description: '说明',
      markdown: '# 正文',
      status: 'draft',
      tagIds: [],
      pinned: false,
    })).toThrow();
  });
});
