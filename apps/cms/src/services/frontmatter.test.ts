import { describe, expect, it } from 'vitest';

import { parsePostFile, resolveExportPath, serializePost } from './frontmatter.js';

const source = `---
title: 'Java 值传递'
description: '参数传递说明'
pubDate: 2026-03-01
category: 'notes'
tags: ['Java', '笔记']
draft: false
pinned: true
---
# 正文
`;

describe('frontmatter conversion', () => {
  it('preserves the Markdown body and metadata through import/export', () => {
    const imported = parsePostFile('notes/java/value.md', source);
    expect(imported.markdown).toBe('# 正文\n');
    expect(imported.category).toBe('notes');
    expect(imported.tags).toEqual(['Java', '笔记']);
    const serialized = serializePost(imported);
    expect(serialized).toContain("category: notes");
    expect(serialized.endsWith('# 正文\n')).toBe(true);
  });

  it('rejects export paths that escape the content root', () => {
    expect(() => resolveExportPath('C:/safe/content', '../../outside.md')).toThrow('不安全的文章路径');
  });
});
