---
title: 'LightRAG部署与使用'
description: '修改对应文件examples/lightragollamademo.py：'
pubDate: 2025-04-14
tags: ['部署教程']
---
## 一、安装
### 从源码安装 （推荐）
```python
cd LightRAG

pip install -e .
```

### 从 PyPI 安装
```python
pip install lightrag-hku
```

## 二、使用
### 调用 Ollama 本地模型
修改对应文件`examples/lightrag_ollama_demo.py`：

![](/tutorials/assets/1742656639737-4b74fbc1-cbc3-488d-bc58-aa537d1703fb.png)

主要修改`llm_model_name`、`embed_model`、`host`即可。

### 调用 OpenAI 兼容模型
修改对应文件`examples/lightrag_openai_compatible_demo.py`：

![](/tutorials/assets/1742656889157-cad52bd8-39a7-4a62-add2-d08d65c67086.png)

主要修改`model`、`OPENAI_API_KEY`、`base_url`即可，`lightrag_openai_compatible_demo.py`也可以调用 ollama 本地模型，亲测可用。

### Neo4j 可视化
修改对应文件`examples/graph_visual_with_neo4j.py`：

![](/tutorials/assets/1742657127162-8f87876d-76dc-49e3-9435-1823db905575.png)

修改对应的`NEO4J_URI`、`NEO4J_USERNAME`、`NEO4J_PASSWORD` 即可成功运行！



注：

1. qwen 模型构建后没有实体和关系

