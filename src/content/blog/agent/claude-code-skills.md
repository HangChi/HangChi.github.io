---
title: 'Claude Code 推荐安装的 Skills'
description: '整理 Claude Code 常用 Skills 和插件生态，包括 Skill Creator、Find Skills、Superpowers、gstack、HyperFrames、Obsidian Skills 与飞书 CLI。'
pubDate: 2026-06-13
category: 'agent'
tags: ['Claude Code', 'Agent Skills', 'AI Agent', '工具', '效率工具']
---

> 记录推荐安装的 Claude Code Skills / Plugins，包含功能介绍、GitHub 仓库地址、安装方式、使用方式与常用命令。

## 目录

- [Skill Creator](#skill-creator) - 创建并优化自定义 Skill（Anthropic 官方）
- [Find Skills](#find-skills) - 发现并安装社区 Skills（Vercel Labs）
- [Superpowers](#superpowers) - 强大的工作流 Skills 集合
- [gstack](#gstack) - Garry Tan 的全套 Claude Code 配置（含无头浏览器）
- [ui-ux-pro-max](#ui-ux-pro-max) - 专业 UI/UX 设计辅助
- [HyperFrames](#hyperframes) - 基于 HTML/CSS 的视频合成
- [Obsidian Skills](#obsidian-skills) - Obsidian 原生格式专用 Skills（kepano）
- [Feishu CLI](#feishu-cli) - 飞书/Lark 命令行工具

---

## Skill Creator

**功能介绍**：Anthropic 官方提供的元 Skill，用于从零创建、修改、优化自定义 Skill，并支持 eval 测试与性能基准。它内置 `init_skill.py` 脚本可一键生成符合规范的 Skill 模板（含 SKILL.md 与 scripts/references/assets 目录）。该 Skill 包含在官方的 example-skills 集合中。

- GitHub 仓库：<https://github.com/anthropics/skills>

**安装方式**：

```bash
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```

**使用方式**：

- 直接对话触发，例如：`帮我创建一个用于生成周报的 Skill`
- 也可让它优化已有 Skill 的 description 以提升触发准确率，或对 Skill 跑 eval 评测
- SKILL.md 必填字段：`name`、`description`；详细文档放 `references/`，脚本放 `scripts/`

**常用命令**：

```bash
python init_skill.py             # 生成符合规范的 Skill 模板目录骨架
```

## Find Skills

**功能介绍**：Vercel Labs 出品的元 Skill，用于发现并安装开放 Skills 生态中的各种社区 Skills，相当于 Skills 的包管理器入口。它会优先推荐安装量高（1K+）、经过验证的 Skills。要求 Node.js 18+。

- GitHub 仓库：<https://github.com/vercel-labs/skills>

**安装方式**：

```bash
npx skills add vercel-labs/skills --skill find-skills
```

**使用方式**：

- 当你问「有没有能做 X 的 Skill」「帮我找个处理 Y 的 Skill」时自动触发
- 它会先查 skills.sh 排行榜，优先推荐安装量高、经过验证的 Skill

**常用命令**：

```bash
npx skills find                 # 交互式模糊搜索
npx skills find testing         # 按关键词搜索
npx skills add owner/repo --list           # 仅列出某仓库的 Skills，不安装
npx skills add owner/repo --skill <名称> -a claude-code   # 为 Claude Code 安装指定 Skill
npx skills add owner/repo --all            # 安装某仓库的全部 Skills
npx skills update               # 更新所有已安装 Skills
npx skills init my-skill        # 脚手架创建新 Skill
```

> 提示：作用域
>
> `-g` 全局安装（所有项目生效）；`-p` 仅当前项目生效。

## Superpowers

**功能介绍**：一个强大的 agentic Skills 框架与软件开发方法论，提供 20+ 经过实战检验的 Skills，覆盖头脑风暴 → 计划制定 → 测试驱动开发的完整工作流，并能根据需求自动触发对应 Skill。

- GitHub 仓库：<https://github.com/obra/superpowers>
- 插件市场：<https://github.com/obra/superpowers-marketplace>

**安装方式**（安装后需重启 Claude Code）：

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**使用方式**：

> 注意：旧版斜杠命令已废弃
>
> `/brainstorm`、`/write-plan`、`/execute-plan` 已移除，现在改为直接调用 Skill 或对话触发。

完整工作流（想法 → 计划 → 执行）：

1. **头脑风暴**：调用 `superpowers:brainstorming`（或说`用 superpowers 帮我梳理这个需求`）—— 通过提问澄清需求、给出 2-3 个方案，产出设计文档
2. **写计划**：调用 `superpowers:writing-plans` —— 拆成 2-5 分钟的小任务，计划存到 `docs/superpowers/plans/`
3. **执行**：调用 `superpowers:subagent-driven-development`（Claude Code 推荐）或 `superpowers:executing-plans`（无子代理的环境）

**常用命令**：

```text
superpowers:brainstorming                # 头脑风暴，澄清需求
superpowers:writing-plans                # 把需求拆成小任务计划
superpowers:subagent-driven-development  # 子代理逐任务执行（Claude Code 推荐）
superpowers:executing-plans              # 无子代理环境下执行计划
/help                                    # 验证 superpowers 命令是否已加载
```

## gstack

**功能介绍**：Garry Tan 的整套 Claude Code 配置，包含 23 个工具，分别扮演 CEO、设计师、工程经理、发布经理、文档工程师、QA 等角色。其核心亮点是一个常驻本地 Chromium 的无头浏览器（`/browse`），用于 QA 测试与网页自动化：首次调用约 3s 启动，之后每条命令约 100-200ms，闲置 30 分钟自动关闭，且会保持 cookie/标签/会话状态。

- GitHub 仓库：<https://github.com/garrytan/gstack>

**安装方式**：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup
```

> 说明：Windows 前提
>
> 需要先安装 [Bun](https://bun.sh)：
>
> ```powershell
> powershell -c "irm bun.sh/install.ps1 | iex"
> ```

**使用方式**：

- 用 `/browse <url>` 让 Claude 直接驱动浏览器做 QA 测试、网页自动化
- 默认无头运行；想观察 Claude 的操作时切换有头模式（`$B connect` / `$B disconnect`）
- 重复性抓取流程可用 `/scrape` 跑一次，再用 `/skillify` 固化为 Playwright 脚本，下次约 200ms 完成

**常用命令**（`$B` 为 browse 二进制路径）：

```bash
$B goto https://example.com     # 打开网页
$B snapshot -i                  # 列出可交互元素的 @e 引用
$B click @e30                   # 点击快照里编号 30 的元素
$B text                         # 获取页面纯文本
$B screenshot /tmp/page.png     # 截图
$B is visible ".modal"          # 状态断言（可见/可用/选中等）
$B chain                        # 把 JSON 数组管道进来，批量链式操作
```

- 斜杠命令：`/browse <url>`（默认无头）、`/open-gstack-browser`（可视化浏览器）、`/scrape <意图>`、`/skillify`

## ui-ux-pro-max

**功能介绍**：为构建专业 UI/UX 提供「设计智能」的 AI Skill，支持多平台、多框架。核心是一个 **设计系统生成器**（`design_system.py`）：通过多领域检索 + BM25/TF-IDF 排序，自动合成完整的设计系统（Master + Overrides 模式）。内置 344+ 设计资源（覆盖风格、配色、字体搭配、落地页范式、图表、UX 准则、图标等 10 个领域，含 67 种风格、57 组字体搭配、99 条 UX 准则），并支持 16 种技术栈。检测到 UI/UX 相关关键词时自动激活。

- GitHub 仓库：<https://github.com/nextlevelbuilder/ui-ux-pro-max-skill>
- 官网：<https://ui-ux-pro-max-skill.nextlevelbuilder.io/>

**安装方式**：

```bash
# 方式一：CLI（推荐）
npm install -g uipro-cli
uipro init --ai claude

# 方式二：插件市场
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

**使用方式**：

- **自动激活**：检测到 UI/UX 关键词时自动触发，自然语言对话即可
- **工作流**：请求 UI/UX 任务 → 自动生成设计系统 → 智能匹配最佳风格/配色/字体 → 生成代码（含正确的间距与最佳实践）→ 交付前校验常见 UI/UX 反模式
- **两种激活模式**：
    - *Skill Mode*（Claude Code、Cursor、Windsurf 等）：检测到关键词自动激活，安装完整内容
    - *Workflow Mode*（Kiro、GitHub Copilot、Roo Code 等）：需显式斜杠命令或手动调用，引用内容更轻量

**常用命令**（示例提示词）：

```text
帮我做一个 SaaS 产品的落地页
给医疗数据分析做一个仪表盘
设计一个带暗色模式的作品集网站
做一个电商的移动 App UI
```

> 提示：支持的技术栈
>
> HTML/Tailwind、React、Next.js、Vue、Nuxt.js、Nuxt UI、Svelte、ShadCN、Flutter、SwiftUI、React Native、Jetpack Compose

## HyperFrames

**功能介绍**：由 HeyGen 出品，基于 HTML/CSS 的视频合成框架（"Write HTML, Render video"），把 HTML/CSS/媒体/可寻址动画渲染成确定性的 MP4，适合程序化生成视频片段。要求 Node.js 22+ 与 FFmpeg。

- GitHub 仓库：<https://github.com/heygen-com/hyperframes>

**安装方式**：

```bash
npx skills add heygen-com/hyperframes
```

**使用方式**：

- 对话触发示例：`用 /hyperframes 做一个 10 秒的产品介绍，标题淡入、背景视频加轻柔背景音乐`
- 斜杠命令：`/hyperframes`（编排创作）、`/hyperframes-cli`（init/preview/render 等命令）、`/hyperframes-media`（TTS/转写/抠图等素材处理）
- 制作流程：scaffold 项目 → 写 HTML/动画 → preview 预览 → render 渲染为 MP4

**常用命令**（调用 hyperframes 工具干活，非安装）：

```bash
npx hyperframes init my-video        # 新建项目（自动安装 AI Skills）
cd my-video
npx hyperframes preview              # 浏览器实时预览
npx hyperframes render               # 渲染为 MP4
npx hyperframes render --quality draft   # 草稿质量，快速迭代
npx hyperframes lint                 # 检查 composition 问题
```

## Obsidian Skills

**功能介绍**：由 kepano（Obsidian 团队成员）维护的一套 **Obsidian 原生格式专用 Agent Skills** 集合，遵循 [Agent Skills 规范](https://agentskills.io/specification)，可被 Claude Code、Codex CLI、OpenCode 等任意兼容 Skills 的 Agent 使用。让 Agent 能正确读写 Obsidian 的各种原生文件格式，对管理 Obsidian vault 非常契合。

- GitHub 仓库：<https://github.com/kepano/obsidian-skills>

**包含的 Skills**：

| Skill | 作用 |
| --- | --- |
| `obsidian-markdown` | 创建/编辑 Obsidian Flavored Markdown（`.md`）：wikilink、嵌入、callout、properties 等 Obsidian 专属语法 |
| `obsidian-bases` | 创建/编辑 Obsidian Bases（`.base`）：视图、筛选、公式、汇总 |
| `json-canvas` | 创建/编辑 JSON Canvas（`.canvas`）：节点、连线、分组、连接 |
| `obsidian-cli` | 通过 Obsidian CLI 操作 vault，含插件与主题开发 |
| `defuddle` | 用 Defuddle 从网页提取干净的 Markdown，去除杂乱内容以节省 token |

**安装方式**：

```bash
# 方式一：插件市场
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills

# 方式二：npx skills
npx skills add https://github.com/kepano/obsidian-skills
```

> 说明：手动安装
>
> 也可将本仓库内容放入 vault 根目录的 `/.claude` 文件夹（Claude Code），或把 `skills/` 目录拷到 `~/.codex/skills`（Codex CLI）。

**使用方式**：

- 安装后对话即可触发，例如：`帮我用 Obsidian callout 语法重写这段笔记`、`给这个文件夹做一个 Base 视图`
- 处理 `.canvas`、`.base` 等 Obsidian 原生文件时会自动按规范读写，避免破坏格式

## Feishu CLI

**功能介绍**：飞书/Lark 官方命令行工具（ByteDance），覆盖消息、文档、多维表格、表格、日历、邮件、任务、会议等业务域，提供 200+ 命令与 26 个 `lark-*` AI Agent Skills，可让 Claude 直接操作飞书。

- GitHub 仓库：<https://github.com/larksuite/cli>

**安装方式**：

```bash
npm install -g @larksuite/cli
npx skills add larksuite/cli -y -g        # 安装配套 Skills（必需）
lark-cli config init                      # 配置应用凭证
lark-cli auth login --recommend           # 登录授权
```

**使用方式**：

- 安装并授权后，对话即可让 Claude 操作飞书（发消息、读写文档/多维表格、查日程等）
- 配套 Skills：`lark-im`、`lark-doc`、`lark-base`、`lark-sheets`、`lark-calendar`、`lark-mail`、`lark-task`、`lark-wiki`、`lark-openapi-explorer` 等
- 三档粒度：快捷命令（`+`）→ API 命令 → 原始 API（2500+ 端点）

**常用命令**（快捷命令以 `+` 前缀）：

```bash
lark-cli calendar +agenda                 # 查看日程
lark-cli im +messages-send --as bot --chat-id "oc_xxx" --text "Hello"   # 发消息
lark-cli auth login --domain calendar,task   # 仅授权指定业务域
```

> 注意：安全提示
>
> AI Agent 在你授权的范围内以你的身份操作，存在数据泄露或误操作风险，授权范围请按需收窄。
