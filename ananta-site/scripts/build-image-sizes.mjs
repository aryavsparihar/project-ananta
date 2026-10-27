/**
 * Pre-built responsive sizes for every image next/image serves.
 *
 *   npm run images          write what is missing or stale
 *   npm run images -- --check   fail if anything is missing (runs before build)
 *
 * The site no longer uses Vercel's on-demand optimizer (/_next/image). Every
 * cache miss there cost a second or more, and the free plan caps how many
 * transformations it will do before images start failing. Instead each size is
 * a plain static file on the CDN, picked by lib/image-loader.ts:
 *
 *   public/photos/<slug>.webp  ->  <slug>-480.webp, <slug>-828.webp
 *                                   (the 1200px master is the largest size)
 *   public/logos/<name>.png    ->  <name>-64.webp, -128.webp, -256.webp
 *
 * Keep the widths in step with lib/image-loader.ts and next.config.ts.
 */
import { readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

const SETS = [
  {
    dir: join(ROOT, 'public', 'photos'),
    // Masters only: some slugs end in a year ("imc-2024"), so exclude the
    // generated widths by name rather than any trailing number.
    match: /^(?!.*-(?:480|828)\.webp$)(.+)\.webp$/,
    widths: [480, 828],
    // Torn edges live in the alpha channel; keep them clean.
    encode: (img) => img.webp({ quality: 78, alphaQuality: 90, effort: 6 }),
  },
  {
    dir: join(ROOT, 'public', 'logos'),
    match: /^(.+)\.png$/,
    widths: [64, 128, 256],
    encode: (img) => img.webp({ quality: 90, alphaQuality: 100, effort: 6 }),
  },
];

const mtime = (p) =>
  stat(p).then(
    (s) => s.mtimeMs,
    () => null,
  );

let written = 0;
const missing = [];

for (const set of SETS) {
  for (const file of (await readdir(set.dir)).sort()) {
    const m = file.match(set.match);
    if (!m) continue;
    const src = join(set.dir, file);
    const srcTime = await mtime(src);

    for (const width of set.widths) {
      const out = join(set.dir, `${m[1]}-${width}.webp`);
      const outTime = await mtime(out);
      if (outTime !== null && (checkOnly || outTime >= srcTime)) continue;
      if (checkOnly) {
        missing.push(out.slice(ROOT.length + 1));
        continue;
      }
      await set
        .encode(sharp(src).resize({ width, withoutEnlargement: true }))
        .toFile(out);
      written++;
      console.log(`  ${out.slice(ROOT.length + 1)}`);
    }
  }
}

if (checkOnly) {
  if (missing.length) {
    console.error(
      `\n  Missing image sizes (run: npm run images):\n${missing.map((f) => `    ${f}`).join('\n')}\n`,
    );
    process.exit(1);
  }
  console.log('image sizes present');
} else {
  console.log(`images: ${written} written`);
}
