# 博客搭建与上线指南

一个用 Astro 搭的个人技术博客，支持深色模式、标签分类、Giscus 评论、RSS、中文排版优化，自动部署到 GitHub Pages。

---

## 1. 本地运行

```bash
npm install      # 安装依赖（首次）
npm run dev      # 本地预览 http://localhost:4321
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

> 要求 Node ≥ 22.12（偶数版本）。

---

## 2. 改成你自己的信息（必做）

| 文件 | 改什么 |
| --- | --- |
| `src/consts.ts` | `SITE_TITLE` 站点标题、`SITE_DESCRIPTION` 简介、`AUTHOR` 作者名 |
| `astro.config.mjs` | `site` 改成 `https://你的用户名.github.io` |
| `public/robots.txt` | Sitemap 地址里的域名 |
| `src/pages/about.astro` | 关于页内容、GitHub 链接 |

---

## 3. 写文章

在 `src/content/blog/` 下新建 `.md` 或 `.mdx` 文件：

```markdown
---
title: '文章标题'
description: '一句话摘要（用于列表和 SEO）'
pubDate: 2026-06-11
tags: ['标签1', '标签2']
draft: false          # true = 草稿，不发布
heroImage: '/xxx.jpg' # 可选，封面图
---

正文用 Markdown 写……
```

- 文件名就是 URL：`my-post.md` → `/blog/my-post/`
- `draft: true` 的文章不会出现在列表、标签页和 RSS 里
- 标签会自动生成 `/tags/<标签>` 聚合页

把 `welcome.md` 和 `markdown-guide.md` 这两篇示例删掉换成你自己的即可。

---

## 4. 配置评论（Giscus，可选但推荐）

评论基于 GitHub Discussions，需要在仓库建好后操作：

1. 仓库 **Settings → General → Features** 勾选 **Discussions**
2. 安装 giscus app：<https://github.com/apps/giscus> → 授权给你的博客仓库
3. 打开 <https://giscus.app>，在「仓库」填 `你的用户名/你的用户名.github.io`，
   页面下方会生成一段配置，复制其中 4 个值
4. 把它们填进 `src/components/Comments.astro` 顶部的 `GISCUS` 对象：
   - `repo`、`repoId`、`category`、`categoryId`

> 没配置时评论区会显示一行友好提示，不影响其他功能。

---

## 5. 部署到 GitHub Pages

### 5.1 创建仓库
在 GitHub 新建一个**名字必须是** `你的用户名.github.io` 的仓库（公开）。

### 5.2 开启 Actions 部署
仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。

### 5.3 推送代码
```bash
git init
git add .
git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

推送后，`.github/workflows/deploy.yml` 会自动构建并部署。
在仓库 **Actions** 标签查看进度，绿勾后访问 **https://你的用户名.github.io** 。

---

## 6. 功能速查

| 功能 | 位置 |
| --- | --- |
| 深色模式切换 | 右上角按钮，记忆在 localStorage，跟随系统默认 |
| 标签总览 | `/tags` |
| 单标签文章 | `/tags/<标签>` |
| RSS | `/rss.xml` |
| 站点地图 | `/sitemap-index.xml`（构建后生成） |
| 404 | 自动 |

---

## 7. 目录结构

```
src/
├── components/      # 可复用组件（Header/Footer/主题切换/评论/标签/日期）
├── content/blog/    # ← 你的文章放这里
├── layouts/         # 页面与文章布局
├── pages/           # 路由（首页/列表/详情/标签/关于/RSS/404）
├── styles/          # 全局样式 + 深色模式变量
├── consts.ts        # 站点常量（标题/作者）
└── content.config.ts# 文章集合 schema
public/              # 静态资源（favicon/robots）
.github/workflows/   # 自动部署
```
