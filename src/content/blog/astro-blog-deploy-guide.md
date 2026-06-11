---
title: '用 Astro 从零搭建个人技术博客并部署到 GitHub Pages'
description: '从环境准备、核心配置、功能实现到 GitHub Pages 自动部署的完整建站教程。'
pubDate: 2026-06-11
tags: ['Astro', '建站', '教程']
pinned: true
---

> 本文记录用 **Astro + GitHub Pages** 搭建个人技术博客的完整流程，从环境准备到上线，照着做即可得到一个支持深色模式、中文排版、标签分类、评论、RSS 的博客。

---

## 一、技术选型与环境准备

### 为什么选 Astro + GitHub Pages

| 维度 | 说明 |
| --- | --- |
| **Astro** | 内容优先的静态站点生成器，加载极快，原生支持 Markdown/MDX，可按需引入 React/Vue。最适合个人博客。 |
| **GitHub Pages** | 免费托管静态站点，配合 GitHub Actions 推送即自动部署，零成本。 |

### 环境要求

| 工具 | 版本要求 | 检查命令 |
| --- | --- | --- |
| Node.js | **≥ 22.12（偶数版本）** | `node --version` |
| npm | 跟随 Node | `npm --version` |
| Git | 任意较新版 | `git --version` |

> Astro 6 要求 Node 偶数版本（22、24…），不支持奇数版（23 等）。

---

## 二、创建项目

在你想放项目的空文件夹里执行：

```bash
npm create astro@latest . -- --template blog
```

- `.` 表示在当前目录创建
- `--template blog` 使用官方博客模板，自带：文章集合、RSS、sitemap、SEO、分页、列表/详情页

按提示选择「安装依赖：是」「初始化 Git：是」即可。

### 项目目录结构

```
my-blog/
├── astro.config.mjs       # Astro 主配置（site / 集成 / markdown）
├── package.json
├── tsconfig.json
├── public/                # 静态资源（favicon、robots.txt）
├── src/
│   ├── consts.ts          # 站点常量（标题/作者/评论配置）
│   ├── content.config.ts  # 文章集合 schema
│   ├── content/blog/      # ← 你的文章放这里
│   ├── components/        # 组件（页头/页脚/主题切换/评论/标签）
│   ├── layouts/           # 页面与文章布局
│   ├── pages/             # 路由（首页/列表/详情/标签/RSS/404）
│   └── styles/            # 全局样式
└── .github/workflows/     # GitHub Actions 自动部署
```

---

## 三、核心配置

### 3.1 `astro.config.mjs`

```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 用户主页站：直接是根地址，不需要 base
  // ↓↓↓ 替换成你的 GitHub 用户名 ↓↓↓
  site: 'https://你的用户名.github.io',
  integrations: [mdx(), sitemap()],
  markdown: {
    // 关键：关闭 SmartyPants，避免把中文直角引号、破折号
    // 错误转换成英文花引号。（Astro 6 默认为 true，必须显式 false）
    smartypants: false,
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
```

> ⚠️ **中文博客必做**：`smartypants: false`。否则中文标点会被错误转换。

### 3.2 站点常量 `src/consts.ts`

```ts
export const SITE_TITLE = '我的技术博客';
export const SITE_DESCRIPTION = '记录技术学习、踩坑与思考的个人博客。';
export const AUTHOR = '你的名字';
```

> 全站标题只在此定义一处，页头、首页、SEO、RSS 全部引用它，改一处即全站生效。

### 3.3 文章集合 schema `src/content.config.ts`

```ts
import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  // Content Layer API（Astro 5/6）：从目录加载 md/mdx
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

> **Astro 6 要点**：配置文件名是 `src/content.config.ts`（不是旧的 `src/content/config.ts`）；用 `glob()` loader；页面里渲染单篇用 `import { render } from 'astro:content'` 的 `render(entry)`，不再是 `entry.render()`。

---

## 四、核心功能实现

### 4.1 中文字体与排版

安装思源黑体：

```bash
npm install @fontsource/noto-sans-sc
```

全局样式：

```css
@import '@fontsource/noto-sans-sc/400.css';
@import '@fontsource/noto-sans-sc/700.css';

body {
  font-family: 'Noto Sans SC', system-ui, -apple-system, sans-serif;
  line-height: 1.75;      /* 中文阅读更舒适的行高 */
  letter-spacing: 0.02em; /* CJK 字间距微调 */
}
```

根布局 `<html lang="zh-CN">`，日期用 `toLocaleDateString('zh-CN', {...})` 输出「2026年6月11日」。

### 4.2 深色模式（防闪烁）

核心是一段**内联防闪烁脚本**，放在 `<head>` 内、页面渲染前执行，首屏就带正确明暗 class，刷新不闪白：

```html
<script is:inline>
  (function () {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if ((stored || (prefersDark ? 'dark' : 'light')) === 'dark') {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

配色用 CSS 变量定义两套（`:root` 浅色 / `html.dark` 深色），所有颜色引用变量，切换 `html.dark` 即整站换肤。

### 4.3 标签分类系统

- schema 里加 `tags: z.array(z.string())`
- 新增 `src/pages/tags/index.astro`（标签云）和 `src/pages/tags/[tag].astro`（聚合页）
- 文章打标签即自动生成 `/tags/<标签>` 聚合页，无需手动建页

### 4.4 RSS / sitemap / SEO

- RSS：`src/pages/rss.xml.js` 用 `@astrojs/rss` 输出（模板内置）
- sitemap：`@astrojs/sitemap` 集成，构建后自动生成 `sitemap-index.xml`
- SEO：在 `<head>` 输出 Open Graph、Twitter Card、canonical 等 meta

### 4.5 列表分页

文章多了之后给 `/blog` 加分页，用 Astro 的 `paginate()`：

```astro
---
export const getStaticPaths = (async ({ paginate }) => {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return paginate(posts, { pageSize: 12 });
}) satisfies GetStaticPaths;

const { page } = Astro.props;
---
```

文件命名 `src/pages/blog/[...page].astro`，第一页是 `/blog`、后续 `/blog/2`。

---

## 五、写文章

在 `src/content/blog/` 下新建 `.md` 或 `.mdx` 文件：

```markdown
---
title: '文章标题'
description: '一句话摘要（用于列表和 SEO）'
pubDate: 2026-06-15
tags: ['React', '前端']
draft: false          # true = 草稿，不发布
---

正文用 Markdown 书写……
```

| 要点 | 说明 |
| --- | --- |
| **文件名即网址** | `my-post.md` → `/blog/my-post/`，建议用英文+连字符 |
| **草稿** | `draft: true` 的文章不出现在列表、标签页和 RSS |
| **标签** | 填 `tags` 即自动生成分类聚合页 |
| **本地预览** | `npm run dev`，保存自动刷新 |

---

## 六、部署到 GitHub Pages

### 6.1 创建仓库

在 GitHub 新建仓库，**名字必须是** `你的用户名.github.io`（公开）。

### 6.2 添加 GitHub Actions 部署流水线

新建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v4
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 6.3 开启 Pages（关键设置）

仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（不是 "Deploy from a branch"）。

### 6.4 推送上线

```bash
git init
git add -A
git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

推送后 Actions 自动构建部署，在仓库 **Actions** 标签看进度，绿勾后访问 **https://你的用户名.github.io**。

> 之后每次写完文章 `git add -A && git commit && git push`，1–2 分钟自动更新上线。

---

## 七、配置评论系统（Giscus）

基于 GitHub Discussions，免费无广告。

1. 仓库设为 **Public**，**Settings → Features** 勾选 **Discussions**
2. 安装并授权 giscus app：<https://github.com/apps/giscus>
3. 打开 <https://giscus.app>，仓库填 `你的用户名/你的用户名.github.io`，选一个分类（推荐 Announcements），复制生成的 `data-repo-id` 和 `data-category-id`
4. 把这两个值填进站点配置的 `GISCUS` 对象

---

## 八、上线验证清单

| 检查项 | 怎么验证 |
| --- | --- |
| 站点可访问 | 打开 `https://你的用户名.github.io` |
| 构建无报错 | 本地 `npm run build` 零错误 |
| 深色模式 | 点右上角按钮切换，刷新不闪白 |
| 中文排版 | 字体、引号、行高正常 |
| 标签 | `/tags` 标签云，点进聚合页 |
| RSS | 访问 `/rss.xml` 有文章 |
| 评论 | 文章底部出现评论框 |
| 响应式 | 手机访问布局正常 |

---

## 九、常见坑与排查

**坑 1：`git commit -am` 漏掉新文件。** `-a` 只暂存「已跟踪文件」的修改，不包含新建文件。新增文章/图片后用它提交，新文件不会上去。正确做法：新文件先 `git add -A` 再 commit；提交前用 `git status` 看一眼，`??` 开头的就是还没纳入的。

**坑 2：GitHub Pages 显示空白 / 404。** 确认 Pages 的 Source 选的是 **GitHub Actions**、Actions 跑成功、`site` 配置正确。

**坑 3：中文标点变成英文花引号。** `markdown.smartypants` 必须设为 `false`（Astro 6 默认是 `true`）。

**坑 4：外链图片裂图（防盗链）。** 某些图床（如语雀）会因防盗链拒绝外站引用。解决：把图片下载到本地 `public/` 目录、改用本地路径引用。

---

## 十、常用命令速查

```bash
# 本地开发
npm install        # 安装依赖
npm run dev        # 本地预览 http://localhost:4321
npm run build      # 生产构建到 dist/
npm run preview    # 预览构建产物

# 发布文章
git add -A
git commit -m "post: 新增 XXX 文章"
git push
```

---

*本文基于实际搭建过程整理，适用于 Astro 6 + GitHub Pages 用户主页站。*
