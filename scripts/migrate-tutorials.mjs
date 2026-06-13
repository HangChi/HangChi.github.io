// 部署教程迁移脚本
// 作用：把语雀/Typora 导出的部署教程笔记转换成 Astro 博客文章。
// 与 LeetCode 脚本的区别：
//   - 图片是网络外链（CDN），无需复制本地图片
//   - 需剥离语雀的 <font style="color:..."> 标签（深色模式下会看不见文字）
//   - 标题用「文件名」（有些文件是多教程合集，正文有多个 H1）
//
// 只读源目录，绝不修改源文件。
// 运行：node scripts/migrate-tutorials.mjs

import fs from 'node:fs';
import path from 'node:path';

// ===== 路径配置 =====
const SRC = 'E:/GitHub/Note/04 部署教程';
const OUT_MD = 'src/content/blog/tutorials';
const UNIFIED_TAG = '部署教程';

// ===== 工具函数 =====
function yamlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 剥离语雀导出的内联 HTML（主要是带固定颜色的 <font>，深色模式下不可见）
function stripHtml(text) {
  return text
    .replace(/<\/?font[^>]*>/gi, '') // <font style="color:...">…</font>
    .replace(/<br\s*\/?>/gi, '\n'); // 换行标签
}

function convert(file) {
  const srcPath = path.join(SRC, file);
  const raw = fs.readFileSync(srcPath, 'utf8');
  const mtime = fs.statSync(srcPath).mtime;

  // 保护：若源文件已带 frontmatter，跳过以免叠加
  if (raw.trimStart().startsWith('---')) {
    return { skipped: true, reason: '源文件已有 frontmatter' };
  }

  const lines = raw.split(/\r?\n/);

  // 统计「代码块外」的 H1（避免把代码块里的 # 注释误当标题）
  const h1Indices = [];
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i].trim())) {
      inCode = !inCode;
      continue;
    }
    if (!inCode && /^#\s+\S/.test(lines[i])) h1Indices.push(i);
  }

  // 标题用文件名（教程文件名即主题，且合集文件有多个 H1）
  const baseName = path.basename(file, '.md');
  const title = baseName;

  // 仅当全文只有 1 个 H1 且在开头时，删除它（避免与 title 重复）；
  // 多 H1（合集）则全部保留，它们是真实章节结构。
  let removeIdx = -1;
  if (h1Indices.length === 1 && h1Indices[0] < 5) removeIdx = h1Indices[0];

  // description：第一段正文文字（跳过标题/代码/图片/HTML 行）
  let description = '';
  let inCode2 = false;
  for (let i = 0; i < lines.length; i++) {
    if (i === removeIdx) continue;
    const t = lines[i].trim();
    if (/^```/.test(t)) {
      inCode2 = !inCode2;
      continue;
    }
    if (inCode2 || !t) continue;
    if (t.startsWith('#') || t.startsWith('![') || t.startsWith('<')) continue;
    const cleaned = stripHtml(t).replace(/[*_`>$~]/g, '').trim();
    if (cleaned.length < 8) continue;
    description = cleaned.slice(0, 70);
    break;
  }
  if (!description) description = `${title}`;

  // 正文：删重复 H1、剥离 HTML
  let body = lines
    .filter((_, i) => i !== removeIdx)
    .join('\n');
  body = stripHtml(body).replace(/^\n+/, '');

  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `description: ${yamlStr(description)}`,
    `pubDate: ${formatDate(mtime)}`,
    `category: ${yamlStr('tutorials')}`,
    `tags: [${yamlStr(UNIFIED_TAG)}]`,
    '---',
    '',
  ].join('\n');

  const outName = baseName.replace(/\s+/g, '') + '.md';
  fs.writeFileSync(path.join(OUT_MD, outName), fm + body, 'utf8');
  return { outName };
}

// ===== 主流程 =====
function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`✗ 源目录不存在：${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_MD, { recursive: true });

  const files = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.md'));
  let ok = 0;
  const skipped = [];
  const failed = [];
  for (const f of files) {
    try {
      const r = convert(f);
      if (r.skipped) skipped.push(`${f}（${r.reason}）`);
      else ok++;
    } catch (e) {
      failed.push(`${f}: ${e.message}`);
    }
  }

  console.log(`\n✅ 教程迁移完成`);
  console.log(`   文章：${ok}/${files.length} 篇 → ${OUT_MD}`);
  console.log(`   图片：外链 CDN，无需复制`);
  if (skipped.length) {
    console.log(`\n↪ 跳过 ${skipped.length} 篇：`);
    skipped.forEach((m) => console.log(`   - ${m}`));
  }
  if (failed.length) {
    console.log(`\n⚠️ ${failed.length} 篇失败：`);
    failed.forEach((m) => console.log(`   - ${m}`));
  }
}

main();
