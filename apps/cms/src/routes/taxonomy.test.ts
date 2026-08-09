import { describe, expect, it } from 'vitest';

import { buildApp } from '../app.js';
import type { TaxonomyKind, TaxonomyRepository } from '../repositories/taxonomy-repository.js';
import { cookieHeader, createTestAuthService } from '../test/test-auth.js';

class MemoryTaxonomyRepository implements TaxonomyRepository {
  private readonly values: Record<TaxonomyKind, Array<{ id: string; name: string; slug: string }>> = {
    categories: [], tags: [],
  };

  async list(kind: TaxonomyKind) { return this.values[kind]; }
  async create(kind: TaxonomyKind, input: { name: string; slug: string }) {
    const value = { id: String(this.values[kind].length + 1), ...input };
    this.values[kind].push(value);
    return value;
  }
  async update(kind: TaxonomyKind, id: string, input: { name: string; slug: string }) {
    const index = this.values[kind].findIndex((value) => value.id === id);
    if (index < 0) throw new Error('分类或标签不存在');
    const value = { id, ...input };
    this.values[kind][index] = value;
    return value;
  }
  async delete(kind: TaxonomyKind, id: string) {
    this.values[kind] = this.values[kind].filter((value) => value.id !== id);
  }
}

describe('taxonomy routes', () => {
  it('creates and lists categories for the authenticated administrator', async () => {
    const app = await buildApp({
      authService: await createTestAuthService(), cookieSecure: false,
      taxonomyRepository: new MemoryTaxonomyRepository(),
    });
    const login = await app.inject({
      method: 'POST', url: '/api/auth/login', payload: { username: 'admin', password: 'correct password' },
    });
    const cookie = cookieHeader(login.headers['set-cookie']);
    const csrf = login.json().csrfToken as string;

    const create = await app.inject({
      method: 'POST', url: '/api/categories', headers: { cookie, 'x-csrf-token': csrf },
      payload: { name: '学习笔记', slug: 'notes' },
    });
    expect(create.statusCode).toBe(201);

    const list = await app.inject({ method: 'GET', url: '/api/categories', headers: { cookie } });
    expect(list.json()).toEqual({ items: [{ id: '1', name: '学习笔记', slug: 'notes' }] });
  });
});
