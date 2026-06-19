# 博客发布后台

这是一个只在本机运行的个人后台，用来把 Markdown 笔记发布到博客。

## 启动

```bash
npm run admin
```

然后打开：

```text
http://127.0.0.1:8787
```

如果 `8787` 被系统占用或拒绝，后台会自动切换到一个随机本地端口。实际地址以终端输出的 `Blog admin is running at ...` 为准。

如果端口被占用，可以换端口：

```bash
npm run admin -- --port=8790
```

## 使用流程

1. 拖入 `.md` 或 `.mdx` 文件，或者直接粘贴 Markdown 正文。
2. 检查标题、摘要、发布日期、分类、标签和保存目录。
3. 选择操作：
   - `只保存文件`：只写入 `src/content/blog`。
   - `保存并构建`：写入后执行 `npm run build`。
   - `发布到博客`：写入后执行 `npm run build`、`git add`、`git commit`、`git push`。

推送成功后，GitHub Actions 会自动部署到 GitHub Pages。

## 注意

- 后台只监听 `127.0.0.1`，默认不会暴露到公网。
- 如果导入的 Markdown 已有 frontmatter，后台会读取常用字段，但保存时会重新生成 frontmatter。
- `发布到博客` 会提交并推送当前文章文件；执行前建议确认工作区里没有同名文件的未保存修改。
