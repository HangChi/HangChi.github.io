import { lstat, mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { LocalReleaseAdapter } from './local-release-adapter.js';

const temporaryDirectories: string[] = [];
afterEach(async () => Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))));

describe('LocalReleaseAdapter', () => {
  it('dereferences the active source symlink into an isolated writable workspace', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'blog-release-'));
    temporaryDirectories.push(root);
    const source = path.join(root, 'application-release');
    const current = path.join(root, 'current');
    await mkdir(path.join(source, 'src'), { recursive: true });
    await writeFile(path.join(source, 'src', 'entry.txt'), 'content', 'utf8');
    await symlink(source, current, process.platform === 'win32' ? 'junction' : 'dir');

    const adapter = new LocalReleaseAdapter({
      sourceRoot: current, releasesRoot: path.join(root, 'site-releases'), activeLink: path.join(root, 'active'),
    });
    const workspace = await adapter.prepareWorkspace({ id: '1', trigger: 'manual' }, 1);
    const copiedSource = path.join(workspace, 'source');

    expect((await lstat(copiedSource)).isSymbolicLink()).toBe(false);
    expect((await lstat(path.join(copiedSource, 'src', 'entry.txt'))).isFile()).toBe(true);
  });
});
