// 站点级常量：在多个页面与组件间共享。
// 用户名等占位符请按需替换。

export const SITE_TITLE = '我的技术博客';
export const SITE_DESCRIPTION = '记录技术学习、踩坑与思考的个人博客。';

// 作者信息（用于页脚、RSS 等）。可改成你的真实名字或昵称。
export const AUTHOR = 'HangChi';

// 每页文章数（列表分页用）
export const POSTS_PER_PAGE = 10;

// ===== Giscus 评论配置 =====
// 获取方式：见 SETUP.md 第 4 节。简言之：
//   1. 仓库开启 Discussions + 安装 giscus app
//   2. 打开 https://giscus.app ，仓库填 HangChi/HangChi.github.io
//   3. 把页面生成的 data-repo-id 和 data-category-id 填到下面
// 只要 repoId 仍是 'REPLACE_WITH_REPO_ID'，评论区会显示「未配置」提示，不影响其他功能。
export const GISCUS = {
  repo: 'HangChi/HangChi.github.io',
  repoId: 'REPLACE_WITH_REPO_ID',
  // 分类名与下面的 categoryId 必须对应同一个分类。
  // 推荐用 Announcements（只有你能发起讨论，访客只能回复）。
  category: 'Announcements',
  categoryId: 'REPLACE_WITH_CATEGORY_ID',
} as const;
