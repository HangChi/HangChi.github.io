// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { ApiClientLike } from '../../api/client.js';
import { AdminApp } from '../../app.js';

afterEach(cleanup);

describe('PublishingPage', () => {
  it('makes a failed release explicit while preserving the active release', async () => {
    const failed = {
      id: '9', revision: 5, status: 'failed' as const, trigger: 'publish' as const, releaseName: null,
      errorSummary: 'Astro build failed', log: 'exit 1', queuedAt: '2026-08-09T00:00:00.000Z',
      startedAt: '2026-08-09T00:00:01.000Z', completedAt: '2026-08-09T00:00:02.000Z',
    };
    const api = {
      session: async () => ({ admin: { id: '1', username: 'admin' }, csrfToken: 'c'.repeat(43), expiresAt: '2026-08-10T00:00:00.000Z' }),
      deploymentState: async () => ({ databaseRevision: 5, deployedRevision: 4, activeRelease: 'release-r4', activeJob: null, lastJob: failed }),
      listPublishJobs: async () => [failed],
    } as unknown as ApiClientLike;

    render(<AdminApp api={api} initialEntries={['/publishing']} />);
    expect(await screen.findByText('发布失败，线上仍为上一版本')).toBeTruthy();
    expect(screen.getByText('release-r4')).toBeTruthy();
  });
});
