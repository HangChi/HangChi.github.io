import type { StoredPost, VersionReason } from '../repositories/types.js';

export type PostEvent =
  | { type: 'publish' }
  | { type: 'unpublish' }
  | { type: 'soft-delete' }
  | { type: 'restore' }
  | { type: 'permanently-delete' };

export type PostTransition = {
  next: StoredPost;
  reason: VersionReason;
  requiresPublish: boolean;
};

export function transitionPost(post: StoredPost, event: PostEvent, now: Date): PostTransition {
  if (event.type === 'permanently-delete') {
    if (!post.deletedAt) throw new Error('只有回收站中的文章可以永久删除');
    return { next: post, reason: 'delete', requiresPublish: post.status === 'published' };
  }

  if (event.type === 'publish') {
    if (post.deletedAt) throw new Error('回收站中的文章不能发布');
    return {
      next: { ...post, status: 'published', publishedAt: post.publishedAt ?? now },
      reason: 'publish',
      requiresPublish: true,
    };
  }

  if (event.type === 'unpublish') {
    if (post.deletedAt) throw new Error('回收站中的文章不能取消发布');
    return {
      next: { ...post, status: 'draft' },
      reason: 'unpublish',
      requiresPublish: post.status === 'published',
    };
  }

  if (event.type === 'soft-delete') {
    if (post.deletedAt) throw new Error('文章已经在回收站中');
    return {
      next: { ...post, deletedAt: now },
      reason: 'delete',
      requiresPublish: post.status === 'published',
    };
  }

  if (!post.deletedAt) throw new Error('文章不在回收站中');
  return {
    next: { ...post, deletedAt: null },
    reason: 'restore',
    requiresPublish: post.status === 'published',
  };
}
