import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const contentRoot = path.join(rootDir, 'src', 'content', 'blog');
const defaultPort = Number.parseInt(process.env.BLOG_ADMIN_PORT || '8787', 10);

const portArg = process.argv.find((arg) => arg.startsWith('--port='));
const requestedPort = portArg ? Number.parseInt(portArg.slice('--port='.length), 10) : defaultPort;
const port = Number.isFinite(requestedPort) ? requestedPort : defaultPort;

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function text(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function notFound(res) {
  json(res, 404, { ok: false, error: 'Not found' });
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 10 * 1024 * 1024) {
      throw new Error('Markdown is larger than 10MB.');
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function isSafeSegment(segment) {
  return segment && segment !== '.' && segment !== '..' && !/[<>:"|?*\x00-\x1f]/.test(segment);
}

function sanitizeSegment(value, fallback) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|#]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || fallback;
}

function normalizeTargetPath(folder, slug, extension) {
  const safeExtension = extension === '.mdx' ? '.mdx' : '.md';
  const folderParts = String(folder || '')
    .split(/[\\/]+/)
    .map((part) => sanitizeSegment(part, ''))
    .filter(Boolean);

  for (const part of folderParts) {
    if (!isSafeSegment(part)) throw new Error(`Invalid folder segment: ${part}`);
  }

  const safeSlug = sanitizeSegment(slug, 'untitled');
  if (!isSafeSegment(safeSlug)) throw new Error(`Invalid slug: ${safeSlug}`);

  const targetDir = path.join(contentRoot, ...folderParts);
  const targetFile = path.join(targetDir, `${safeSlug}${safeExtension}`);
  const resolved = path.resolve(targetFile);
  const resolvedRoot = path.resolve(contentRoot);

  if (!resolved.startsWith(resolvedRoot + path.sep)) {
    throw new Error('Target path escapes the blog content directory.');
  }

  return {
    targetDir,
    targetFile,
    relativePath: toPosix(path.relative(rootDir, targetFile)),
  };
}

function yamlSingleQuote(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

function stripFrontmatter(markdown) {
  const normalized = String(markdown || '').replace(/^\uFEFF/, '');
  const match = normalized.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? normalized.slice(match[0].length).trimStart() : normalized.trimStart();
}

function buildMarkdown(payload) {
  const title = String(payload.title || '').trim();
  const description = String(payload.description || '').trim();
  const pubDate = String(payload.pubDate || '').trim();
  const category = String(payload.category || '').trim();
  const tags = Array.isArray(payload.tags) ? payload.tags : [];
  const body = stripFrontmatter(payload.markdown || '');

  if (!title) throw new Error('Title is required.');
  if (!description) throw new Error('Description is required.');
  if (!pubDate) throw new Error('Publish date is required.');
  if (!body) throw new Error('Markdown body is empty.');

  const frontmatter = [
    '---',
    `title: ${yamlSingleQuote(title)}`,
    `description: ${yamlSingleQuote(description)}`,
    `pubDate: ${pubDate}`,
  ];

  if (category) frontmatter.push(`category: ${yamlSingleQuote(category)}`);

  const cleanTags = tags.map((tag) => String(tag).trim()).filter(Boolean);
  frontmatter.push(`tags: [${cleanTags.map(yamlSingleQuote).join(', ')}]`);
  frontmatter.push(`draft: ${Boolean(payload.draft)}`);
  frontmatter.push(`pinned: ${Boolean(payload.pinned)}`);
  frontmatter.push('---', '');

  return `${frontmatter.join('\n')}${body.trimEnd()}\n`;
}

async function listFolders() {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

function parseFrontmatterValue(source, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = source.match(re);
  if (!match) return '';
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

async function walkMarkdown(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdown(fullPath, base)));
      continue;
    }
    if (!/\.(md|mdx)$/i.test(entry.name)) continue;

    const raw = await readFile(fullPath, 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const frontmatter = fm?.[1] || '';
    const fileStat = await stat(fullPath);
    files.push({
      path: toPosix(path.relative(rootDir, fullPath)),
      slug: toPosix(path.relative(base, fullPath)).replace(/\.(md|mdx)$/i, ''),
      title: parseFrontmatterValue(frontmatter, 'title') || entry.name,
      pubDate: parseFrontmatterValue(frontmatter, 'pubDate'),
      draft: parseFrontmatterValue(frontmatter, 'draft') === 'true',
      modified: fileStat.mtime.toISOString(),
    });
  }

  return files;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: {
        ...process.env,
        PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ''}`,
      },
      shell: options.shell ?? process.platform === 'win32',
      ...options,
    });
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({ code, output: output.trim() });
    });
    child.on('error', (error) => {
      resolve({ code: 1, output: error.message });
    });
  });
}

function formatCommandForLog(command, args) {
  return [command, ...args]
    .map((arg) => {
      const value = String(arg);
      if (!value || /[\s"'`$]/.test(value)) {
        return JSON.stringify(value);
      }
      return value;
    })
    .join(' ');
}

async function checkedRun(logs, label, command, args, options = {}) {
  logs.push(`$ ${formatCommandForLog(command, args)}`);
  const result = await runCommand(command, args, options);
  if (result.output) logs.push(result.output);
  if (result.code !== 0) {
    throw new Error(`${label} failed.\n${result.output}`);
  }
}

async function runBuild(logs) {
  logs.push('$ npm run build');
  let result = await runCommand('npm', ['run', 'build']);

  if (result.code !== 0 && /not recognized|not found|ENOENT|无法将/i.test(result.output)) {
    if (result.output) logs.push(result.output);
    const astroBin = path.join('node_modules', 'astro', 'bin', 'astro.mjs');
    logs.push(`$ ${process.execPath} ${astroBin} build`);
    result = await runCommand(process.execPath, [astroBin, 'build'], { shell: false });
  }

  if (result.output) logs.push(result.output);
  if (result.code !== 0) {
    throw new Error(`Build failed.\n${result.output}`);
  }
}

async function publishPost(payload) {
  const extension = payload.extension === '.mdx' ? '.mdx' : '.md';
  const { targetDir, targetFile, relativePath } = normalizeTargetPath(payload.folder, payload.slug, extension);
  const markdown = buildMarkdown(payload);
  const logs = [];

  if (existsSync(targetFile) && !payload.overwrite) {
    throw new Error(`File already exists: ${relativePath}`);
  }

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetFile, markdown, 'utf8');
  logs.push(`Saved ${relativePath}`);

  if (payload.mode === 'save') {
    return { relativePath, logs };
  }

  await runBuild(logs);

  if (payload.mode === 'build') {
    return { relativePath, logs };
  }

  const message = String(payload.commitMessage || '').trim() || `post: ${payload.title}`;
  await checkedRun(logs, 'Git add', 'git', ['add', '--', relativePath], { shell: false });
  await checkedRun(logs, 'Git commit', 'git', ['commit', '-m', message, '--', relativePath], { shell: false });
  await checkedRun(logs, 'Git push', 'git', ['push'], { shell: false });

  return { relativePath, logs };
}

async function handleApi(req, res, url) {
  try {
    if (req.method === 'GET' && url.pathname === '/api/posts') {
      const [folders, posts] = await Promise.all([listFolders(), walkMarkdown(contentRoot)]);
      posts.sort((a, b) => (b.pubDate || b.modified).localeCompare(a.pubDate || a.modified));
      json(res, 200, { ok: true, folders, posts: posts.slice(0, 24) });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/publish') {
      const payload = await readJson(req);
      const result = await publishPost(payload);
      json(res, 200, { ok: true, ...result });
      return;
    }

    notFound(res);
  } catch (error) {
    json(res, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const html = String.raw`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>博客发布后台</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --panel: #ffffff;
        --panel-soft: #eef4f8;
        --text: #17202a;
        --muted: #617181;
        --line: #d8e0e8;
        --brand: #0f766e;
        --brand-dark: #115e59;
        --accent: #b45309;
        --danger: #b42318;
        --shadow: 0 12px 40px rgb(29 41 57 / 10%);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--text);
        font-family:
          "Noto Sans SC",
          "Microsoft YaHei",
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      .shell {
        display: grid;
        grid-template-columns: minmax(620px, 1fr) clamp(320px, 28vw, 400px);
        gap: 18px;
        width: min(1380px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0;
        align-items: start;
      }

      header {
        grid-column: 1 / -1;
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 2px 2px;
      }

      h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.2;
        letter-spacing: 0;
      }

      header p {
        margin: 8px 0 0;
        color: var(--muted);
      }

      .status {
        min-width: 180px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        padding: 10px 12px;
        color: var(--muted);
        text-align: right;
      }

      .panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        box-shadow: var(--shadow);
      }

      .main {
        padding: 18px;
        align-self: start;
      }

      .side {
        position: sticky;
        top: 16px;
        display: grid;
        grid-template-rows: minmax(220px, 34vh) minmax(240px, 1fr);
        gap: 14px;
        height: calc(100vh - 128px);
        min-height: 560px;
        align-self: start;
      }

      .section-title {
        margin: 0 0 12px;
        font-size: 16px;
      }

      .dropzone {
        display: grid;
        place-items: center;
        min-height: 138px;
        border: 1px dashed #8aa2b6;
        border-radius: 8px;
        background: var(--panel-soft);
        color: var(--muted);
        text-align: center;
        cursor: pointer;
      }

      .dropzone strong {
        display: block;
        margin-bottom: 6px;
        color: var(--text);
      }

      .dropzone.dragover {
        border-color: var(--brand);
        background: #e5f5f2;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 16px;
      }

      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 13px;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        color: var(--text);
        padding: 10px 11px;
        outline: none;
      }

      textarea {
        min-height: 360px;
        resize: vertical;
        line-height: 1.6;
        font-family:
          "JetBrains Mono",
          Consolas,
          "Microsoft YaHei",
          monospace;
      }

      input:focus,
      select:focus,
      textarea:focus {
        border-color: var(--brand);
        box-shadow: 0 0 0 3px rgb(15 118 110 / 14%);
      }

      .span-2 {
        grid-column: 1 / -1;
      }

      .checks {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 18px;
        margin: 14px 0;
      }

      .check {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--text);
      }

      .check input {
        width: auto;
      }

      .path {
        margin: 12px 0 0;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fbfcfe;
        padding: 10px 12px;
        color: var(--muted);
        overflow-wrap: anywhere;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }

      button {
        border: 1px solid transparent;
        border-radius: 6px;
        padding: 10px 14px;
        cursor: pointer;
        color: #fff;
        background: var(--brand);
      }

      button:hover {
        background: var(--brand-dark);
      }

      button.secondary {
        border-color: var(--line);
        color: var(--text);
        background: #fff;
      }

      button.secondary:hover {
        background: #f8fafc;
      }

      button.warning {
        background: var(--accent);
      }

      button.warning:hover {
        background: #92400e;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.58;
      }

      .card {
        display: flex;
        min-height: 0;
        flex-direction: column;
        padding: 14px;
      }

      .post-list {
        display: grid;
        gap: 10px;
        margin: 0;
        padding: 0;
        list-style: none;
        overflow: auto;
        padding-right: 4px;
      }

      .post {
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px;
        background: #fff;
      }

      .post-title {
        margin: 0 0 4px;
        font-size: 14px;
        color: var(--text);
      }

      .post-meta {
        color: var(--muted);
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .badge {
        display: inline-block;
        margin-left: 6px;
        border-radius: 999px;
        background: #fff4ed;
        color: var(--accent);
        padding: 1px 7px;
      }

      pre {
        flex: 1;
        min-height: 0;
        overflow: auto;
        margin: 0;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #111827;
        color: #d1fae5;
        padding: 12px;
        white-space: pre-wrap;
        line-height: 1.5;
      }

      .error {
        color: var(--danger);
      }

      @media (max-width: 920px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .side {
          position: static;
          grid-template-rows: auto auto;
          height: auto;
          min-height: 0;
        }

        .post-list {
          max-height: 360px;
        }

        pre {
          min-height: 220px;
        }

        header {
          align-items: stretch;
          flex-direction: column;
        }

        .status {
          text-align: left;
        }
      }

      @media (max-width: 640px) {
        .shell {
          width: min(100% - 20px, 1380px);
          padding: 12px 0;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div>
          <h1>博客发布后台</h1>
          <p>导入 Markdown 笔记，整理元数据，保存或一键发布到 GitHub Pages。</p>
        </div>
        <div id="status" class="status">本地后台已连接</div>
      </header>

      <main class="panel main">
        <section>
          <h2 class="section-title">导入笔记</h2>
          <input id="file" type="file" accept=".md,.mdx,text/markdown" hidden />
          <div id="dropzone" class="dropzone" tabindex="0">
            <div>
              <strong>选择或拖入 Markdown 文件</strong>
              <span>也可以直接在正文区域粘贴内容</span>
            </div>
          </div>
        </section>

        <section class="grid">
          <label>
            标题
            <input id="title" placeholder="文章标题" />
          </label>
          <label>
            文件名
            <input id="slug" placeholder="my-post" />
          </label>
          <label class="span-2">
            摘要
            <input id="description" placeholder="一句话摘要，用于列表和 SEO" />
          </label>
          <label>
            发布日期
            <input id="pubDate" type="date" />
          </label>
          <label>
            扩展名
            <select id="extension">
              <option value=".md">.md</option>
              <option value=".mdx">.mdx</option>
            </select>
          </label>
          <label>
            保存目录
            <select id="folder">
              <option value="">根目录</option>
            </select>
          </label>
          <label>
            分类
            <input id="category" placeholder="blog / tutorials / leetcode" />
          </label>
          <label class="span-2">
            标签
            <input id="tags" placeholder="Astro, 博客, 自动化" />
          </label>
          <label class="span-2">
            正文
            <textarea id="markdown" placeholder="# 标题&#10;&#10;在这里粘贴 Markdown 正文"></textarea>
          </label>
        </section>

        <div class="checks">
          <label class="check"><input id="draft" type="checkbox" /> 保存为草稿</label>
          <label class="check"><input id="pinned" type="checkbox" /> 置顶</label>
          <label class="check"><input id="overwrite" type="checkbox" /> 允许覆盖同名文章</label>
        </div>

        <label>
          提交说明
          <input id="commitMessage" placeholder="post: 新增 XXX" />
        </label>

        <div id="path" class="path">将保存到：src/content/blog/untitled.md</div>

        <div class="actions">
          <button id="publish">发布到博客</button>
          <button id="build" class="warning">保存并构建</button>
          <button id="save" class="secondary">只保存文件</button>
          <button id="clear" class="secondary">清空</button>
        </div>
      </main>

      <aside class="side">
        <section class="panel card">
          <h2 class="section-title">执行日志</h2>
          <pre id="log">等待操作</pre>
        </section>
        <section class="panel card">
          <h2 class="section-title">最近文章</h2>
          <ul id="posts" class="post-list"></ul>
        </section>
      </aside>
    </div>

    <script>
      const state = {
        sourceName: '',
      };

      const $ = (id) => document.getElementById(id);
      const fields = {
        file: $('file'),
        dropzone: $('dropzone'),
        title: $('title'),
        slug: $('slug'),
        description: $('description'),
        pubDate: $('pubDate'),
        extension: $('extension'),
        folder: $('folder'),
        category: $('category'),
        tags: $('tags'),
        markdown: $('markdown'),
        draft: $('draft'),
        pinned: $('pinned'),
        overwrite: $('overwrite'),
        commitMessage: $('commitMessage'),
        path: $('path'),
        log: $('log'),
        status: $('status'),
        posts: $('posts'),
      };

      fields.pubDate.value = new Date().toISOString().slice(0, 10);

      function escapeHtml(value) {
        return String(value)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      }

      function slugify(value) {
        return String(value || '')
          .trim()
          .replace(/[\\/:*?"<>|#]+/g, '-')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || 'untitled';
      }

      function splitFrontmatter(markdown) {
        const normalized = String(markdown || '').replace(/^\uFEFF/, '');
        const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        if (!match) return { frontmatter: '', body: normalized };
        return {
          frontmatter: match[1],
          body: normalized.slice(match[0].length),
        };
      }

      function readFrontmatterValue(frontmatter, key) {
        const re = new RegExp('^' + key + ':\\s*(.+)$', 'm');
        const match = frontmatter.match(re);
        if (!match) return '';
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }

      function readTags(frontmatter) {
        const raw = readFrontmatterValue(frontmatter, 'tags');
        if (!raw) return '';
        if (raw.startsWith('[') && raw.endsWith(']')) {
          return raw
            .slice(1, -1)
            .split(',')
            .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean)
            .join(', ');
        }
        return raw;
      }

      function firstHeading(markdown) {
        const match = markdown.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : '';
      }

      function firstParagraph(markdown) {
        return markdown
          .replace(/^#.*$/gm, '')
          .split(/\n{2,}/)
          .map((part) => part.replace(/\s+/g, ' ').trim())
          .find((part) => part && !part.startsWith(String.fromCharCode(96, 96, 96))) || '';
      }

      function applyMarkdown(markdown, fileName = '') {
        const { frontmatter, body } = splitFrontmatter(markdown);
        const baseName = fileName.replace(/\.(md|mdx)$/i, '');
        const title = readFrontmatterValue(frontmatter, 'title') || firstHeading(body) || baseName;
        const description = readFrontmatterValue(frontmatter, 'description') || firstParagraph(body).slice(0, 120);
        const pubDate = readFrontmatterValue(frontmatter, 'pubDate') || fields.pubDate.value;
        const category = readFrontmatterValue(frontmatter, 'category');

        fields.title.value = title;
        fields.slug.value = slugify(baseName || title);
        fields.description.value = description;
        fields.pubDate.value = pubDate.slice(0, 10);
        fields.category.value = category;
        fields.tags.value = readTags(frontmatter);
        fields.draft.checked = readFrontmatterValue(frontmatter, 'draft') === 'true';
        fields.pinned.checked = readFrontmatterValue(frontmatter, 'pinned') === 'true';
        fields.markdown.value = body.trimStart();
        fields.commitMessage.value = title ? 'post: ' + title : '';
        updatePath();
      }

      function updatePath() {
        const folder = fields.folder.value ? fields.folder.value + '/' : '';
        const slug = slugify(fields.slug.value || fields.title.value);
        fields.path.textContent = '将保存到：src/content/blog/' + folder + slug + fields.extension.value;
      }

      function writeLog(message, isError = false) {
        fields.log.classList.toggle('error', isError);
        fields.log.textContent = message;
        requestAnimationFrame(() => {
          fields.log.scrollTop = fields.log.scrollHeight;
        });
      }

      function setBusy(isBusy) {
        for (const id of ['publish', 'build', 'save', 'clear']) {
          $(id).disabled = isBusy;
        }
        fields.status.textContent = isBusy ? '正在执行...' : '本地后台已连接';
      }

      async function loadPosts() {
        const response = await fetch('/api/posts');
        const data = await response.json();
        if (!data.ok) throw new Error(data.error || '加载文章失败');

        fields.folder.innerHTML = '<option value="">根目录</option>' + data.folders
          .map((folder) => '<option value="' + escapeHtml(folder) + '">' + escapeHtml(folder) + '</option>')
          .join('');

        fields.posts.innerHTML = data.posts
          .map((post) =>
            '<li class="post">' +
              '<p class="post-title">' + escapeHtml(post.title) + (post.draft ? '<span class="badge">草稿</span>' : '') + '</p>' +
              '<div class="post-meta">' + escapeHtml(post.pubDate || '未设置日期') + ' · ' + escapeHtml(post.path) + '</div>' +
            '</li>'
          )
          .join('') || '<li class="post"><p class="post-title">暂无文章</p></li>';
      }

      function payload(mode) {
        return {
          mode,
          title: fields.title.value.trim(),
          slug: slugify(fields.slug.value || fields.title.value),
          description: fields.description.value.trim(),
          pubDate: fields.pubDate.value,
          extension: fields.extension.value,
          folder: fields.folder.value,
          category: fields.category.value.trim(),
          tags: fields.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean),
          markdown: fields.markdown.value,
          draft: fields.draft.checked,
          pinned: fields.pinned.checked,
          overwrite: fields.overwrite.checked,
          commitMessage: fields.commitMessage.value.trim(),
        };
      }

      async function submit(mode) {
        setBusy(true);
        writeLog(mode === 'publish'
          ? '正在保存、构建、提交并推送...'
          : mode === 'build'
            ? '正在保存并构建...'
            : '正在保存...');

        try {
          const response = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload(mode)),
          });
          const data = await response.json();
          if (!data.ok) throw new Error(data.error || '操作失败');

          writeLog(data.logs.join('\n\n'));
          await loadPosts();
        } catch (error) {
          writeLog(error.message || String(error), true);
        } finally {
          setBusy(false);
        }
      }

      async function readFile(file) {
        state.sourceName = file.name;
        const markdown = await file.text();
        fields.extension.value = /\.mdx$/i.test(file.name) ? '.mdx' : '.md';
        applyMarkdown(markdown, file.name);
      }

      fields.dropzone.addEventListener('click', () => fields.file.click());
      fields.dropzone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') fields.file.click();
      });
      fields.dropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        fields.dropzone.classList.add('dragover');
      });
      fields.dropzone.addEventListener('dragleave', () => {
        fields.dropzone.classList.remove('dragover');
      });
      fields.dropzone.addEventListener('drop', async (event) => {
        event.preventDefault();
        fields.dropzone.classList.remove('dragover');
        const file = event.dataTransfer.files[0];
        if (file) await readFile(file);
      });
      fields.file.addEventListener('change', async () => {
        const file = fields.file.files[0];
        if (file) await readFile(file);
      });

      for (const field of [fields.title, fields.slug, fields.folder, fields.extension]) {
        field.addEventListener('input', updatePath);
        field.addEventListener('change', updatePath);
      }
      fields.title.addEventListener('input', () => {
        if (!fields.slug.value.trim()) fields.slug.value = slugify(fields.title.value);
        if (!fields.commitMessage.value.trim()) fields.commitMessage.value = 'post: ' + fields.title.value.trim();
        updatePath();
      });

      $('publish').addEventListener('click', () => submit('publish'));
      $('build').addEventListener('click', () => submit('build'));
      $('save').addEventListener('click', () => submit('save'));
      $('clear').addEventListener('click', () => {
        fields.title.value = '';
        fields.slug.value = '';
        fields.description.value = '';
        fields.category.value = '';
        fields.tags.value = '';
        fields.markdown.value = '';
        fields.commitMessage.value = '';
        fields.draft.checked = false;
        fields.pinned.checked = false;
        fields.overwrite.checked = false;
        fields.pubDate.value = new Date().toISOString().slice(0, 10);
        updatePath();
      });

      loadPosts()
        .then(updatePath)
        .catch((error) => {
          fields.status.textContent = '后台连接异常';
          writeLog(error.message || String(error), true);
        });
    </script>
  </body>
</html>
`;

const server = createServer(async (req, res) => {
  const host = req.headers.host || `127.0.0.1:${port}`;
  const url = new URL(req.url || '/', `http://${host}`);

  if (url.pathname.startsWith('/api/')) {
    await handleApi(req, res, url);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/') {
    text(res, 200, html, 'text/html; charset=utf-8');
    return;
  }

  notFound(res);
});

let usingFallbackPort = false;

server.on('error', (error) => {
  if (!usingFallbackPort && port !== 0 && (error.code === 'EACCES' || error.code === 'EADDRINUSE')) {
    usingFallbackPort = true;
    console.warn(`Port ${port} is unavailable, falling back to a random local port.`);
    server.listen(0, '127.0.0.1');
    return;
  }

  console.error(error);
  process.exitCode = 1;
});

server.on('listening', () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : port;
  console.log(`Blog admin is running at http://127.0.0.1:${activePort}`);
});

server.listen(port, '127.0.0.1');
