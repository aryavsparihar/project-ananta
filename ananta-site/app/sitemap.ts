import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/event';

/**
 * Every public page. /admin and the signed-in pages (/account, /register/form,
 * /contest, /problems) are left out: a crawler would only reach the sign-in.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '', priority: 1 },
    { path: '/about', priority: 0.8 },
    { path: '/journey', priority: 0.8 },
    { path: '/glimpses', priority: 0.7 },
    { path: '/rules', priority: 0.7 },
    { path: '/register', priority: 0.9 },
    ...(process.env.NEXT_PUBLIC_SHOW_TEAM_PAGE === 'true'
      ? [{ path: '/team', priority: 0.6 }]
      : []),
    { path: '/signup', priority: 0.6 },
  ];

  const lastModified = new Date();

  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority,
  }));
}
