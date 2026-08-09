import { describe, expect, it } from 'vitest';

import { Publisher, type PublisherPorts } from './publisher.js';

function ports(events: string[]): PublisherPorts {
  return {
    snapshot: async () => { events.push('snapshot'); return { revision: 7, posts: [] }; },
    prepareWorkspace: async () => { events.push('workspace'); return '/release/7'; },
    exportPosts: async () => { events.push('export'); },
    build: async () => { events.push('build'); },
    verify: async () => { events.push('verify'); },
    activate: async () => { events.push('activate'); },
    recordSuccess: async () => { events.push('record'); },
    recordFailure: async () => { events.push('failed'); },
  };
}

describe('Publisher', () => {
  it('never activates a release when the Astro build fails', async () => {
    const events: string[] = [];
    const testPorts = ports(events);
    testPorts.build = async () => { events.push('build'); throw new Error('build failed'); };
    await expect(new Publisher(testPorts).publish({ id: '9', trigger: 'publish' })).rejects.toThrow('build failed');
    expect(events).toEqual(['snapshot', 'workspace', 'export', 'build', 'failed']);
  });

  it('activates only after output verification succeeds', async () => {
    const events: string[] = [];
    await new Publisher(ports(events)).publish({ id: '9', trigger: 'publish' });
    expect(events).toEqual(['snapshot', 'workspace', 'export', 'build', 'verify', 'activate', 'record']);
  });
});
