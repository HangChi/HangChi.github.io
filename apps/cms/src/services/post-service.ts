import type {
  PostDto,
  PostInput,
  PostListResponse,
  PostQuery,
  PostVersionDto,
  PublishTrigger,
} from '@blog/contracts';

import { transitionPost } from '../domain/post-state.js';
import type { PostRepository, StoredPost } from '../repositories/types.js';

export interface PublishQueuePort {
  enqueue(trigger: PublishTrigger): Promise<void>;
}

export class PostNotFoundError extends Error {
  constructor() {
    super('文章不存在');
    this.name = 'PostNotFoundError';
  }
}

function toInput(post: StoredPost, changes: Partial<PostInput> = {}): PostInput {
  return {
    title: post.title,
    slug: post.slug,
    description: post.description,
    markdown: post.markdown,
    status: post.status,
    categoryId: post.category?.id ?? null,
    tagIds: post.tags.map((tag) => tag.id),
    pinned: post.pinned,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    sourceExtension: post.sourceExtension,
    sourcePath: post.sourcePath,
    version: post.version,
    ...changes,
  };
}

export function toPostDto(post: StoredPost): PostDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    description: post.description,
    markdown: post.markdown,
    status: post.status,
    category: post.category,
    tags: post.tags,
    pinned: post.pinned,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    sourceExtension: post.sourceExtension,
    sourcePath: post.sourcePath,
    version: post.version,
    deletedAt: post.deletedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    deploymentStatus: post.status === 'published' ? 'pending' : 'not-deployed',
  };
}

export class PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly publishQueue: PublishQueuePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: PostQuery): Promise<PostListResponse> {
    const page = await this.repository.list(query);
    return {
      items: page.items.map((post) => {
        const { markdown: _markdown, ...item } = toPostDto(post);
        return item;
      }),
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    };
  }

  async get(id: string, includeDeleted = false): Promise<PostDto> {
    const post = await this.repository.findById(id, includeDeleted);
    if (!post) throw new PostNotFoundError();
    return toPostDto(post);
  }

  async create(input: PostInput): Promise<PostDto> {
    const post = await this.repository.create(input, input.status === 'published' ? 'publish' : 'create');
    if (post.status === 'published') await this.publishQueue.enqueue('publish');
    return toPostDto(post);
  }

  async update(id: string, input: PostInput): Promise<PostDto> {
    const before = await this.repository.findById(id);
    if (!before) throw new PostNotFoundError();
    const post = await this.repository.update(id, input, 'save');
    if (before.status === 'published' || post.status === 'published') await this.publishQueue.enqueue('publish');
    return toPostDto(post);
  }

  async publish(id: string, expectedVersion: number): Promise<PostDto> {
    const current = await this.repository.findById(id);
    if (!current) throw new PostNotFoundError();
    const transition = transitionPost(current, { type: 'publish' }, this.now());
    const post = await this.repository.update(id, toInput(transition.next, {
      status: 'published',
      publishedAt: transition.next.publishedAt?.toISOString() ?? this.now().toISOString(),
      version: expectedVersion,
    }), transition.reason);
    await this.publishQueue.enqueue('publish');
    return toPostDto(post);
  }

  async unpublish(id: string, expectedVersion: number): Promise<PostDto> {
    const current = await this.repository.findById(id);
    if (!current) throw new PostNotFoundError();
    const transition = transitionPost(current, { type: 'unpublish' }, this.now());
    const post = await this.repository.update(id, toInput(transition.next, {
      status: 'draft',
      version: expectedVersion,
    }), transition.reason);
    if (transition.requiresPublish) await this.publishQueue.enqueue('unpublish');
    return toPostDto(post);
  }

  async softDelete(id: string, expectedVersion: number): Promise<PostDto> {
    const current = await this.repository.findById(id);
    if (!current) throw new PostNotFoundError();
    const transition = transitionPost(current, { type: 'soft-delete' }, this.now());
    const post = await this.repository.softDelete(id, expectedVersion);
    if (transition.requiresPublish) await this.publishQueue.enqueue('delete');
    return toPostDto(post);
  }

  async restore(id: string, expectedVersion: number): Promise<PostDto> {
    const current = await this.repository.findById(id, true);
    if (!current) throw new PostNotFoundError();
    const transition = transitionPost(current, { type: 'restore' }, this.now());
    const post = await this.repository.restore(id, expectedVersion);
    if (transition.requiresPublish) await this.publishQueue.enqueue('restore');
    return toPostDto(post);
  }

  async permanentlyDelete(id: string): Promise<void> {
    const current = await this.repository.findById(id, true);
    if (!current) throw new PostNotFoundError();
    transitionPost(current, { type: 'permanently-delete' }, this.now());
    await this.repository.permanentlyDelete(id);
    if (current.status === 'published') await this.publishQueue.enqueue('delete');
  }

  async listVersions(id: string): Promise<PostVersionDto[]> {
    if (!(await this.repository.findById(id, true))) throw new PostNotFoundError();
    return (await this.repository.listVersions(id)).map((version) => ({
      id: version.id,
      postId: version.postId,
      version: version.version,
      title: version.snapshot.title,
      markdown: version.snapshot.markdown,
      reason: version.reason,
      createdAt: version.createdAt.toISOString(),
    }));
  }

  async restoreVersion(id: string, versionId: string, expectedVersion: number): Promise<PostDto> {
    const post = await this.repository.restoreVersion(id, versionId, expectedVersion);
    if (post.status === 'published') await this.publishQueue.enqueue('publish');
    return toPostDto(post);
  }
}
