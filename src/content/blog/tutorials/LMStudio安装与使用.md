---
title: 'LM Studio安装与使用'
description: 'LM Studio 是一款本地运行大模型(LLM)的 GUI 程序'
pubDate: 2025-04-13
tags: ['部署教程']
---
## 一、介绍
LM Studio 是一款本地运行大模型(LLM)的 GUI 程序

**主要功能**

+ 用于运行本地大语言模型 (LLM) 的桌面应用程序
+ 熟悉的聊天界面
+ 搜索和下载功能（通过 Hugging Face 🤗）
+ 可以监听类似 OpenAI 端点的本地服务器
+ 管理本地模型和配置的系统

## 安装
1. 访问 [LM Studio](https://lmstudio.ai/) 的官网直接下载对应的版本

![](/tutorials/assets/1735365710297-4032c938-5dd6-428b-8bec-88076e39b0d8.png)

2. 下载后双击会自动安装，打开应用，看到聊天、控制台、我的模型、搜索列表。

![](/tutorials/assets/1735365772770-288587c0-73b9-4497-bf44-905187bdf910.png)

## 三、使用
1. 挑选模型进行下载

![](/tutorials/assets/1735365874423-89ad96fd-3b4f-4aba-8b0c-3af67787638f.png)

2. 下载完成后选择对应的模型进行聊天，右下角会显示资源占用情况

![](/tutorials/assets/1735365940995-dc5b507b-2ff3-4d99-9bd8-2a5d18a711e5.png)

3. 控制台可以一键部署模型，其他应用可以通过 API 进行调用本地模型

![](/tutorials/assets/1735366026005-0fea845f-a6d6-4740-b311-872cd7d99cde.png)

## 四、网络问题
所有的模型都在 HuggingFace 上，由于众所周知的网络问题， `huggingface.co` 无法访问。这也导致了模型无法下载，并且 LM Studio **不支持 HTTP_PROXY**。

### 解决方法
HuggingFace 国内有一个镜像站， https://hf-mirror.com/，我们可以使用这个网站来下载模型。

1. 找到安装文件夹下的 main 文件夹，我的目录如下：`C:\Users\XXX\AppData\Local\LM-Studio\app-0.3.5\resources\app\.webpack\main`
2. 通过 VS Code 打开 main 文件夹，注意是整个 main 文件夹
3. 全局替换(VS Code 查找方式如下)：  
**文件查找**：按下Ctrl + F，在编辑器中打开**查找**框，输入要**查找**的内容，即可在当前**文件**中**查找**。  
**查找文件夹**下**所有文件**中是否包含某个关键字：按下Ctrl + Shift + F  
查找并替换全部即可(共 22 处)

```plain
被替换字符：huggingface.co

需替换字符：hf-mirror.com
```

4. 关闭并重启LM Studio

