// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { AdminApp } from '../../app.js';
import type { ApiClientLike } from '../../api/client.js';

afterEach(cleanup);

describe('LoginPage', () => {
  it('logs in and opens the article list', async () => {
    const user = userEvent.setup();
    const api = {
      session: async () => { throw new Error('UNAUTHORIZED'); },
      login: async () => ({
        admin: { id: '1', username: 'admin' }, csrfToken: 'c'.repeat(43), expiresAt: '2026-08-10T00:00:00.000Z',
      }),
      logout: async () => undefined,
      listPosts: async () => ({ items: [], page: 1, pageSize: 20, total: 0 }),
      deploymentState: async () => ({
        databaseRevision: 0, deployedRevision: 0, activeRelease: null, activeJob: null, lastJob: null,
      }),
    } as unknown as ApiClientLike;
    render(<AdminApp api={api} initialEntries={['/login']} />);
    await user.type(screen.getByLabelText('用户名'), 'admin');
    await user.type(screen.getByLabelText('密码'), 'secret password');
    await user.click(screen.getByRole('button', { name: '登录' }));
    expect(await screen.findByRole('heading', { name: '文章' })).toBeTruthy();
  });
});
