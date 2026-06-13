# 爱达堡的技术博客

> 记录技术学习、踩坑与思考的个人博客。

基于 [Astro](https://astro.build) 构建的静态博客，部署在 GitHub Pages。
内容优先、加载极快、原生支持 Markdown / MDX 写作。

🔗 **在线访问**：<https://HangChi.github.io>

---

## ✨ 功能特性

- 🌗 **深色模式** —— 一键切换，记忆偏好，刷新不闪烁，自动跟随系统
- 🈶 **中文排版优化** —— 思源黑体、舒适行高、保护中文标点
- 🗂️ **分类与标签** —— 一级分类聚合文章，标签细分主题
- 💬 **评论系统** —— 基于 GitHub Discussions 的 [Giscus](https://giscus.app)
- 📱 **响应式布局** —— 手机 / 平板 / 桌面三档适配
- 📡 **RSS 订阅** —— `/rss.xml`
- 🔍 **SEO 友好** —— 自动生成 sitemap、Open Graph、规范链接
- 🎨 **代码高亮** —— Shiki 双主题，跟随明暗模式

## 🛠 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Astro 6 |
| 内容 | Markdown / MDX（Content Layer API） |
| 评论 | Giscus |
| 部署 | GitHub Pages + GitHub Actions |
| 字体 | Noto Sans SC（思源黑体） |

## 🚀 本地开发

> 需要 Node.js ≥ 22.12（偶数版本）

```bash
npm install      # 安装依赖
npm run dev      # 本地预览 http://localhost:4321
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

## ✍️ 写文章

在 `src/content/blog/` 下新建 `.md` 或 `.mdx` 文件：

```markdown
---
title: '文章标题'
description: '一句话摘要（用于列表和 SEO）'
pubDate: 2026-06-15
category: 'blog'
tags: ['React', '前端']
draft: false          # true = 草稿，不发布
---

正文用 Markdown 书写……
```

- **文件名即网址**：`my-post.md` → `/blog/my-post/`（建议用英文+连字符）
- **分类自动聚合**：填 `category` 可进入 `/categories/<分类>`；不填会按目录自动推断
- **标签自动生成聚合页**：填 `tags` 即可，无需手动建页
- **草稿**：`draft: true` 的文章不会出现在列表、标签页和 RSS 中

写好后推送即自动部署：

```bash
git add .
git commit -m "post: 新增 XXX 文章"
git push
```

## 📁 目录结构

```
src/
├── components/      # 可复用组件（页头/页脚/主题切换/评论/标签/日期）
├── content/blog/    # ← 文章放这里
├── layouts/         # 页面与文章布局
├── pages/           # 路由（首页/列表/详情/分类/标签/关于/RSS/404）
├── styles/          # 全局样式 + 深色模式变量
├── consts.ts        # 站点常量（标题/作者/Giscus 配置）
└── content.config.ts# 文章集合 schema
public/              # 静态资源（favicon / robots）
.github/workflows/   # GitHub Actions 自动部署
```

## ⚙️ 自定义配置

| 想改什么 | 改哪里 |
| --- | --- |
| 站点标题 / 简介 / 作者 | `src/consts.ts` |
| 站点域名（部署用） | `astro.config.mjs` 的 `site` |
| 评论（Giscus） | `src/consts.ts` 的 `GISCUS` 对象 |
| 配色 / 字体 / 排版 | `src/styles/global.css` |
| 关于页内容 | `src/pages/about.astro` |

> 📖 完整的搭建、配置与部署步骤见 **[SETUP.md](./SETUP.md)**

## 📄 许可

本项目代码采用 [MIT License](./LICENSE)，文章内容版权归作者所有。

---

由 [Astro](https://astro.build) 强力驱动 ⚡
