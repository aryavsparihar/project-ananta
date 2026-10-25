import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/event';

/** Every public page. /admin is excluded deliberately — it is not for visitors. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', priority: 1 },
    { path: '/about', priority: 0.8 },
    { path: '/journey', priority: 0.8 },
    { path: '/glimpses', priority: 0.7 },
    { path: '/rules', priority: 0.7 },
    { path: '/register', priority: 0.9 },
    { path: '/team', priority: 0.6 },
  ];

  const lastModified = new Date();

  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority,
  }));
}
