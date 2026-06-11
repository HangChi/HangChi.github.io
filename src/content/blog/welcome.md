---
title: '欢迎来到我的博客'
description: '第一篇文章：介绍这个博客的功能与技术栈。'
pubDate: 2026-06-11
tags: ['公告', 'Astro']
---

这是用 **Astro** 搭建的个人技术博客的第一篇文章 🎉。

## 这个博客有什么

- ✅ **Markdown / MDX** 写作，代码自动语法高亮
- ✅ **深色模式**：点右上角按钮切换，刷新不闪烁
- ✅ **标签分类**：文章可打标签，点击查看同类
- ✅ **RSS 订阅**：`/rss.xml`
- ✅ **评论系统**：基于 GitHub Discussions 的 Giscus
- ✅ **中文排版优化**：思源黑体、舒适行高

## 代码高亮示例

```js
function greet(name) {
  console.log(`你好, ${name}!`);
}
greet('世界');
```

```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

## 接下来

把 `src/content/blog/` 下的示例文章删掉，写你自己的第一篇吧！

> 提示：frontmatter 里把 `draft: true` 就能存为草稿，不会出现在列表和 RSS 中。
