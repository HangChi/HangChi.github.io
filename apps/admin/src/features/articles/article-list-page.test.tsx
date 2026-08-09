// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminApp } from '../../app.js';
import type { ApiClientLike } from '../../api/client.js';

afterEach(cleanup);

const post = {
  id: '1', title: 'Astro 后台', slug: 'astro-admin', description: '说明', status: 'published' as const,
  category: null, tags: [], pinned: false, publishedAt: '2026-08-09T00:00:00.000Z',
  sourceExtension: 'md' as const, sourcePath: 'astro-admin.md', version: 1, deletedAt: null,
  createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z',
  deploymentStatus: 'deployed' as const,
};

describe('ArticleListPage', () => {
  it('keeps page navigation in the URL-backed query', async () => {
    const user = userEvent.setup();
    const listPosts = vi.fn(async (query = {}) => ({
      items: [post], page: Number(query.page ?? 1), pageSize: 20, total: 45,
    }));
    const api = {
      session: async () => ({ admin: { id: '1', username: 'admin' }, csrfToken: 'c'.repeat(43), expiresAt: '2026-08-10T00:00:00.000Z' }),
      login: async () => { throw new Error('not used'); }, logout: async () => undefined, listPosts,
      deploymentState: async () => ({ databaseRevision: 2, deployedRevision: 2, activeRelease: 'r2', activeJob: null, lastJob: null }),
    } as unknown as ApiClientLike;
    render(<AdminApp api={api} initialEntries={['/articles']} />);
    expect(await screen.findByText('Astro 后台')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '下一页' }));
    await waitFor(() => expect(listPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });
});
