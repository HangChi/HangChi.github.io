import { spawn } from 'node:child_process';
import { access, cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

export type GitHubContentSyncOptions = {
  repositoryUrl: string;
  branch: string;
  checkoutRoot: string;
  identityFile?: string;
  knownHostsFile?: string;
  authorName?: string;
  authorEmail?: string;
};

export type GitHubContentSyncResult = {
  pushed: boolean;
};

type CommandResult = { code: number; stdout: string; stderr: string };

export class GitHubContentSync {
  private readonly options: GitHubContentSyncOptions;

  constructor(options: GitHubContentSyncOptions) {
    if (!options.repositoryUrl.trim()) throw new Error('GitHub sync repository URL is required');
    if (!/^(?!-)(?!.*\.\.)(?:[0-9A-Za-z._/-]+)$/.test(options.branch)) {
      throw new Error('Unsafe GitHub sync branch');
    }
    if (Boolean(options.identityFile) !== Boolean(options.knownHostsFile)) {
      throw new Error('GitHub sync SSH identity and known-hosts files must be configured together');
    }
    this.options = options;
  }

  async sync(workspace: string, revision: number): Promise<GitHubContentSyncResult> {
    const checkoutRoot = path.resolve(this.options.checkoutRoot);
    await this.ensureCheckout(checkoutRoot);
    await this.git(checkoutRoot, ['fetch', 'origin', this.options.branch]);
    await this.git(checkoutRoot, ['checkout', '-B', this.options.branch, `origin/${this.options.branch}`]);

    const exportedArticles = path.resolve(workspace, 'source', 'src', 'content', 'blog');
    const targetArticles = path.resolve(checkoutRoot, 'src', 'content', 'blog');
    this.assertDescendant(checkoutRoot, targetArticles);
    await access(exportedArticles);
    await rm(targetArticles, { recursive: true, force: true });
    await mkdir(path.dirname(targetArticles), { recursive: true });
    await cp(exportedArticles, targetArticles, { recursive: true });
    await this.git(checkoutRoot, ['add', '--', 'src/content/blog']);

    const difference = await this.git(checkoutRoot, ['diff', '--cached', '--quiet'], [0, 1]);
    if (difference.code === 0) return { pushed: false };

    await this.git(checkoutRoot, [
      '-c', `user.name=${this.options.authorName ?? 'HangChi Blog CMS'}`,
      '-c', `user.email=${this.options.authorEmail ?? 'cms@hangchi.local'}`,
      'commit', '-m', `content: publish revision r${revision}`,
    ]);
    await this.git(checkoutRoot, ['push', 'origin', `HEAD:${this.options.branch}`]);
    return { pushed: true };
  }

  private async ensureCheckout(checkoutRoot: string): Promise<void> {
    try {
      await access(path.join(checkoutRoot, '.git'));
      return;
    } catch {
      await mkdir(path.dirname(checkoutRoot), { recursive: true });
      await this.git(path.dirname(checkoutRoot), [
        'clone', '--branch', this.options.branch, '--single-branch', '--',
        this.options.repositoryUrl, checkoutRoot,
      ]);
    }
  }

  private assertDescendant(root: string, candidate: string): void {
    const relative = path.relative(root, candidate);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('GitHub sync article directory escapes its checkout');
    }
  }

  private git(cwd: string, args: string[], allowedCodes = [0]): Promise<CommandResult> {
    const sshCommand = this.options.identityFile && this.options.knownHostsFile
      ? `ssh -i ${this.options.identityFile} -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${this.options.knownHostsFile}`
      : undefined;
    return new Promise((resolve, reject) => {
      const child = spawn('git', args, {
        cwd,
        env: { ...process.env, ...(sshCommand ? { GIT_SSH_COMMAND: sshCommand } : {}) },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      child.once('error', reject);
      child.once('close', (code) => {
        const normalizedCode = code ?? -1;
        if (allowedCodes.includes(normalizedCode)) resolve({ code: normalizedCode, stdout, stderr });
        else reject(new Error(`git ${args.join(' ')} exited with ${normalizedCode}: ${stderr.trim()}`));
      });
    });
  }
}
