import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { fontClassNames } from './fonts';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { ImageRetry } from '@/components/ImageRetry';
import { SITE_URL } from '@/content/event';
import { presentedBy } from '@/lib/content-sections';
import { getSiteContent } from '@/lib/site-content';

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await getSiteContent();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${event.name} · ${event.tagline}`,
      template: `%s · ${event.name}`,
    },
    description: `${event.blurb} ${event.displayRange}, ${event.school}.`,
    applicationName: event.name,
    keywords: [
      'ANANTA',
      'hackathon',
      'SMVDU',
      'SANGAM',
      'DevGrowth',
      'Code Club',
      'School of CSE',
      'Katra',
    ],
    authors: [{ name: presentedBy(event) }],
    openGraph: {
      type: 'website',
      siteName: event.name,
      locale: 'en_IN',
      url: SITE_URL,
      title: `${event.name} · ${event.tagline}`,
      description: `${event.blurb} ${event.displayRange}.`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.name} · ${event.tagline}`,
      description: event.blurb,
    },
    alternates: { canonical: '/' },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#f7f0e3',
  colorScheme: 'light',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { event, contact, announcement } = await getSiteContent();

  return (
    <html lang="en-IN" className={fontClassNames}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <AnnouncementBar announcement={announcement} />
        <SiteNav />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter event={event} contact={contact} />
        <ImageRetry />
        <Analytics />
      </body>
    </html>
  );
}
