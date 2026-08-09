import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Importer, type ImportStore } from './importer.js';
import type { ImportedPost } from './frontmatter.js';

const cleanup: string[] = [];
afterEach(async () => Promise.all(cleanup.splice(0).map((value) => rm(value, { recursive: true, force: true }))));

const valid = `---
title: 导入文章
description: 说明
pubDate: 2026-08-09
tags: [Astro]
draft: false
---
# 正文
`;

class MemoryImportStore implements ImportStore {
  readonly imported: ImportedPost[] = [];
  async upsert(post: ImportedPost) {
    this.imported.push(post);
    return 'created' as const;
  }
}

describe('Importer', () => {
  it('reports invalid files without mutating the store', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'blog-cms-import-'));
    cleanup.push(root);
    await mkdir(path.join(root, 'notes'));
    await writeFile(path.join(root, 'notes', 'valid.md'), valid);
    await writeFile(path.join(root, 'broken.md'), '# no frontmatter');
    const store = new MemoryImportStore();
    const report = await new Importer(store).dryRun(root);
    expect(report).toMatchObject({ scanned: 2, valid: 1 });
    expect(report.errors).toHaveLength(1);
    expect(store.imported).toHaveLength(0);
  });

  it('imports every valid file through an idempotent store', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'blog-cms-import-'));
    cleanup.push(root);
    await writeFile(path.join(root, 'valid.md'), valid);
    const store = new MemoryImportStore();
    const report = await new Importer(store).import(root);
    expect(report).toMatchObject({ scanned: 1, valid: 1, created: 1, updated: 0, unchanged: 0 });
    expect(store.imported[0]?.sourcePath).toBe('valid.md');
  });
});
