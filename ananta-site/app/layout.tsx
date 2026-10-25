import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontClassNames } from './fonts';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { EVENT, PRESENTED_BY, SITE_URL } from '@/content/event';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${EVENT.name} · ${EVENT.tagline}`,
    template: `%s · ${EVENT.name}`,
  },
  description: `${EVENT.blurb} ${EVENT.displayRange}, ${EVENT.school}.`,
  applicationName: EVENT.name,
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
  authors: [{ name: PRESENTED_BY }],
  openGraph: {
    type: 'website',
    siteName: EVENT.name,
    locale: 'en_IN',
    url: SITE_URL,
    title: `${EVENT.name} · ${EVENT.tagline}`,
    description: `${EVENT.blurb} ${EVENT.displayRange}.`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${EVENT.name} · ${EVENT.tagline}`,
    description: EVENT.blurb,
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#f7f0e3',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={fontClassNames}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteNav />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
