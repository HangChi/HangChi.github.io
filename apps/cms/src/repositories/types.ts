import type { PostInput, PostQuery, PostStatus, TaxonomyDto } from '@blog/contracts';

export type SourceExtension = 'md' | 'mdx';
export type VersionReason = 'create' | 'save' | 'publish' | 'unpublish' | 'delete' | 'restore' | 'import' | 'restore-version';

export type StoredPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  markdown: string;
  status: PostStatus;
  category: TaxonomyDto | null;
  tags: TaxonomyDto[];
  pinned: boolean;
  publishedAt: Date | null;
  sourceExtension: SourceExtension;
  sourcePath: string | null;
  sourceHash: string | null;
  version: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PostPage = {
  items: StoredPost[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublishedSnapshot = {
  revision: number;
  posts: StoredPost[];
};

export type PostVersion = {
  id: string;
  postId: string;
  version: number;
  reason: VersionReason;
  snapshot: StoredPost;
  createdAt: Date;
};

export class PostVersionConflictError extends Error {
  constructor() {
    super('文章已在其他窗口更新');
    this.name = 'PostVersionConflictError';
  }
}

export interface PostRepository {
  list(query: PostQuery): Promise<PostPage>;
  findById(id: string, includeDeleted?: boolean): Promise<StoredPost | null>;
  create(input: PostInput, reason?: VersionReason): Promise<StoredPost>;
  update(id: string, input: PostInput, reason?: VersionReason): Promise<StoredPost>;
  softDelete(id: string, expectedVersion: number): Promise<StoredPost>;
  restore(id: string, expectedVersion: number): Promise<StoredPost>;
  permanentlyDelete(id: string): Promise<void>;
  listVersions(id: string, limit?: number): Promise<PostVersion[]>;
  restoreVersion(id: string, versionId: string, expectedVersion: number): Promise<StoredPost>;
  snapshotPublished(): Promise<PublishedSnapshot>;
}
