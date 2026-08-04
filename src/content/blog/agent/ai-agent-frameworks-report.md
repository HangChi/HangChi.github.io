---
title: 'AI Agent 框架全景报告 (2025-2026)'
description: '系统整理 30+ 主流 AI Agent 框架，涵盖通用框架、多 Agent 协作、自主 Agent、低代码平台、企业级框架等，附 GitHub 地址与选型指南。'
pubDate: 2026-07-27
category: 'agent'
tags: ['AI Agent', 'Agent 框架', '技术选型', 'LangChain', '多Agent协作', '选型指南']
---

> 系统整理当前主流的 AI Agent 框架，涵盖通用框架、多 Agent 协作框架、自主 Agent、低代码平台、企业级框架等，附 GitHub 地址与官网链接。

**整理时间：** 2026 年 7 月 ｜ **涵盖：** 30+ 框架

---

## 目录

- [选型快速指南](#选型快速指南)
- [一、通用 Agent 框架（9个）](#一通用-agent-框架)
- [二、多 Agent 协作框架（8个）](#二多-agent-协作框架)
- [三、自主 Agent 框架（4个）](#三自主-agent-框架)
- [四、低代码 / 可视化平台（5个）](#四低代码--可视化平台)
- [五、企业级 / 厂商框架（3个）](#五企业级--厂商框架)
- [六、有状态 / 记忆型框架（2个）](#六有状态--记忆型框架)
- [七、特定领域 / 轻量级框架（7个）](#七特定领域--轻量级框架)
- [框架对比速查表](#框架对比速查表)

---

## 选型快速指南

| 需求场景 | 推荐框架 | 理由 |
|---|---|---|
| 复杂状态管理 & 精细流程控制 | **LangGraph** | 图结构工作流，最成熟的生产级框架 |
| 多 Agent 角色协作 | **CrewAI** / **AutoGen** | 角色扮演，最低学习曲线 / 对话式多 Agent |
| TypeScript 技术栈 | **Mastra** / **Vercel AI SDK** | 原生 TS / 前端 UI 集成最强 |
| OpenAI / Anthropic 生态 | **OpenAI Agents SDK** / **Claude Agent SDK** | 官方出品，深度优化 |
| Google Cloud 生态 | **Google ADK** | 原生 Gemini 支持，A2A 协议 |
| RAG / 数据密集型 | **LlamaIndex** | 最强数据索引与检索 |
| 非技术人员快速搭建 | **Dify** / **Langflow** / **n8n** | 可视化拖拽 |
| .NET / 企业级 | **Semantic Kernel** | C#/Python/Java 三语言，Azure 集成 |
| 需要长期记忆 | **Letta** | 原 MemGPT，有状态 Agent |
| 追求极简 | **SmolAgents** / **Pydantic AI** | ~1000 行核心代码 / 类型安全 |

---

## 一、通用 Agent 框架

### 1. LangGraph

- **开源方：** LangChain 团队
- **GitHub：** [https://github.com/langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) (⭐ 37.6k)
- **官网：** [https://langchain-ai.github.io/langgraph/](https://langchain-ai.github.io/langgraph/)
- **语言：** Python / TypeScript
- **类型：** 单/多 Agent

LangChain 团队出品的图结构 Agent 编排引擎，将 Agent 工作流建模为有向图（节点+边），原生支持循环、条件分支和持久化状态。月下载量超 3800 万，是实际生产中使用最广泛的 Agent 框架。

**核心特性：**
- 状态图工作流建模，支持循环和条件分支
- 持久化检查点 + 时间旅行调试
- 人机协作（Human-in-the-loop）
- LangSmith 可观测性集成

---

### 2. LangChain

- **开源方：** LangChain Inc.
- **GitHub：** [https://github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain) (⭐ 117k)
- **官网：** [https://langchain.com/](https://langchain.com/)
- **语言：** Python / JavaScript
- **类型：** 单 Agent

最经典的 LLM 应用开发框架，提供链式调用、工具集成、记忆系统和 RAG 等模块化组件。拥有最大的社区生态和数百个预置集成。LangChain 是整个 Agent 生态的基石。

**核心特性：**
- 丰富的 LLM/向量库/工具集成生态
- ReAct、Plan-and-Execute 等经典 Agent 模式
- 文档加载、向量检索、对话记忆
- 与 LangGraph / LangSmith 无缝配合

---

### 3. OpenAI Agents SDK

- **开源方：** OpenAI 官方
- **GitHub：** [https://github.com/openai/openai-agents-python](https://github.com/openai/openai-agents-python) (⭐ 20.5k)
- **官网：** [https://openai.github.io/openai-agents-python/](https://openai.github.io/openai-agents-python/)
- **语言：** Python / TypeScript
- **类型：** 多 Agent

OpenAI 2025年3月发布的官方 Agent 框架，取代实验性 Swarm。核心抽象为 Handoff（交接）：Agent 之间显式转移控制权并携带上下文。月下载量超 1000 万。

**核心特性：**
- 四大原语：Agent、Tool、Handoff、Guardrail
- Agent 间 Handoff 交接机制
- 内置 Guardrails 安全防护
- 内置 Tracing 追踪（免费）
- 支持 100+ LLM（通过兼容端点）

---

### 4. Claude Agent SDK

- **开源方：** Anthropic 官方
- **GitHub：** [https://github.com/anthropics/claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python) (⭐ 3.1k)
- **官网：** [https://docs.anthropic.com/](https://docs.anthropic.com/)
- **语言：** Python / TypeScript
- **类型：** 单 Agent

Anthropic 第一方 Agent SDK（原 Claude Code SDK），暴露与 Claude Code 相同的 Agent 循环、工具执行和上下文管理能力。内置文件操作、Bash 执行、代码编辑、计算机使用等工具。

**核心特性：**
- 内置工具：文件读写、Bash、代码编辑、搜索
- Computer Use 计算机操作
- 子 Agent 和多 Agent 模式
- 与 Claude Opus/Sonnet 深度优化

---

### 5. Vercel AI SDK

- **开源方：** Vercel
- **GitHub：** [https://github.com/vercel/ai](https://github.com/vercel/ai) (⭐ 20M+ 月下载)
- **官网：** [https://ai-sdk.dev/](https://ai-sdk.dev/)
- **语言：** TypeScript
- **类型：** 单 Agent

TypeScript 生态最主流的 AI 工具包，月下载量超 2000 万。v6 版本加入原生 Agent 抽象（Agent 类 + ToolLoopAgent），统一 25+ AI 提供商接口。与 React/Next.js 深度集成。

**核心特性：**
- 多提供商统一接口（OpenAI/Anthropic/Google 等）
- React Hooks 流式 UI 组件
- MCP（模型上下文协议）支持
- Edge Runtime 兼容
- 动态工具（运行时定义）

---

### 6. LlamaIndex

- **开源方：** LlamaIndex Inc.
- **GitHub：** [https://github.com/run-llama/llama_index](https://github.com/run-llama/llama_index) (⭐ 40.9k)
- **官网：** [https://www.llamaindex.ai/](https://www.llamaindex.ai/)
- **语言：** Python / TypeScript
- **类型：** 多 Agent

从 GPT Index 演化而来的综合数据框架，在 RAG 和数据检索领域最强。支持 AgentWorkflow 和 llama-agers 编排 100+ Agent，提供 LlamaCloud 托管服务。被 Salesforce、KPMG 等企业采用。

**核心特性：**
- 强大的数据索引与检索引擎
- 40+ LlamaHub 社区工具
- 事件驱动工作流 AgentWorkflow
- 多模态数据处理（PDF/图像等）

---

### 7. Agno

- **开源方：** Agno（原 Phidata）
- **GitHub：** [https://github.com/agno-agi/agno](https://github.com/agno-agi/agno) (⭐ 41.2k)
- **官网：** [https://docs.agno.com/](https://docs.agno.com/)
- **语言：** Python
- **类型：** 单/多 Agent

2025年1月从 Phidata 更名而来，设计理念是"无图、无链、无复杂模式——纯 Python"。Agent 实例化仅需 5 微秒，内存占用比 LangGraph 低 50 倍。支持多模态输入和 MCP。

**核心特性：**
- 极简 API，约 10 行代码搞定 MCP
- 超高性能：Agent 实例化 <5μs
- 多模态：文本/音频/图像/视频
- 内置部署运行时

---

### 8. Pydantic AI

- **开源方：** Pydantic 团队
- **GitHub：** [https://github.com/pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai) (⭐ 18.6k)
- **官网：** [https://ai.pydantic.dev/](https://ai.pydantic.dev/)
- **语言：** Python
- **类型：** 单 Agent

Pydantic 团队打造的类型安全 Agent 框架。由于大量 Python Web 开发者已依赖 Pydantic，它是"零额外依赖风险"的选择。周下载量超 380 万，实际使用量排名前列。

**核心特性：**
- 类型安全 + 运行时验证
- 结构化输出（Structured Output）
- 极简抽象，贴近 LLM API
- 测试工具内置

---

### 9. Mastra

- **开源方：** Mastra（Gatsby 团队）
- **GitHub：** [https://github.com/mastra-ai/mastra](https://github.com/mastra-ai/mastra) (⭐ 26.3k)
- **官网：** [https://mastra.ai/](https://mastra.ai/)
- **语言：** TypeScript
- **类型：** 多 Agent

TypeScript 原生的全栈 Agent 框架，由 Gatsby 团队打造。YC W25 毕业，2026年1月获 1300 万美元融资。通过 Mastra Model Router 连接 3300+ 模型，内置工作流、记忆、RAG、评估和可视化 Studio。

**核心特性：**
- 原生 TypeScript 设计（非 Python 移植）
- 3300+ 模型提供商
- 持久化工作流 + 时间旅行调试
- 内置 Guardrails / Evals / Tracing
- Mastra Studio 可视化调试

---

## 二、多 Agent 协作框架

### 1. AutoGen

- **开源方：** Microsoft Research
- **GitHub：** [https://github.com/microsoft/autogen](https://github.com/microsoft/autogen) (⭐ 50.6k)
- **官网：** [https://microsoft.github.io/autogen/](https://microsoft.github.io/autogen/)
- **语言：** Python
- **类型：** 多 Agent / 研究型

微软研究院开发的多 Agent 对话框架，通过 Agent 间自然语言对话协作完成任务。支持 LLM、人类和工具的混合协作。分层架构（Core/AgentChat/Extensions），含 AutoGen Studio 无代码界面。注意：2025年底微软将其转为维护模式，推荐迁移至 Microsoft Agent Framework。

**核心特性：**
- 多 Agent 对话与群聊
- 代码执行与调试
- 人机协作（Human-in-the-loop）
- 异步消息与并行处理

---

### 2. CrewAI

- **开源方：** CrewAI Inc.
- **GitHub：** [https://github.com/crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) (⭐ 39.2k)
- **官网：** [https://www.crewai.com/](https://www.crewai.com/)
- **语言：** Python
- **类型：** 多 Agent

基于角色的多 Agent 协作框架，学习曲线最低。定义具有特定角色、目标和背景的 Agent，组成 "Crew" 协作完成任务。v2 新增顺序、层级和并行三种执行模式，约 20 行代码即可运行多 Agent Demo。

**核心特性：**
- 角色驱动设计（Role/Goal/Backstory）
- 三种流程模式：顺序/层级/并行
- Agent 间任务委托
- 内置记忆系统
- 企业版含 UI 和可观测性

---

### 3. MetaGPT

- **开源方：** 国内开源
- **GitHub：** [https://github.com/geekan/MetaGPT](https://github.com/geekan/MetaGPT) (⭐ 45.6k)
- **官网：** [https://www.deepwisdom.ai/](https://www.deepwisdom.ai/)
- **语言：** Python
- **类型：** 多 Agent

"虚拟软件公司"框架，输入一句话需求即可输出完整 PRD、竞品分析、API 设计和代码。角色分工：产品经理→架构师→工程师→QA。HumanEval Pass@1 达 81.7%。支持中文文档，社区活跃度高。

**核心特性：**
- 完整软件开发流程模拟
- 多角色协作（PM/架构师/开发/测试）
- 自然语言编程
- 代码仓库级输出

---

### 4. ChatDev

- **开源方：** 清华 OpenBMB
- **GitHub：** [https://github.com/OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev) (⭐ 28k)
- **官网：** [https://chatdev.modelbest.cn/](https://chatdev.modelbest.cn/)
- **语言：** Python
- **类型：** 多 Agent / 研究型

清华大学 OpenBMB 团队开源的虚拟软件公司框架。通过聊天链让不同角色（CEO/CTO/程序员/测试员）在设计、编码、测试、文档环节协作。过程可视化强，适合学术原型验证。输入"做五子棋"3分钟出可运行程序。

**核心特性：**
- 聊天链协作模式
- 完整软件生命周期模拟
- 过程可视化
- 学术研究友好

---

### 5. CAMEL

- **开源方：** CAMEL-AI.org
- **GitHub：** [https://github.com/camel-ai/camel](https://github.com/camel-ai/camel) (⭐ 12k)
- **官网：** [https://www.camel-ai.org/](https://www.camel-ai.org/)
- **语言：** Python
- **类型：** 多 Agent / 研究型

早期多 Agent 角色扮演框架，聚焦"一对一角色对话"（如 AI 用户 vs AI 助手）。双循环机制：人类给 AI User 目标 → AI User 与 AI Assistant 对话完成任务。适合研究角色交互逻辑。

**核心特性：**
- 角色扮演式 Agent 交互
- 双循环任务执行
- 大规模角色数据生成
- 多 Agent 通信协议研究

---

### 6. AgentScope

- **开源方：** 阿里巴巴
- **GitHub：** [https://github.com/modelscope/agentscope](https://github.com/modelscope/agentscope) (⭐ 8k+)
- **官网：** [https://modelscope.github.io/agentscope/](https://modelscope.github.io/agentscope/)
- **语言：** Python
- **类型：** 多 Agent / 企业级

阿里开源的分布式多 Agent 框架，支持单机多进程和多机协作。内置监控工具（通信耗时、成本统计），工程化成熟，适合大规模多 Agent 部署。适配国内模型生态。

**核心特性：**
- 分布式多 Agent 部署
- 单机多进程 + 多机协作
- 内置监控与成本统计
- 支持国产模型

---

### 7. Swarms Framework

- **开源方：** 社区开源
- **GitHub：** [https://github.com/kyegomez/swarms](https://github.com/kyegomez/swarms) (⭐ 3k+)
- **官网：** [https://swarms.ai/](https://swarms.ai/)
- **语言：** Python
- **类型：** 多 Agent

专注于"蜂群"式多 Agent 协作框架，让大量 Agent 像蜂群一样协同工作。支持多种编排模式和 Agent 拓扑结构。

**核心特性：**
- 蜂群式 Agent 编排
- 多种拓扑结构
- 大规模 Agent 协调

---

### 8. Microsoft Agent Framework

- **开源方：** Microsoft
- **GitHub：** [https://github.com/microsoft/agent-framework](https://github.com/microsoft/agent-framework) (⭐ 12.2k)
- **官网：** [https://github.com/microsoft/agent-framework](https://github.com/microsoft/agent-framework)
- **语言：** Python / .NET
- **类型：** 多 Agent / 企业级

微软推出的新一代 Agent 框架，融合了 AutoGen 和 Semantic Kernel 的理念，用于构建和运行单 Agent 及多 Agent 系统。作为 AutoGen 的继任者，深度集成 Azure 生态。

**核心特性：**
- 融合 AutoGen + Semantic Kernel
- 单/多 Agent 统一框架
- Azure 生态原生集成
- 企业级安全与合规

---

## 三、自主 Agent 框架

### 1. AutoGPT

- **开源方：** Significant Gravitas
- **GitHub：** [https://github.com/Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) (⭐ 183k)
- **官网：** [https://agpt.co/](https://agpt.co/)
- **语言：** Python
- **类型：** 自主 Agent

2023年引爆 AI Agent 概念的标志性项目，GitHub 星标达 18 万+。自主执行任务循环：搜索→规划→执行→自我反思。现已演化为可复用模块和工作流构建平台。展示了自主 Agent 的潜力，但可靠性仍需改进。

**核心特性：**
- 自主任务拆解与执行
- 20+ 内置工具（搜索/代码执行等）
- 自我反思与迭代改进
- 可视化界面

---

### 2. BabyAGI

- **开源方：** Yohei Nakajima
- **GitHub：** [https://github.com/yoheinakajima/babyagi](https://github.com/yoheinakajima/babyagi) (⭐ 22.2k)
- **官网：** [https://github.com/yoheinakajima/babyagi](https://github.com/yoheinakajima/babyagi)
- **语言：** Python
- **类型：** 自主 Agent / 研究型

仅约 100 行 Python 的任务驱动型自主 Agent。核心循环：生成任务→向量排序→执行→结果生成新任务。证明了任务驱动的 Agent 循环可以极简实现，启发了整整一代 Agent 构建者。

**核心特性：**
- 极简实现（~100行）
- 任务优先级队列
- 向量排序任务管理
- 循环式任务生成

---

### 3. SuperAGI

- **开源方：** TransformerOptimus
- **GitHub：** [https://github.com/TransformerOptimus/SuperAGI](https://github.com/TransformerOptimus/SuperAGI) (⭐ 17.6k)
- **官网：** [https://superagi.com/](https://superagi.com/)
- **语言：** Python
- **类型：** 自主 Agent / 企业级

企业级自主 Agent 管理平台，解决 AutoGPT 在生产环境使用难的问题。提供图形化界面、Agent 市场、并发运行、思维链可视化等功能，是功能完备的 Agent 基础设施工具。

**核心特性：**
- 图形化仪表盘
- Agent 市场与工具包
- 并发 Agent 运行
- 思维链可视化

---

### 4. OpenHands

- **开源方：** All-Hands-AI
- **GitHub：** [https://github.com/All-Hands-AI/OpenHands](https://github.com/All-Hands-AI/OpenHands) (⭐ 44.2k)
- **官网：** [https://www.all-hands.dev/](https://www.all-hands.dev/)
- **语言：** Python
- **类型：** 自主 Agent

前 OpenDevin，旨在成为"AI 软件工程师"的开源平台。Agent 可自主编写代码、运行命令、浏览网页、调用 API。让 AI 自主完成从需求到代码的全流程。

**核心特性：**
- 自主代码编写与执行
- Web 浏览与 API 调用
- 端到端软件开发
- Docker 沙箱执行

---

## 四、低代码 / 可视化平台

### 1. Dify

- **开源方：** Dify.AI
- **GitHub：** [https://github.com/langgenius/dify](https://github.com/langgenius/dify) (⭐ 100k+)
- **官网：** [https://dify.ai/](https://dify.ai/)
- **语言：** Python
- **类型：** 低代码

开源 LLM 应用开发平台（BaaS），集成可视化工作流编排、RAG 引擎和 Agent 能力。填补原型到生产之间的空白，支持私有化部署。被广泛用于企业知识库、客服系统和内部工具开发。

**核心特性：**
- 可视化 Prompt 编排
- RAG 管道 + Agent 双引擎
- LLMOps 全生命周期管理
- 支持私有化部署

---

### 2. Langflow

- **开源方：** DataStax
- **GitHub：** [https://github.com/langflow-ai/langflow](https://github.com/langflow-ai/langflow) (⭐ 44k+)
- **官网：** [https://www.langflow.org/](https://www.langflow.org/)
- **语言：** Python
- **类型：** 低代码

基于 LangChain 的可视化低代码 AI 应用构建器，拖拽式设计即可编排多 Agent 对话、记忆和检索。支持 Python 代码扩展，被 DataStax 收购后整合进 IBM 生态。

**核心特性：**
- 拖拽式可视化工作流
- 支持任何 LLM / 向量数据库
- 一键部署为 API
- Python 代码可扩展

---

### 3. Flowise

- **开源方：** FlowiseAI
- **GitHub：** [https://github.com/FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) (⭐ 30k)
- **官网：** [https://flowiseai.com/](https://flowiseai.com/)
- **语言：** TypeScript
- **类型：** 低代码

开源低代码 LLM 应用构建工具，提供拖拽式可视化界面。支持从简单组合工作流到自主 Agent 的多 Agent 系统、聊天助手和人机协作工作流。

**核心特性：**
- 可视化拖拽构建
- 多 Agent 系统支持
- 人机协作工作流
- 开源 + 云版本

---

### 4. n8n

- **开源方：** n8n GmbH
- **GitHub：** [https://github.com/n8n-io/n8n](https://github.com/n8n-io/n8n) (⭐ 160k+)
- **官网：** [https://n8n.io/](https://n8n.io/)
- **语言：** TypeScript
- **类型：** 低代码

融合无代码可视化与代码灵活性的工作流自动化平台，引入"AI 原生"能力。400+ 集成，支持 LangChain 集成构建自定义 Agent。适合集成密集型场景，GitHub 星标超 16 万。

**核心特性：**
- 400+ 预置集成
- 可视化 + 代码双模式
- LangChain AI 集成
- 支持自托管（Fair-code）

---

### 5. Botpress

- **开源方：** Botpress Inc.
- **GitHub：** [https://github.com/botpress/botpress](https://github.com/botpress/botpress) (⭐ 14.8k)
- **官网：** [https://botpress.com/](https://botpress.com/)
- **语言：** TypeScript
- **类型：** 低代码

对话式 AI 开发平台，提供可视化对话流设计和代码优先 SDK。内置 LLMz 推理引擎，支持复杂多步逻辑执行和企业级集成，专注于客服和对话场景。

**核心特性：**
- 可视化对话流设计
- 自定义推理引擎 LLMz
- 企业级扩展性
- 多渠道部署

---

## 五、企业级 / 厂商框架

### 1. Semantic Kernel

- **开源方：** Microsoft
- **GitHub：** [https://github.com/microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel) (⭐ 28.3k)
- **官网：** [https://learn.microsoft.com/en-us/semantic-kernel/](https://learn.microsoft.com/en-us/semantic-kernel/)
- **语言：** C# / Python / Java
- **类型：** 企业级

微软的企业级 AI 集成 SDK，支持 C#、Python、Java 三种语言。专为将 AI 能力嵌入已有企业应用设计，与 Azure OpenAI、Outlook、Teams、Dynamics 深度集成。注重安全、合规和治理。

**核心特性：**
- 三语言支持（C#/Python/Java）
- 插件/记忆/规划架构
- Azure 企业安全集成
- .NET 生态首选

---

### 2. Google ADK

- **开源方：** Google
- **GitHub：** [https://github.com/google/adk-python](https://github.com/google/adk-python) (⭐ 20.6k)
- **官网：** [https://google.github.io/adk-docs/](https://google.github.io/adk-docs/)
- **语言：** Python / Go / Java
- **类型：** 多 Agent / 企业级

Google 官方 Agent Development Kit，2025年 Cloud Next 大会发布。最大亮点是 A2A（Agent-to-Agent）协议，支持跨框架 Agent 通信，已有 50+ 合作伙伴。原生 Gemini 多模态支持。

**核心特性：**
- 四语言支持（Python/TS/Go/Java）
- A2A 跨框架 Agent 通信协议
- 原生 Gemini 多模态
- 工作流 Agent（顺序/并行/循环）
- 部署到 Vertex AI Agent Engine

---

### 3. AWS Bedrock Agents

- **开源方：** Amazon
- **官网：** [https://aws.amazon.com/bedrock/agents/](https://aws.amazon.com/bedrock/agents/)
- **类型：** 企业级 / 托管服务

AWS 全托管 Agent 服务，与 Bedrock 基础模型深度集成。企业无需管理基础设施即可构建和部署 AI Agent，支持知识库、行动组和多步推理。

**核心特性：**
- 全托管无服务器
- Bedrock 基础模型原生集成
- 知识库 + 行动组
- 企业安全与合规

---

## 六、有状态 / 记忆型框架

### 1. Letta

- **开源方：** Letta AI（原 MemGPT）
- **GitHub：** [https://github.com/letta-ai/letta](https://github.com/letta-ai/letta) (⭐ 15.9k)
- **官网：** [https://docs.letta.com/](https://docs.letta.com/)
- **语言：** Python / TypeScript
- **类型：** 记忆型

MemGPT 的正式化版本，专注于构建有状态（Stateful）Agent。引入类似操作系统的内存管理机制，让 Agent 拥有持久化长期记忆，在跨会话和时间跨度中保持一致身份。白盒架构，模型无关。

**核心特性：**
- OS 级虚拟内存管理
- 分层记忆：主上下文 + 外部存储
- 跨会话持久记忆
- Agent 开发环境（ADE）可视化
- Letta Agent SDK（TS）

---

### 2. DSPy

- **开源方：** Stanford NLP
- **GitHub：** [https://github.com/stanfordnlp/dspy](https://github.com/stanfordnlp/dspy) (⭐ 33.4k)
- **官网：** [https://dspy.ai/](https://dspy.ai/)
- **语言：** Python
- **类型：** 研究型

斯坦福 NLP 团队打造，最具学术创新性的框架。不写 Prompt，而是定义输入-输出签名（Signature），让 DSPy 自动编译优化 Prompt。将 Prompt 工程视为编程问题系统化优化。

**核心特性：**
- 声明式 Signature 编程
- 自动 Prompt 优化编译
- 模块化组合
- 学术前沿研究导向

---

## 七、特定领域 / 轻量级框架

### 1. SmolAgents

- **开源方：** Hugging Face
- **GitHub：** [https://github.com/huggingface/smolagents](https://github.com/huggingface/smolagents) (⭐ 28.4k)
- **官网：** [https://huggingface.co/docs/smolagents](https://huggingface.co/docs/smolagents)
- **语言：** Python
- **类型：** 轻量级

Hugging Face 出品的极简 Agent 库，核心代码仅约 1000 行。最大特色是 Code Agent 模式——Agent 直接编写并执行 Python 代码完成任务，比 JSON 工具调用少 30% 步骤和 LLM 调用。

**核心特性：**
- ~1000 行核心代码，极简
- Code Agent 模式（直接写 Python）
- 沙箱执行（E2B/Docker/Pyodide）
- 模型无关，支持 HF Hub 模型

---

### 2. GPT Researcher

- **开源方：** 社区开源
- **GitHub：** [https://github.com/assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) (⭐ 28.4k)
- **官网：** [https://gptr.dev/](https://gptr.dev/)
- **语言：** Python
- **类型：** 研究 Agent

自主研究 Agent，串行多 Agent 协作：规划者生成研究问题→执行者搜索信息→汇总者生成带引用的长报告。适合学术论文、市场分析报告撰写。

**核心特性：**
- 自主网络研究
- 并行信息收集
- 带引用的长篇报告
- 支持本地文件

---

### 3. Qwen-Agent

- **开源方：** 阿里 Qwen 团队
- **GitHub：** [https://github.com/QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent) (⭐ 16.8k)
- **官网：** [https://github.com/QwenLM/Qwen-Agent](https://github.com/QwenLM/Qwen-Agent)
- **语言：** Python
- **类型：** 单 Agent

基于通义千问（Qwen）模型的 Agent 框架，支持函数调用、MCP、代码解释器、RAG。内置助手和浏览器助手等现成 Agent，适配国产模型生态。

**核心特性：**
- Qwen 模型原生优化
- 函数调用 + MCP 支持
- 代码解释器
- RAG 检索增强

---

### 4. Rasa

- **开源方：** Rasa Technologies
- **GitHub：** [https://github.com/RasaHQ/rasa](https://github.com/RasaHQ/rasa) (⭐ 21.1k)
- **官网：** [https://rasa.com/](https://rasa.com/)
- **语言：** Python
- **类型：** 企业级

2016年诞生的对话式 AI 框架，比 GPT-3 还早7年。专注企业级对话 Agent，支持本地化部署，适合有数据隐私和合规要求的场景。

**核心特性：**
- 企业级对话管理
- 本地化/私有部署
- NLU 自然语言理解
- 多语言支持

---

### 5. Haystack

- **开源方：** deepset
- **GitHub：** [https://github.com/deepset-ai/haystack](https://github.com/deepset-ai/haystack) (⭐ 24.7k)
- **官网：** [https://haystack.deepset.ai/](https://haystack.deepset.ai/)
- **语言：** Python
- **类型：** 企业级

deepset 打造的管道式 NLP/搜索框架，2019年推出。以有向无环图（DAG）方式思考，在 RAG 和搜索领域表现突出。适合需要生产级检索和搜索的应用。

**核心特性：**
- 管道式组件架构
- 强大的 RAG 与搜索
- 生产级可靠性
- 文档检索优化

---

### 6. PocketFlow

- **开源方：** 社区开源
- **GitHub：** [https://github.com/pocketflow-ai/pocketflow](https://github.com/pocketflow-ai/pocketflow) (⭐ 11k)
- **官网：** [https://pocketflow.ai/](https://pocketflow.ai/)
- **语言：** Python
- **类型：** 轻量级

仅 100 行 Python 的超轻量框架，捕获 LLM 应用的核心图抽象。用最少的代码构建 Agent、工作流和 RAG，无冗余依赖。

**核心特性：**
- ~100 行核心代码
- 图抽象核心
- 零冗余依赖
- 快速原型

---

### 7. Eino

- **开源方：** 字节跳动 CloudWeGo
- **GitHub：** [https://github.com/cloudwego/eino](https://github.com/cloudwego/eino) (⭐ 12.4k)
- **官网：** [https://www.cloudwego.io/zh/docs/eino/](https://www.cloudwego.io/zh/docs/eino/)
- **语言：** Go
- **类型：** 单 Agent

字节跳动开源的 Go 语言 LLM 应用框架，提供可复用组件、图式组合和内置流式处理。适合 Go 技术栈构建 Agent 应用。

**核心特性：**
- Go 原生框架
- 图式组件组合
- 内置流式处理
- 高并发优势

---

## 框架对比速查表

| 框架 | 语言 | 类型 | 核心优势 | GitHub Stars | 开源方 |
|---|---|---|---|---|---|
| LangChain | Python/JS | 通用 | 最大生态，模块化 | 117k | 社区 |
| LangGraph | Python/TS | 通用 | 图结构状态管理 | 37.6k | LangChain |
| OpenAI Agents SDK | Python/TS | 多Agent | Handoff 交接机制 | 20.5k | OpenAI |
| Claude Agent SDK | Python/TS | 通用 | 内置工具，Claude 深度优化 | 3.1k | Anthropic |
| Vercel AI SDK | TypeScript | 通用 | 前端 UI 集成最强 | 20M+月下载 | Vercel |
| LlamaIndex | Python/TS | 通用 | RAG 与数据检索最强 | 40.9k | 社区 |
| Agno | Python | 通用 | 极简高性能（5μs实例化） | 41.2k | 社区 |
| Pydantic AI | Python | 通用 | 类型安全，结构化输出 | 18.6k | Pydantic |
| Mastra | TypeScript | 多Agent | 原生 TS，全栈内置 | 26.3k | Gatsby团队 |
| AutoGen | Python | 多Agent | 对话式多 Agent 协作 | 50.6k | Microsoft |
| CrewAI | Python | 多Agent | 角色驱动，最低学习曲线 | 39.2k | CrewAI Inc. |
| MetaGPT | Python | 多Agent | 虚拟软件公司 | 45.6k | 国内开源 |
| ChatDev | Python | 多Agent | 聊天链软件开发模拟 | 28k | 清华OpenBMB |
| CAMEL | Python | 多Agent | 角色扮演式交互研究 | 12k | CAMEL-AI |
| AgentScope | Python | 多Agent | 分布式多 Agent 部署 | 8k+ | 阿里巴巴 |
| Swarms | Python | 多Agent | 蜂群式编排 | 3k+ | 社区 |
| Microsoft Agent Framework | Python/.NET | 多Agent | 融合 AutoGen+SK | 12.2k | Microsoft |
| Google ADK | Python/Go/Java | 多Agent | A2A 协议，Gemini 原生 | 20.6k | Google |
| Semantic Kernel | C#/Python/Java | 企业级 | .NET 生态，Azure 集成 | 28.3k | Microsoft |
| AWS Bedrock Agents | 托管 | 企业级 | 全托管无服务器 | — | Amazon |
| AutoGPT | Python | 自主Agent | 自主任务循环 | 183k | 社区 |
| BabyAGI | Python | 自主Agent | 极简任务驱动 | 22.2k | 社区 |
| SuperAGI | Python | 自主Agent | 企业级 Agent 管理平台 | 17.6k | 社区 |
| OpenHands | Python | 自主Agent | AI 软件工程师 | 44.2k | All-Hands-AI |
| Dify | Python | 低代码 | 可视化编排+RAG+LLMOps | 100k+ | Dify.AI |
| Langflow | Python | 低代码 | 拖拽式 LangChain 可视化 | 44k+ | DataStax |
| Flowise | TypeScript | 低代码 | 拖拽式多 Agent 构建 | 30k | FlowiseAI |
| n8n | TypeScript | 低代码 | 400+集成，工作流自动化 | 160k+ | n8n GmbH |
| Botpress | TypeScript | 低代码 | 对话式 AI 平台 | 14.8k | Botpress |
| Letta (MemGPT) | Python/TS | 记忆型 | OS 级长期记忆管理 | 15.9k | Letta AI |
| DSPy | Python | 研究型 | 自动 Prompt 编译优化 | 33.4k | Stanford NLP |
| SmolAgents | Python | 轻量级 | Code Agent，~1000行 | 28.4k | Hugging Face |
| GPT Researcher | Python | 研究Agent | 自主网络研究报告 | 28.4k | 社区 |
| Qwen-Agent | Python | 单Agent | Qwen 模型原生优化 | 16.8k | 阿里Qwen |
| Rasa | Python | 企业级 | 企业级对话管理 | 21.1k | Rasa |
| Haystack | Python | 企业级 | 管道式 RAG 与搜索 | 24.7k | deepset |
| PocketFlow | Python | 轻量级 | ~100行超轻量 | 11k | 社区 |
| Eino | Go | 单Agent | Go 原生 LLM 框架 | 12.4k | 字节跳动 |

---

> **备注：** GitHub Stars 为近似值，请以仓库实时数据为准。数据截至 2026年7月。
