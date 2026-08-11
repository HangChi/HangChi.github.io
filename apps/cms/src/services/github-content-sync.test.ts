import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { GitHubContentSync } from './github-content-sync.js';

const temporaryRoots: string[] = [];

function runGit(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let errorOutput = '';
    child.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });
    child.once('error', reject);
    child.once('close', (code) => code === 0
      ? resolve()
      : reject(new Error(`git ${args.join(' ')} failed (${code}): ${errorOutput}`)));
  });
}

async function write(root: string, relativePath: string, content: string): Promise<void> {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('GitHub content synchronization', () => {
  it('publishes only exported articles and preserves repository code', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'blog-github-sync-'));
    temporaryRoots.push(root);
    const remote = path.join(root, 'remote.git');
    const seed = path.join(root, 'seed');
    const workspace = path.join(root, 'release');
    const checkoutRoot = path.join(root, 'sync');
    const verification = path.join(root, 'verification');

    await mkdir(seed);
    await runGit(root, ['init', '--bare', remote]);
    await runGit(seed, ['init', '--initial-branch=main']);
    await runGit(seed, ['config', 'user.name', 'Test Author']);
    await runGit(seed, ['config', 'user.email', 'test@example.com']);
    await write(seed, 'README.md', 'keep repository code\n');
    await write(seed, 'src/content/blog/old.md', 'old article\n');
    await runGit(seed, ['add', '--', 'README.md', 'src/content/blog']);
    await runGit(seed, ['commit', '-m', 'seed']);
    await runGit(seed, ['remote', 'add', 'origin', remote]);
    await runGit(seed, ['push', '-u', 'origin', 'main']);
    await write(workspace, 'source/src/content/blog/new.md', 'new article\n');
    await write(workspace, 'source/package.json', '{"mustNotSync":true}\n');

    const sync = new GitHubContentSync({ repositoryUrl: remote, branch: 'main', checkoutRoot });
    const result = await sync.sync(workspace, 42);

    expect(result.pushed).toBe(true);
    await runGit(root, ['clone', '--branch', 'main', remote, verification]);
    const article = await readFile(path.join(verification, 'src/content/blog/new.md'), 'utf8');
    expect(article.replaceAll('\r\n', '\n')).toBe('new article\n');
    await expect(readFile(path.join(verification, 'src/content/blog/old.md'), 'utf8')).rejects.toThrow();
    const readme = await readFile(path.join(verification, 'README.md'), 'utf8');
    expect(readme.replaceAll('\r\n', '\n')).toBe('keep repository code\n');
    await expect(readFile(path.join(verification, 'package.json'), 'utf8')).rejects.toThrow();
  });
});
