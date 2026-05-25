import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '../public/icons');

const sizes = [
  { name: 'icon-192.png', svg: 'icon-192.svg', size: 192 },
  { name: 'icon-512.png', svg: 'icon-512.svg', size: 512 },
  { name: 'icon-180.png', svg: 'icon-192.svg', size: 180 },
];

async function main() {
  mkdirSync(iconsDir, { recursive: true });

  for (const { name, svg, size } of sizes) {
    const svgPath = resolve(iconsDir, svg);
    const pngPath = resolve(iconsDir, name);
    const svgContent = readFileSync(svgPath, 'utf-8');

    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(pngPath);

    console.log(`Generated ${name} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
