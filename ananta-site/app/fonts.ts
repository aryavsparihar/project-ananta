/**
 * Fonts, self-hosted by next/font at build time. No @import, no request to
 * fonts.googleapis.com at runtime, and `display: swap` with a matched
 * fallback so nothing reflows once the real face lands.
 *
 * All four are SIL Open Font License. See assets/CREDITS.md.
 */
import { Instrument_Serif, DM_Mono, Rozha_One } from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Display. The poster's wordmark is an ultra-condensed heavy grotesque.
 *
 * Self-hosted from a subset rather than next/font/google: the variable
 * Bricolage face ships its whole design space (opsz, wdth, wght) at 128 kB,
 * and we set exactly one instance of it — condensed, extra-bold. Subsetting
 * that instance to the characters the site actually uses gives 12 kB.
 * `npm run fonts` regenerates it from the vendored TTF.
 *
 * This is the only preloaded face. The wordmark is the page's LCP element, so
 * it gets the connection to itself; the serif, mono and Devanagari faces are
 * metric-matched to their fallbacks and swap in without shifting anything.
 *
 * The `font-stretch: 75%` declaration makes this face match the
 * `font-stretch: 75%` the stylesheets ask for.
 */
export const display = localFont({
  src: '../assets/fonts/BricolageGrotesque-Condensed-ExtraBold.woff2',
  weight: '800',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
  preload: true,
  declarations: [{ prop: 'font-stretch', value: '75%' }],
  /*
   * Next's built-in adjustment only knows Arial and Times metrics, and this
   * face is 71.8% of Arial's width — using Arial unadjusted reflowed the
   * wordmark on swap and cost 0.13 CLS. The matched fallbacks are declared by
   * hand in globals.css (DisplayFallbackNarrow / DisplayFallbackWide) with
   * size-adjust measured against the real face.
   */
  adjustFontFallback: false,
  fallback: ['DisplayFallbackNarrow', 'DisplayFallbackWide', 'sans-serif'],
});

/** Prose and pull lines, including the italic the poster uses for emphasis. */
export const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
  // next's generated fallback is Times New Roman only; the two metric-matched
  // faces after it cover Linux and Android. See globals.css.
  fallback: [
    'SerifFallbackTimes',
    'SerifFallbackNoto',
    'Georgia',
    'Times New Roman',
    'serif',
  ],
  adjustFontFallback: true,
  // See the note on `display` below: only the display face is preloaded.
  preload: false,
});

/** Labels, dates, metadata, captions, the build log. */
export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  adjustFontFallback: true,
  preload: false,
});

/** अनन्त only. */
export const devanagari = Rozha_One({
  subsets: ['devanagari', 'latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-deva',
  // Not preloaded: it sets one short mark, and preloading it competes for
  // bandwidth with the display face, which is the page's LCP element.
  preload: false,
});

export const fontClassNames = [
  display.variable,
  serif.variable,
  mono.variable,
  devanagari.variable,
].join(' ');
