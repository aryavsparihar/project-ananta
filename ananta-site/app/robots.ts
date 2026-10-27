import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/event';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Behind auth, so a crawler would only ever see a sign-in redirect.
      disallow: [
        '/admin',
        '/admin/',
        '/account',
        '/register/form',
        '/contest',
        '/problems',
        '/auth/',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
