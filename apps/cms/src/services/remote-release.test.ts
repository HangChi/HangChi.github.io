import { describe, expect, it } from 'vitest';

import { remoteActivationCommands } from './remote-release.js';

describe('remote release commands', () => {
  it('builds an rsync upload and atomic symlink switch without shell interpolation', () => {
    const commands = remoteActivationCommands({
      host: '39.99.232.157', port: 22, user: 'blogdeploy', identityFile: '/etc/blog-cms/deploy_key',
      knownHostsFile: '/etc/blog-cms/known_hosts', root: '/var/www/hangchi-blog',
    }, '/tmp/release/source/dist', '20260809-r4-j9');

    expect(commands.rsync.args).toContain('blogdeploy@39.99.232.157:/var/www/hangchi-blog/releases/20260809-r4-j9/');
    expect(commands.activate.args.at(-1)).toContain('mv -Tf');
    expect(commands.activate.args.at(-1)).not.toContain(';');
  });

  it('rejects unsafe release names', () => {
    expect(() => remoteActivationCommands({
      host: 'host', port: 22, user: 'deploy', identityFile: '/key', knownHostsFile: '/known', root: '/srv/blog',
    }, '/tmp/dist', '../escape')).toThrow(/release name/i);
  });
});
