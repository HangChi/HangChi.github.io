import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.js';

describe('CMS configuration', () => {
  it('enables GitHub article synchronization only when a repository is configured', () => {
    const disabled = loadConfig({ CMS_DATABASE_URL: 'mysql://root:password@localhost/blog' });
    expect(disabled.githubSync).toBeNull();

    const enabled = loadConfig({
      CMS_DATABASE_URL: 'mysql://root:password@localhost/blog',
      CMS_GITHUB_SYNC_REPOSITORY: 'git@github.com:HangChi/HangChi.github.io.git',
      CMS_GITHUB_SYNC_BRANCH: 'main',
      CMS_GITHUB_SYNC_ROOT: '/var/lib/blog-cms/github-sync',
      CMS_GITHUB_SYNC_IDENTITY: '/etc/blog-cms/github_deploy_key',
      CMS_GITHUB_SYNC_KNOWN_HOSTS: '/etc/blog-cms/github_known_hosts',
    });
    expect(enabled.githubSync).toEqual({
      repositoryUrl: 'git@github.com:HangChi/HangChi.github.io.git',
      branch: 'main',
      checkoutRoot: '/var/lib/blog-cms/github-sync',
      identityFile: '/etc/blog-cms/github_deploy_key',
      knownHostsFile: '/etc/blog-cms/github_known_hosts',
    });
  });
});
