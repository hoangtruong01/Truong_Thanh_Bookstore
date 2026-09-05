import { readdir, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const assetDir = new URL('../src/assets/', import.meta.url);
const files = (await readdir(assetDir))
  .filter((name) => ['.png', '.jpg', '.jpeg'].includes(extname(name).toLowerCase()));

let originalBytes = 0;
let optimizedBytes = 0;
for (const file of files) {
  const source = new URL(file, assetDir);
  const base = file.slice(0, -extname(file).length);
  const webp = new URL(`${base}.webp`, assetDir);
  const avif = new URL(`${base}.avif`, assetDir);
  originalBytes += (await stat(source)).size;

  await sharp(fileURLToPath(source))
    .rotate()
    .webp({ quality: 78, effort: 5 })
    .toFile(fileURLToPath(webp));
  await sharp(fileURLToPath(source))
    .rotate()
    .avif({ quality: 55, effort: 5 })
    .toFile(fileURLToPath(avif));
  optimizedBytes += (await stat(webp)).size + (await stat(avif)).size;
}

console.log(
  `Optimized ${files.length} images (${Math.round(originalBytes / 1024)} KiB source; ` +
    `${Math.round(optimizedBytes / 1024)} KiB for both WebP and AVIF variants).`,
);
