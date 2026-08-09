import { createHash } from 'node:crypto';
import path from 'node:path';

import { parse, stringify } from 'yaml';

import { normalizeSlug } from '../domain/slug.js';
import type { StoredPost } from '../repositories/types.js';

export type ImportedPost = {
  title: string;
  slug: string;
  description: string;
  markdown: string;
  status: 'draft' | 'published';
  category: string | null;
  tags: string[];
  pinned: boolean;
  publishedAt: Date;
  sourceExtension: 'md' | 'mdx';
  sourcePath: string;
  sourceHash: string;
};

type Frontmatter = Record<string, unknown>;

function normalizedText(value: string): string {
  return value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function dateValue(value: unknown, field: string): Date {
  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isNaN(date.getTime())) throw new Error(`${field} 不是有效日期`);
  return date;
}

export function parsePostFile(sourcePath: string, source: string): ImportedPost {
  const relativePath = sourcePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!/\.(md|mdx)$/i.test(relativePath)) throw new Error('文章文件必须是 Markdown 或 MDX');
  const text = normalizedText(source);
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error(`${relativePath} 缺少 frontmatter`);
  const metadata = parse(match[1] ?? '') as Frontmatter;
  if (!metadata || typeof metadata !== 'object') throw new Error(`${relativePath} frontmatter 无效`);
  const title = String(metadata.title ?? '').trim();
  if (!title) throw new Error(`${relativePath} 缺少标题`);
  const description = String(metadata.description ?? '').trim();
  const body = text.slice(match[0].length);
  const segments = relativePath.split('/');
  const filename = segments.at(-1)!.replace(/\.(md|mdx)$/i, '');
  const category = String(metadata.category ?? segments.at(0) ?? '').trim() || null;
  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const sourceExtension = relativePath.toLocaleLowerCase('en-US').endsWith('.mdx') ? 'mdx' : 'md';

  return {
    title,
    slug: normalizeSlug(filename),
    description,
    markdown: body,
    status: metadata.draft === true ? 'draft' : 'published',
    category,
    tags,
    pinned: metadata.pinned === true,
    publishedAt: dateValue(metadata.pubDate, 'pubDate'),
    sourceExtension,
    sourcePath: relativePath,
    sourceHash: createHash('sha256').update(text, 'utf8').digest('hex'),
  };
}

function contentFields(post: ImportedPost | StoredPost) {
  const imported = !('id' in post);
  const category = imported
    ? post.category as string | null
    : (post as StoredPost).category?.slug ?? null;
  const tags = imported
    ? (post as ImportedPost).tags
    : (post as StoredPost).tags.map((tag) => tag.name);
  const publishedAt = post.publishedAt ?? new Date();
  return { category, tags, publishedAt };
}

export function serializePost(post: ImportedPost | StoredPost): string {
  const { category, tags, publishedAt } = contentFields(post);
  const metadata: Record<string, unknown> = {
    title: post.title,
    description: post.description,
    pubDate: publishedAt.toISOString().slice(0, 10),
  };
  if (category) metadata.category = category;
  metadata.tags = tags;
  metadata.draft = post.status === 'draft';
  metadata.pinned = post.pinned;
  const frontmatter = stringify(metadata, { lineWidth: 0 }).trimEnd();
  return `---\n${frontmatter}\n---\n${normalizedText(post.markdown).replace(/^\n+/, '').replace(/\n*$/, '\n')}`;
}

export function resolveExportPath(contentRoot: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  if (path.posix.isAbsolute(normalized)
    || !/\.(md|mdx)$/i.test(normalized)
    || normalized.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('不安全的文章路径');
  }
  const root = path.resolve(contentRoot);
  const target = path.resolve(root, ...normalized.split('/'));
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('不安全的文章路径');
  return target;
}
