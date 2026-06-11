import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  // Content Layer API：从 src/content/blog 目录加载 md/mdx 文件。
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // 用 coerce 把 frontmatter 里的日期字符串转成 Date 对象。
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    // 标签系统：可选的字符串数组，缺省为空。
    tags: z.array(z.string()).default([]),
    // 草稿标记：为 true 时不在列表/RSS 中展示。
    draft: z.boolean().default(false),
    // 置顶：为 true 时在首页和文章列表中排到最前。
    pinned: z.boolean().default(false),
  }),
});

export const collections = { blog };
