// LeetCode 笔记增量迁移脚本
// 作用：只迁移源目录有但博客还没有的文章
// 排除：000 笔记模板.md、000 笔记模板(两种解法).md
//
// 运行：node scripts/migrate-leetcode-incremental.mjs

import fs from 'node:fs';
import path from 'node:path';

// ===== 路径配置 =====
const SRC = 'E:/GitHub/Note/01 学习笔记/LeetCode算法学习';
const ASSETS_SRC = path.join(SRC, 'assets');
const OUT_MD = 'src/content/blog/leetcode';
const OUT_IMG = 'public/leetcode/assets';
const IMG_URL_BASE = '/leetcode/assets';

// 要排除的文件（源文件名）
const EXCLUDE = new Set([
  '000 笔记模板.md',
  '000 笔记模板(两种解法).md',
]);

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

// 从源文件名提取题目编号（用于匹配图片）
function extractProblemNumber(fileName) {
  const m = fileName.match(/^(\d+)/);
  return m ? m[1] : null;
}

function convert(file) {
  const srcPath = path.join(SRC, file);
  const raw = fs.readFileSync(srcPath, 'utf8');
  const mtime = fs.statSync(srcPath).mtime;
  const lines = raw.split(/\r?\n/);

  // 1) 提取标题
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

  // 2) 提取末尾标签行
  let tags = [];
  let tagLineIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === '') continue;
    const line = lines[i].trim();
    if (/^(#[^\s#]+)(\s+#[^\s#]+)*$/.test(line)) {
      tags = (line.match(/#([^\s#]+)/g) || []).map((t) => t.slice(1));
      tagLineIdx = i;
    }
    break;
  }
  if (!tags.includes('LeetCode')) tags.unshift('LeetCode');

  // 3) 生成 description：标题行后的第一段有意义正文
  let description = '';
  for (let i = titleIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (t.startsWith('#')) continue;
    if (t.startsWith('![')) continue;
    if (t.startsWith('```')) break;
    const cleaned = t.replace(/[*_`>$~]/g, '').trim();
    if (cleaned.length < 8) continue;
    // 截断到合适长度
    description = cleaned.length > 100 ? cleaned.slice(0, 100) + '...' : cleaned;
    break;
  }
  if (!description) description = `${title} —— LeetCode 题解`;

  // 4) 处理正文：删除标题行和标签行，转换图片路径
  const body = lines
    .filter((_, i) => i !== titleIdx && i !== tagLineIdx)
    .join('\n')
    .replace(/\]\(\.?\/?assets\//g, `](${IMG_URL_BASE}/`)
    // 处理 URL 编码的空格（源文件中可能有 %20）
    .replace(/%20/g, ' ')
    .replace(/^\n+/, '');

  // 5) 拼装 frontmatter
  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `description: ${yamlStr(description)}`,
    `pubDate: ${formatDate(mtime)}`,
    `category: ${yamlStr('leetcode')}`,
    `tags: [${tags.map(yamlStr).join(', ')}]`,
    '---',
    '',
  ].join('\n');

  // 6) 输出文件名：去空格
  const outName = path.basename(file, '.md').replace(/\s+/g, '') + '.md';
  fs.writeFileSync(path.join(OUT_MD, outName), fm + body, 'utf8');
  return { outName, probNum: extractProblemNumber(file) };
}

// 查找与某篇文章相关的所有图片
function findRelatedImages(fileBaseName, probNum) {
  if (!fs.existsSync(ASSETS_SRC)) return [];
  
  const allImages = fs.readdirSync(ASSETS_SRC).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif';
  });

  const matched = [];
  // 不带扩展名的源文件名（去掉空格）
  const baseNoExt = fileBaseName.replace(/\s+/g, '');

  for (const img of allImages) {
    const imgNoExt = path.basename(img, path.extname(img)).replace(/\s+/g, '');
    
    // 精确匹配：图片名去掉空格后 == 源文件名去掉空格
    if (imgNoExt === baseNoExt) {
      matched.push(img);
      continue;
    }

    // 题目号匹配（需要精确避免 23 误匹配 230 的问题）
    if (probNum) {
      // 补零后精确名称匹配（如 023.xxx 匹配 23.xxx 的文章）
      const zeroPaddedBase = probNum.padStart(3, '0') + baseNoExt.slice(probNum.length);
      if (imgNoExt === zeroPaddedBase) {
        matched.push(img);
        continue;
      }

      // 前缀匹配：图片名以 "23." 或 "023." 开头（不匹配 "230."、"123." 等）
      const variants = [probNum, probNum.padStart(3, '0'), probNum.padStart(4, '0')];
      for (const v of variants) {
        // 必须以 v 开头，且 v 后面紧跟 . 或空格（不是另一个数字）
        const afterPrefix = imgNoExt.slice(v.length);
        if (imgNoExt.startsWith(v) && /^[.\s]/.test(afterPrefix)) {
          matched.push(img);
          break;
        }
        // 也允许纯数字匹配（如只有数字的图片名）
        if (imgNoExt === v) {
          matched.push(img);
          break;
        }
      }
    }
  }

  return [...new Set(matched)];
}

// ===== 主流程 =====
function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`源目录不存在：${SRC}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_MD, { recursive: true });
  fs.mkdirSync(OUT_IMG, { recursive: true });

  // 读取博客中已存在的文章（去空格后的文件名集合）
  const existingBlogFiles = new Set();
  if (fs.existsSync(OUT_MD)) {
    for (const f of fs.readdirSync(OUT_MD)) {
      if (f.toLowerCase().endsWith('.md')) {
        existingBlogFiles.add(f);
      }
    }
  }

  // 读取源目录所有 md 文件
  const srcFiles = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.md'));

  // 筛选需要迁移的文件
  const toMigrate = [];
  const skippedExisting = [];
  const skippedExcluded = [];

  for (const f of srcFiles) {
    // 检查排除列表
    if (EXCLUDE.has(f)) {
      skippedExcluded.push(f);
      continue;
    }

    // 检查博客中是否已存在（去空格比较）
    const blogFileName = f.replace(/\s+/g, '');
    if (existingBlogFiles.has(blogFileName)) {
      skippedExisting.push(f);
      continue;
    }

    toMigrate.push(f);
  }

  console.log('=== LeetCode 增量迁移 ===\n');
  console.log(`源目录文章总数：${srcFiles.length}`);
  console.log(`博客已有文章数：${existingBlogFiles.size}`);
  console.log(`被排除的文章：${skippedExcluded.length} 篇`);
  console.log(`已存在（跳过）：${skippedExisting.length} 篇`);
  console.log(`需要迁移：${toMigrate.length} 篇\n`);

  if (toMigrate.length === 0) {
    console.log('没有需要迁移的文章，博客已是最新。');
    return;
  }

  // 转换文章
  let ok = 0;
  const failed = [];
  const allImgToCopy = new Set();

  for (const f of toMigrate) {
    try {
      const { outName, probNum } = convert(f);
      
      // 查找关联图片
      const fileBaseName = path.basename(f, '.md');
      const relatedImgs = findRelatedImages(fileBaseName, probNum);
      relatedImgs.forEach(img => allImgToCopy.add(img));

      console.log(`  OK  ${f}  →  ${outName}  (${relatedImgs.length} 张图片)`);
      ok++;
    } catch (e) {
      failed.push(`${f}: ${e.message}`);
      console.error(`  FAIL  ${f}: ${e.message}`);
    }
  }

  // 复制图片
  let imgCopied = 0;
  const imgSkipped = [];
  for (const img of allImgToCopy) {
    const srcImg = path.join(ASSETS_SRC, img);
    const dstImg = path.join(OUT_IMG, img);
    
    if (!fs.existsSync(srcImg)) {
      imgSkipped.push(`${img} (源文件不存在)`);
      continue;
    }

    // 如果目标已存在则跳过
    if (fs.existsSync(dstImg)) {
      imgSkipped.push(`${img} (已存在)`);
      continue;
    }

    fs.copyFileSync(srcImg, dstImg);
    imgCopied++;
  }

  // 汇总
  console.log(`\n=== 迁移完成 ===`);
  console.log(`文章：${ok}/${toMigrate.length} 篇 → ${OUT_MD}`);
  console.log(`图片：${imgCopied} 张新复制，${imgSkipped.length} 张已存在/跳过 → ${OUT_IMG}`);
  
  if (imgSkipped.length > 0) {
    console.log(`\n跳过的图片：`);
    imgSkipped.forEach(m => console.log(`  - ${m}`));
  }
  
  if (failed.length) {
    console.log(`\n转换失败：`);
    failed.forEach((m) => console.log(`  - ${m}`));
  }

  console.log(`\n跳过（已存在于博客）：`);
  skippedExisting.forEach(f => console.log(`  - ${f}`));
}

main();
