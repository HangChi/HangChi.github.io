// LeetCode 笔记迁移脚本
// 作用：把 Obsidian/Typora 格式的题解笔记转换成 Astro 博客文章。
// 只读源目录，绝不修改源文件；输出到博客的 content/public 目录。
//
// 运行：node scripts/migrate-leetcode.mjs
// 重复运行安全：会覆盖上次生成的结果（源更新后可再次同步）。

import fs from 'node:fs';
import path from 'node:path';

// ===== 路径配置（按需修改 SRC）=====
const SRC = 'E:/GitHub/Note/01 学习笔记/LeetCode算法学习';
const ASSETS_SRC = path.join(SRC, 'assets');
const OUT_MD = 'src/content/blog/leetcode'; // 文章输出目录
const OUT_IMG = 'public/leetcode/assets'; // 图片输出目录
const IMG_URL_BASE = '/leetcode/assets'; // 文章里引用图片的 URL 前缀

// ===== 工具函数 =====

// YAML 字符串：单引号包裹并转义内部单引号，安全处理冒号/井号等特殊字符
function yamlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

// Date → YYYY-MM-DD
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 转换单个 md 文件，返回 { outName }
function convert(file) {
  const srcPath = path.join(SRC, file);
  const raw = fs.readFileSync(srcPath, 'utf8');
  const mtime = fs.statSync(srcPath).mtime;
  const lines = raw.split(/\r?\n/);

  // 1) 提取标题：第一行形如 "# 1 两数之和" 的 H1
  let title = '';
  let titleIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+?)\s*$/);
    if (m) {
      title = m[1].trim();
      titleIdx = i;
      break;
    }
  }
  if (!title) title = path.basename(file, '.md');

  // 2) 提取末尾标签行：最后一个非空行若整行都是 "#标签 #标签" 形式
  let tags = [];
  let tagLineIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '') continue;
    const line = lines[i].trim();
    if (/^(#[^\s#]+)(\s+#[^\s#]+)*$/.test(line)) {
      tags = (line.match(/#([^\s#]+)/g) || []).map((t) => t.slice(1));
      tagLineIdx = i;
    }
    break; // 只检查最后一个非空行
  }
  // 统一加 LeetCode 标签，置于首位
  if (!tags.includes('LeetCode')) tags.unshift('LeetCode');

  // 3) 生成 description：题目后的第一段正文（去 markdown 标记，截断）
  let description = '';
  for (let i = titleIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (t.startsWith('#')) continue; // 跳过小标题
    if (t.startsWith('![')) continue; // 跳过图片
    if (t.startsWith('```')) break; // 遇代码块停止
    const cleaned = t.replace(/[*_`>$~]/g, '').trim();
    if (cleaned.length < 8) continue; // 太短（如“例题：”），继续找
    description = cleaned.slice(0, 70);
    break;
  }
  if (!description) description = `${title} —— LeetCode 题解`;

  // 4) 处理正文：删掉标题行与标签行，转换图片路径
  const body = lines
    .filter((_, i) => i !== titleIdx && i !== tagLineIdx)
    .join('\n')
    .replace(/\]\(\.?\/?assets\//g, `](${IMG_URL_BASE}/`) // assets/ 与 ./assets/
    .replace(/^\n+/, ''); // 去开头多余空行

  // 5) 拼装 frontmatter
  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `description: ${yamlStr(description)}`,
    `pubDate: ${formatDate(mtime)}`,
    `tags: [${tags.map(yamlStr).join(', ')}]`,
    '---',
    '',
  ].join('\n');

  // 6) 输出文件名：去掉空格，避免 URL 出现 %20
  const outName = path.basename(file, '.md').replace(/\s+/g, '') + '.md';
  fs.writeFileSync(path.join(OUT_MD, outName), fm + body, 'utf8');
  return outName;
}

// ===== 主流程 =====
function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`✗ 源目录不存在：${SRC}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_MD, { recursive: true });
  fs.mkdirSync(OUT_IMG, { recursive: true });

  // 转换所有 md
  const files = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.md'));
  let ok = 0;
  const failed = [];
  for (const f of files) {
    try {
      convert(f);
      ok++;
    } catch (e) {
      failed.push(`${f}: ${e.message}`);
    }
  }

  // 复制图片（二进制安全复制）
  let imgCount = 0;
  if (fs.existsSync(ASSETS_SRC)) {
    for (const img of fs.readdirSync(ASSETS_SRC)) {
      const s = path.join(ASSETS_SRC, img);
      if (fs.statSync(s).isFile()) {
        fs.copyFileSync(s, path.join(OUT_IMG, img));
        imgCount++;
      }
    }
  }

  console.log(`\n✅ 迁移完成`);
  console.log(`   文章：${ok}/${files.length} 篇 → ${OUT_MD}`);
  console.log(`   图片：${imgCount} 张 → ${OUT_IMG}`);
  if (failed.length) {
    console.log(`\n⚠️ ${failed.length} 篇转换失败：`);
    failed.forEach((m) => console.log(`   - ${m}`));
  }
}

main();
