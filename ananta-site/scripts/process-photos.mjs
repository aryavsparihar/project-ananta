/**
 * Turns the raw event photos in assets/photos into the poster's treated
 * cutouts in public/photos.
 *
 *   npm run photos              only what is missing or stale
 *   npm run photos -- --force   everything
 *
 * One lossless-ish WebP master per photo, duotoned and torn, alpha intact.
 * The smaller sizes next/image serves are cut from this master by
 * `npm run images` (scripts/build-image-sizes.mjs); run it after this.
 *
 * Also writes public/photos/manifest.json with real pixel dimensions, which
 * <Cutout> reads so next/image never guesses and nothing shifts while loading.
 */
import { mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { xerox } from './lib/xerox.mjs';
import { PHOTOS, MASTER_WIDTH } from './photo-manifest.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets', 'photos');
const OUT = join(ROOT, 'public', 'photos');
const force = process.argv.includes('--force');

const exists = (p) =>
  stat(p).then(
    () => true,
    () => false,
  );

async function newerThan(a, b) {
  const [sa, sb] = await Promise.all([
    stat(a).catch(() => null),
    stat(b).catch(() => null),
  ]);
  return !sa || !sb || sa.mtimeMs > sb.mtimeMs;
}

async function main() {
  if (!(await exists(SRC))) {
    console.error(`No source photos at ${SRC}`);
    process.exit(1);
  }

  const available = new Set(await readdir(SRC));
  await mkdir(OUT, { recursive: true });

  const manifest = {};
  let written = 0;
  let skipped = 0;

  for (const photo of PHOTOS) {
    const srcPath = join(SRC, photo.src);
    if (!available.has(photo.src)) {
      console.warn(`  skip ${photo.slug}: ${photo.src} not in assets/photos`);
      continue;
    }

    const buf = await readFile(srcPath);

    const out = join(OUT, `${photo.slug}.webp`);
    if (!force && !(await newerThan(srcPath, out))) {
      const { width: w, height: h } = await sharp(out).metadata();
      manifest[photo.slug] = { width: w, height: h, tone: photo.tone };
      skipped++;
      continue;
    }

    const {
      pipeline,
      width: w,
      height: h,
    } = await xerox(buf, {
      width: MASTER_WIDTH,
      slug: photo.slug,
      tone: photo.tone,
      aspect: photo.aspect,
      torn: true,
    });

    await pipeline.webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(out);
    manifest[photo.slug] = { width: w, height: h, tone: photo.tone };
    written++;
    console.log(`  ${photo.slug}  ${w}x${h}  ${photo.tone}`);
  }

  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nphotos: ${written} written, ${skipped} up to date`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
