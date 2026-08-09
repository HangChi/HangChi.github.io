import { spawn } from 'node:child_process';
import { cp, lstat, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { StoredPost } from '../repositories/types.js';
import { resolveExportPath, serializePost } from './frontmatter.js';
import type { PublishRequest } from './publisher.js';

export type LocalReleaseOptions = {
  sourceRoot: string;
  releasesRoot: string;
  activeLink: string;
  packageManagerCommand?: string;
  retainedReleases?: number;
};

const excludedRoots = new Set(['.git', '.worktrees', 'dist', 'node_modules']);

function releaseTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export class LocalReleaseAdapter {
  private log = '';
  private readonly sourceRoot: string;
  private readonly releasesRoot: string;
  private readonly activeLink: string;
  private readonly packageManagerCommand: string;
  private readonly retainedReleases: number;

  constructor(options: LocalReleaseOptions) {
    this.sourceRoot = path.resolve(options.sourceRoot);
    this.releasesRoot = path.resolve(options.releasesRoot);
    this.activeLink = path.resolve(options.activeLink);
    this.packageManagerCommand = options.packageManagerCommand ?? 'pnpm';
    this.retainedReleases = options.retainedReleases ?? 5;
  }

  get executionLog(): string {
    return this.log;
  }

  async prepareWorkspace(request: PublishRequest, revision: number): Promise<string> {
    this.log = '';
    const safeJobId = request.id.replace(/[^0-9A-Za-z_-]/g, '-');
    const releaseName = `${releaseTimestamp()}-r${revision}-j${safeJobId}`;
    const workspace = path.join(this.releasesRoot, releaseName);
    const sourceTarget = path.join(workspace, 'source');
    await mkdir(this.releasesRoot, { recursive: true });
    await cp(this.sourceRoot, sourceTarget, {
      recursive: true,
      filter: (source) => {
        const relative = path.relative(this.sourceRoot, source);
        if (!relative) return true;
        const [first] = relative.split(path.sep);
        if (first && excludedRoots.has(first)) return false;
        const base = path.basename(source);
        return base !== '.env' && !base.startsWith('.env.');
      },
    });
    this.append(`Prepared ${releaseName}`);
    return workspace;
  }

  async exportPosts(workspace: string, posts: StoredPost[]): Promise<void> {
    const contentRoot = path.join(workspace, 'source', 'src', 'content', 'blog');
    await rm(contentRoot, { recursive: true, force: true });
    await mkdir(contentRoot, { recursive: true });
    for (const post of posts) {
      const relativePath = post.sourcePath || `${post.slug}.${post.sourceExtension}`;
      const target = resolveExportPath(contentRoot, relativePath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, serializePost(post), 'utf8');
    }
    this.append(`Exported ${posts.length} published posts`);
  }

  async build(workspace: string): Promise<void> {
    const source = path.join(workspace, 'source');
    await this.run(this.packageManagerCommand, ['install', '--frozen-lockfile'], source);
    await this.run(this.packageManagerCommand, ['run', 'build'], source);
  }

  async verify(workspace: string): Promise<void> {
    const indexPath = path.join(workspace, 'source', 'dist', 'index.html');
    const content = await readFile(indexPath, 'utf8');
    if (!content.includes('<!DOCTYPE html>') && !content.includes('<!doctype html>')) {
      throw new Error('构建产物缺少有效首页');
    }
    this.append('Verified dist/index.html');
  }

  async activate(workspace: string): Promise<void> {
    const target = path.join(workspace, 'source', 'dist');
    const temporaryLink = `${this.activeLink}.next-${process.pid}`;
    await mkdir(path.dirname(this.activeLink), { recursive: true });
    await rm(temporaryLink, { force: true, recursive: false });
    await symlink(target, temporaryLink, 'dir');
    await rename(temporaryLink, this.activeLink);
    this.append(`Activated ${path.basename(workspace)}`);
    await this.prune();
  }

  private append(message: string): void {
    this.log = `${this.log}${this.log ? '\n' : ''}${message}`;
  }

  private run(command: string, args: string[], cwd: string): Promise<void> {
    this.append(`$ ${[command, ...args].join(' ')}`);
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        shell: false,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      child.stdout.on('data', (chunk) => this.append(chunk.toString().trimEnd()));
      child.stderr.on('data', (chunk) => this.append(chunk.toString().trimEnd()));
      child.once('error', reject);
      child.once('close', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} 退出码 ${code}`)));
    });
  }

  private async prune(): Promise<void> {
    const entries = await readdir(this.releasesRoot, { withFileTypes: true });
    const releases = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().reverse();
    for (const release of releases.slice(this.retainedReleases)) {
      const target = path.resolve(this.releasesRoot, release);
      const relative = path.relative(this.releasesRoot, target);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) continue;
      const stats = await lstat(target);
      if (stats.isDirectory() && !stats.isSymbolicLink()) await rm(target, { recursive: true, force: true });
    }
  }
}
