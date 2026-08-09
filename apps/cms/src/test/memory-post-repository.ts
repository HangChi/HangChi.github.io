import type { PostInput, PostQuery } from '@blog/contracts';

import {
  PostVersionConflictError,
  type PostPage,
  type PostRepository,
  type PostVersion,
  type PublishedSnapshot,
  type StoredPost,
  type VersionReason,
} from '../repositories/types.js';

export class MemoryPostRepository implements PostRepository {
  readonly posts = new Map<string, StoredPost>();
  private sequence = 1;

  constructor(initial: StoredPost[] = []) {
    for (const post of initial) this.posts.set(post.id, structuredClone(post));
    this.sequence = initial.length + 1;
  }

  async list(query: PostQuery): Promise<PostPage> {
    let items = [...this.posts.values()];
    items = items.filter((post) => query.status === 'trash' ? Boolean(post.deletedAt) : !post.deletedAt);
    if (query.status === 'draft' || query.status === 'published') items = items.filter((post) => post.status === query.status);
    if (query.categoryId) items = items.filter((post) => post.category?.id === query.categoryId);
    if (query.tagId) items = items.filter((post) => post.tags.some((tag) => tag.id === query.tagId));
    if (query.search) {
      const search = query.search.toLocaleLowerCase('zh-CN');
      items = items.filter((post) => `${post.title} ${post.slug} ${post.description}`.toLocaleLowerCase('zh-CN').includes(search));
    }
    const total = items.length;
    const start = (query.page - 1) * query.pageSize;
    return { items: items.slice(start, start + query.pageSize), total, page: query.page, pageSize: query.pageSize };
  }

  async findById(id: string, includeDeleted = false) {
    const post = this.posts.get(id) ?? null;
    return post && (includeDeleted || !post.deletedAt) ? structuredClone(post) : null;
  }

  async create(input: PostInput, _reason: VersionReason = 'create') {
    const id = String(this.sequence++);
    const now = new Date('2026-08-09T00:00:00.000Z');
    const post: StoredPost = {
      id,
      slug: input.slug,
      title: input.title,
      description: input.description,
      markdown: input.markdown,
      status: input.status,
      category: input.categoryId ? { id: input.categoryId, name: '分类', slug: 'category' } : null,
      tags: input.tagIds.map((tagId) => ({ id: tagId, name: `标签${tagId}`, slug: `tag-${tagId}` })),
      pinned: input.pinned,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
      sourceExtension: input.sourceExtension,
      sourcePath: input.sourcePath ?? null,
      sourceHash: null,
      version: 1,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.posts.set(id, post);
    return structuredClone(post);
  }

  async update(id: string, input: PostInput, _reason: VersionReason = 'save') {
    const current = this.posts.get(id);
    if (!current || !input.version || current.version !== input.version) throw new PostVersionConflictError();
    const updated: StoredPost = {
      ...current,
      title: input.title,
      slug: input.slug,
      description: input.description,
      markdown: input.markdown,
      status: input.status,
      category: input.categoryId ? { id: input.categoryId, name: '分类', slug: 'category' } : null,
      tags: input.tagIds.map((tagId) => ({ id: tagId, name: `标签${tagId}`, slug: `tag-${tagId}` })),
      pinned: input.pinned,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : current.publishedAt,
      sourceExtension: input.sourceExtension,
      sourcePath: input.sourcePath ?? current.sourcePath,
      version: current.version + 1,
      updatedAt: new Date('2026-08-09T01:00:00.000Z'),
    };
    this.posts.set(id, updated);
    return structuredClone(updated);
  }

  async softDelete(id: string, expectedVersion: number) {
    const current = this.posts.get(id);
    if (!current || current.version !== expectedVersion) throw new PostVersionConflictError();
    const updated = { ...current, deletedAt: new Date(), version: current.version + 1 };
    this.posts.set(id, updated);
    return structuredClone(updated);
  }

  async restore(id: string, expectedVersion: number) {
    const current = this.posts.get(id);
    if (!current || current.version !== expectedVersion) throw new PostVersionConflictError();
    const updated = { ...current, deletedAt: null, version: current.version + 1 };
    this.posts.set(id, updated);
    return structuredClone(updated);
  }

  async permanentlyDelete(id: string) {
    const current = this.posts.get(id);
    if (!current?.deletedAt) throw new Error('只有回收站中的文章可以永久删除');
    this.posts.delete(id);
  }

  async listVersions(_id: string, _limit = 50): Promise<PostVersion[]> {
    return [];
  }

  async restoreVersion(id: string, _versionId: string, expectedVersion: number) {
    const current = this.posts.get(id);
    if (!current || current.version !== expectedVersion) throw new PostVersionConflictError();
    return structuredClone(current);
  }

  async snapshotPublished(): Promise<PublishedSnapshot> {
    return { revision: 1, posts: [...this.posts.values()].filter((post) => post.status === 'published' && !post.deletedAt) };
  }
}
