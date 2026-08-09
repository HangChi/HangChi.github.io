import { describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import { PostService } from '../services/post-service.js';
import { MemoryPostRepository } from '../test/memory-post-repository.js';
import { cookieHeader, createTestAuthService } from '../test/test-auth.js';

async function authenticatedApp() {
  const postService = new PostService(new MemoryPostRepository(), { enqueue: async () => undefined });
  const app = await buildApp({
    authService: await createTestAuthService(),
    cookieSecure: false,
    postService,
  });
  const login = await app.inject({
    method: 'POST', url: '/api/auth/login',
    payload: { username: 'admin', password: 'correct password' },
  });
  return {
    app,
    cookie: cookieHeader(login.headers['set-cookie']),
    csrf: login.json().csrfToken as string,
  };
}

describe('post routes', () => {
  it('requires authentication for the article list', async () => {
    const app = await buildApp({
      authService: await createTestAuthService(),
      cookieSecure: false,
      postService: new PostService(new MemoryPostRepository(), { enqueue: async () => undefined }),
    });
    const response = await app.inject({ method: 'GET', url: '/api/posts' });
    expect(response.statusCode).toBe(401);
  });

  it('creates and searches a draft, then rejects a stale update', async () => {
    const { app, cookie, csrf } = await authenticatedApp();
    const create = await app.inject({
      method: 'POST', url: '/api/posts',
      headers: { cookie, 'x-csrf-token': csrf },
      payload: {
        title: 'Astro 后台', slug: 'astro-admin', description: '说明', markdown: '# 正文',
        status: 'draft', categoryId: null, tagIds: [], pinned: false, sourceExtension: 'md', sourcePath: null,
      },
    });
    expect(create.statusCode).toBe(201);
    const created = create.json();

    const list = await app.inject({
      method: 'GET', url: '/api/posts?search=Astro&status=draft', headers: { cookie },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().items).toHaveLength(1);

    const stale = await app.inject({
      method: 'PATCH', url: `/api/posts/${created.id}`,
      headers: { cookie, 'x-csrf-token': csrf },
      payload: { ...created, version: 99, categoryId: null, tagIds: [], sourceExtension: 'md' },
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json()).toMatchObject({ code: 'POST_VERSION_CONFLICT' });
  });
});
