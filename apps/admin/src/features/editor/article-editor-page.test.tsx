// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ApiClientLike } from '../../api/client.js';
import { AdminApp } from '../../app.js';

afterEach(cleanup);

const post = {
  id: '1', title: '第一篇文章', slug: 'first-post', description: '', markdown: '# 初稿', status: 'draft' as const,
  category: null, tags: [], pinned: false, publishedAt: null, sourceExtension: 'md' as const,
  sourcePath: 'first-post.md', version: 1, deletedAt: null, createdAt: '2026-08-09T00:00:00.000Z',
  updatedAt: '2026-08-09T00:00:00.000Z', deploymentStatus: 'not-deployed' as const,
};

describe('ArticleEditorPage', () => {
  it('loads canonical Markdown and saves with the current version', async () => {
    const user = userEvent.setup();
    const updatePost = vi.fn(async (_id, input) => ({ ...post, ...input, version: 2 }));
    const api = {
      session: async () => ({ admin: { id: '1', username: 'admin' }, csrfToken: 'c'.repeat(43), expiresAt: '2026-08-10T00:00:00.000Z' }),
      deploymentState: async () => ({ databaseRevision: 1, deployedRevision: 1, activeRelease: null, activeJob: null, lastJob: null }),
      getPost: async () => post,
      updatePost,
      listTaxonomy: async () => [],
    } as unknown as ApiClientLike;

    render(<AdminApp api={api} initialEntries={['/articles/1']} />);
    const editor = await screen.findByRole('textbox', { name: 'Markdown 正文' });
    await user.clear(editor);
    await user.type(editor, '# 已修改');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(updatePost).toHaveBeenCalledWith('1', expect.objectContaining({
      markdown: '# 已修改', version: 1,
    })));
    expect((await screen.findAllByText('已保存')).length).toBeGreaterThan(0);
  });
});
