import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parsePostFile, type ImportedPost } from './frontmatter.js';

export type ImportDisposition = 'created' | 'updated' | 'unchanged';

export interface ImportStore {
  upsert(post: ImportedPost): Promise<ImportDisposition>;
}

export type ImportReport = {
  scanned: number;
  valid: number;
  errors: Array<{ path: string; message: string }>;
  created: number;
  updated: number;
  unchanged: number;
};

async function markdownFiles(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(root, fullPath));
    else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}

export class Importer {
  constructor(private readonly store: ImportStore) {}

  private async scan(sourceRoot: string): Promise<{ report: ImportReport; posts: ImportedPost[] }> {
    const root = path.resolve(sourceRoot);
    const files = await markdownFiles(root);
    const posts: ImportedPost[] = [];
    const errors: ImportReport['errors'] = [];
    const slugPaths = new Map<string, string>();

    for (const file of files) {
      const sourcePath = path.relative(root, file).split(path.sep).join('/');
      try {
        const post = parsePostFile(sourcePath, await readFile(file, 'utf8'));
        const previous = slugPaths.get(post.slug);
        if (previous) {
          errors.push({ path: sourcePath, message: `Slug 与 ${previous} 重复: ${post.slug}` });
          continue;
        }
        slugPaths.set(post.slug, sourcePath);
        posts.push(post);
      } catch (error) {
        errors.push({ path: sourcePath, message: error instanceof Error ? error.message : String(error) });
      }
    }

    return {
      posts,
      report: { scanned: files.length, valid: posts.length, errors, created: 0, updated: 0, unchanged: 0 },
    };
  }

  async dryRun(sourceRoot: string): Promise<ImportReport> {
    return (await this.scan(sourceRoot)).report;
  }

  async import(sourceRoot: string): Promise<ImportReport> {
    const { posts, report } = await this.scan(sourceRoot);
    if (report.errors.length) {
      throw new Error(`导入检查失败：${report.errors.length} 个文件需要处理`);
    }
    for (const post of posts) {
      const disposition = await this.store.upsert(post);
      report[disposition] += 1;
    }
    return report;
  }
}
