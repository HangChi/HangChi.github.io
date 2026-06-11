// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // 用户主页站：site 直接是根地址，不需要 base。
  site: 'https://HangChi.github.io',
  integrations: [mdx(), sitemap()],
  markdown: {
    // 关闭 SmartyPants：避免把中文直角引号、破折号错误转换成英文花引号。
    // 注：Astro 6 默认 smartypants=true，故此处必须显式 false（删掉会破坏中文标点）。
    // 构建时会有一行 deprecated 黄色提示，可安全忽略——官方称未来大版本才移除，届时再迁移到 processor API。
    smartypants: false,
    shikiConfig: {
      // 双主题：浅色用 github-light，深色用 github-dark。
      // 配合 html.dark 的 CSS 在前端切换（见 src/styles/global.css）。
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
