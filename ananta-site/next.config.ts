import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The Open Graph image reads its bundled font files via fs.readFile at
  // runtime. Explicitly trace them into the Vercel function bundle so social
  // previews do not depend on files being present in the build working tree.
  outputFileTracingIncludes: {
    '/opengraph-image': ['./assets/fonts/*.ttf'],
  },
  images: {
    // Static pre-built sizes (scripts/build-image-sizes.mjs), never the
    // on-demand optimizer. These lists are the widths that exist on disk.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    deviceSizes: [480, 828, 1200],
    imageSizes: [64, 128, 256],
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Not hashed, so not immutable: a replaced photo shows up within a day.
        source: '/:dir(photos|team|logos|textures)/:file*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
