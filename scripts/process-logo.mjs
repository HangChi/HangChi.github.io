// 处理 logo：去白底（白→透明）+ 裁掉周围空白 + 缩放压缩。
// 处理 public/logo.png 并覆盖输出（原图在别处仍有备份）。
// 运行：node scripts/process-logo.mjs

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('✗ 缺少 sharp 库，请先运行：npm install sharp');
  process.exit(1);
}

const SRC = 'public/logo.png';
const SIZE = 256; // 输出尺寸（favicon/页头都够用，retina 清晰）
const WHITE = 240; // RGB 都 ≥ 此值视为白色背景，变透明

// 1) 读为原始 RGBA 像素
const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// 2) 把接近白色的像素设为透明（城堡内的白色 A 是负空间，
//    透明后会自动跟随页面背景色，深浅模式都自然）
let cleared = 0;
for (let i = 0; i < data.length; i += info.channels) {
  if (data[i] >= WHITE && data[i + 1] >= WHITE && data[i + 2] >= WHITE) {
    data[i + 3] = 0;
    cleared++;
  }
}

// 3) 从像素重建为带透明的 PNG
const transparent = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: info.channels },
})
  .png()
  .toBuffer();

// 4) 裁掉周围透明边 → 缩放到正方形画布 → 压缩
const before = (await sharp(SRC).metadata());
await sharp(transparent)
  .trim() // 去掉城堡周围的大片空白，让 logo 填满
  .resize(SIZE, SIZE, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/logo.png');

const after = await sharp('public/logo.png').metadata();
console.log('✅ logo 处理完成');
console.log(`   去白底像素：${cleared}`);
console.log(`   尺寸：${before.width}×${before.height} → ${after.width}×${after.height}`);
console.log(`   输出：public/logo.png（透明背景）`);
