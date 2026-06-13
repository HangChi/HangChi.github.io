import type { CollectionEntry } from 'astro:content';

export const CATEGORY_META = {
  leetcode: {
    slug: 'leetcode',
    name: 'LeetCode',
    description: '算法题解与刷题笔记',
  },
  tutorials: {
    slug: 'tutorials',
    name: '部署教程',
    description: '服务部署与工具使用记录',
  },
  tools: {
    slug: 'tools',
    name: '实用工具',
    description: '开发工具、工具类与效率实践记录',
  },
  agent: {
    slug: 'agent',
    name: 'Agent 相关',
    description: 'AI Agent、Claude Code、Skills 与自动化工作流',
  },
  blog: {
    slug: 'blog',
    name: '博客建站',
    description: '博客搭建、写作与站点说明',
  },
} as const;

export type CategorySlug = keyof typeof CATEGORY_META;
export type CategoryInfo = (typeof CATEGORY_META)[CategorySlug];
export type BlogPostEntry = CollectionEntry<'blog'>;

export const CATEGORY_ORDER = [
  'leetcode',
  'tutorials',
  'tools',
  'agent',
  'blog',
] as const satisfies readonly CategorySlug[];

const KNOWN_CATEGORIES = new Set<string>(CATEGORY_ORDER);

export function isCategorySlug(value: string): value is CategorySlug {
  return KNOWN_CATEGORIES.has(value);
}

export function getCategoryPath(slug: CategorySlug) {
  return `/categories/${slug}/`;
}

export function comparePostsByPriority(
  a: BlogPostEntry,
  b: BlogPostEntry
) {
  if (!!a.data.pinned !== !!b.data.pinned) return a.data.pinned ? -1 : 1;
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

function inferCategoryFromPath(id: string): CategorySlug {
  if (id.startsWith('leetcode/')) return 'leetcode';
  if (id.startsWith('tutorials/')) return 'tutorials';
  if (id.startsWith('tools/')) return 'tools';
  if (id.startsWith('agent/')) return 'agent';
  return 'blog';
}

export function getPostCategorySlug(post: BlogPostEntry): CategorySlug {
  const explicit = post.data.category
    ? normalizeCategory(post.data.category)
    : '';

  if (explicit && isCategorySlug(explicit)) return explicit;
  return inferCategoryFromPath(post.id);
}

export function getPostCategory(post: BlogPostEntry): CategoryInfo {
  return CATEGORY_META[getPostCategorySlug(post)];
}
