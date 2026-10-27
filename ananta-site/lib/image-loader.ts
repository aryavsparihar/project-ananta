'use client';

/**
 * next/image loader that picks a pre-built static size instead of calling the
 * on-demand optimizer. The sizes are written by scripts/build-image-sizes.mjs;
 * the widths here, in that script and in next.config.ts must agree.
 */
const PHOTO_WIDTHS = [480, 828];
const PHOTO_MASTER = 1200;
const LOGO_WIDTHS = [64, 128, 256];

export default function imageLoader({ src, width }: { src: string; width: number }) {
  const photo = src.match(/^\/photos\/(.+)\.webp$/);
  if (photo) {
    const w = PHOTO_WIDTHS.find((candidate) => candidate >= width);
    // The master is the largest size; the query only tells next/image that
    // this loader did honour the width.
    return w ? `/photos/${photo[1]}-${w}.webp` : `${src}?w=${PHOTO_MASTER}`;
  }

  const logo = src.match(/^\/logos\/(.+)\.png$/);
  if (logo) {
    const w = LOGO_WIDTHS.find((candidate) => candidate >= width) ?? LOGO_WIDTHS.at(-1);
    return `/logos/${logo[1]}-${w}.webp`;
  }

  return src;
}
