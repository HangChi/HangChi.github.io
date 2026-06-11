// 下载教程里的外链图片到本地，并替换 md 中的 URL。
// 解决语雀等图床防盗链导致的裂图问题：
//   浏览器从 github.io 访问时 Referer 被拒；
//   而本脚本用「语雀自身的 Referer」服务端下载，可绕过防盗链拿到图片。
//
// 前提：已跑过 migrate-tutorials.mjs（tutorials 目录已生成）。
// 运行：node scripts/download-tutorial-images.mjs
// 可重复运行：已本地化的图不会重复下载，只重试上次失败的。

import fs from 'node:fs';
import path from 'node:path';

const TUT_DIR = 'src/content/blog/tutorials';
const OUT_IMG = 'public/tutorials/assets';
const IMG_URL_BASE = '/tutorials/assets';

// 从 URL 推导本地文件名
function localName(url) {
  const clean = url.split('?')[0].split('#')[0];
  let base = clean.substring(clean.lastIndexOf('/') + 1);
  try {
    base = decodeURIComponent(base);
  } catch {}
  base = base.replace(/[^\w.\-]/g, '_'); // 清理特殊字符
  if (!/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(base)) base += '.png';
  return base;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: {
      // 关键：伪装成语雀自身来源，绕过防盗链
      Referer: 'https://www.yuque.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('空文件');
  fs.writeFileSync(dest, buf);
}

async function main() {
  if (!fs.existsSync(TUT_DIR)) {
    console.error(`✗ 目录不存在：${TUT_DIR}（请先跑 migrate-tutorials.mjs）`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_IMG, { recursive: true });

  const mdFiles = fs.readdirSync(TUT_DIR).filter((f) => f.endsWith('.md'));

  // 1) 收集所有 md 里的外链图片 URL
  const urlRe = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
  const urlSet = new Set();
  const contents = new Map();
  for (const f of mdFiles) {
    const c = fs.readFileSync(path.join(TUT_DIR, f), 'utf8');
    contents.set(f, c);
    let m;
    while ((m = urlRe.exec(c))) urlSet.add(m[1]);
  }
  const urls = [...urlSet];

  if (urls.length === 0) {
    console.log('没有发现外链图片（可能已全部本地化）。');
    return;
  }
  console.log(`发现 ${urls.length} 张外链图片，开始下载…\n`);

  // 2) 下载（串行，带进度）
  const map = new Map(); // url -> 本地路径
  const used = new Set();
  const failed = [];
  let i = 0;
  for (const url of urls) {
    i++;
    let name = localName(url);
    while (used.has(name)) {
      const dot = name.lastIndexOf('.');
      name = `${name.slice(0, dot)}_${i}${name.slice(dot)}`;
    }
    used.add(name);
    try {
      await download(url, path.join(OUT_IMG, name));
      map.set(url, `${IMG_URL_BASE}/${name}`);
      console.log(`  [${i}/${urls.length}] ✓ ${name}`);
    } catch (e) {
      failed.push({ url, err: e.message });
      console.log(`  [${i}/${urls.length}] ✗ ${e.message}  ${url}`);
    }
  }

  // 3) 替换 md 里成功下载的 URL 为本地路径
  let replaced = 0;
  for (const [f, c] of contents) {
    let out = c;
    for (const [url, local] of map) out = out.split(url).join(local);
    if (out !== c) {
      fs.writeFileSync(path.join(TUT_DIR, f), out, 'utf8');
      replaced++;
    }
  }

  console.log(`\n✅ 完成`);
  console.log(`   下载成功：${map.size}/${urls.length} 张 → ${OUT_IMG}`);
  console.log(`   更新文章：${replaced} 篇`);
  if (failed.length) {
    console.log(`\n⚠️ ${failed.length} 张失败（md 里仍保留原外链，可重跑重试）：`);
    failed.forEach((x) => console.log(`   - [${x.err}] ${x.url}`));
  }
}

main();
