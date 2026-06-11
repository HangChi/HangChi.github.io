---
title: 'Markdown 写作语法速查'
description: '常用的 Markdown 排版元素演示，方便写作时参考。'
pubDate: 2026-06-10
tags: ['Markdown', '教程']
---

这篇文章演示常见的 Markdown 元素在本博客主题下的渲染效果。

## 文本样式

**粗体**、*斜体*、~~删除线~~、`行内代码`，以及[超链接](https://astro.build)。

## 列表

无序列表：

- 第一项
- 第二项
  - 嵌套项
- 第三项

有序列表：

1. 准备环境
2. 编写内容
3. 部署上线

## 引用

> 过早的优化是万恶之源。
> —— Donald Knuth

## 表格

| 功能     | 是否支持 | 备注           |
| -------- | -------- | -------------- |
| 深色模式 | ✅       | 跟随系统或手动 |
| 标签     | ✅       | 聚合页自动生成 |
| 评论     | ✅       | 需配置 Giscus  |

## 代码块

```ts
interface Post {
  title: string;
  pubDate: Date;
  tags: string[];
}

const post: Post = {
  title: '示例',
  pubDate: new Date(),
  tags: ['demo'],
};
```

## 分割线

---

以上就是常用语法，祝写作愉快！
