import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EVENT } from '@/content/event';
import { presentedBy } from '@/lib/content-sections';
import { getSiteContent } from '@/lib/site-content';

export const alt = `${EVENT.name} · ${EVENT.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/*
 * The poster, at share size.
 *
 * The two faces are vendored under assets/fonts (both SIL OFL) rather than
 * fetched at build time, so this renders identically offline and in CI and
 * never depends on fonts.gstatic.com being reachable.
 */
async function font(file: string) {
  return readFile(join(process.cwd(), 'assets', 'fonts', file));
}

export default async function Image() {
  const { event, registration } = await getSiteContent();
  const [display, mono] = await Promise.all([
    font('BricolageGrotesque-Condensed-ExtraBold.ttf'),
    font('DMMono-Medium.ttf'),
  ]);

  const PAPER = '#F7F0E3';
  const INK = '#16181D';
  const SAFFRON = '#F07800';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: PAPER,
        color: INK,
        padding: '56px 64px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'mono',
          fontSize: 22,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#5A5751',
        }}
      >
        <span>{presentedBy(event)}</span>
        <span>A project hackathon · SMVDU</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: 'display',
            fontSize: 250,
            lineHeight: 0.82,
            letterSpacing: -10,
            textTransform: 'uppercase',
          }}
        >
          {event.name}
        </div>

        <div style={{ display: 'flex', marginTop: 20, gap: 14 }}>
          <span
            style={{
              fontFamily: 'display',
              fontSize: 54,
              background: INK,
              color: PAPER,
              padding: '4px 16px 10px',
              textTransform: 'uppercase',
            }}
          >
            Don&rsquo;t pitch it.
          </span>
          <span
            style={{
              fontFamily: 'display',
              fontSize: 54,
              background: SAFFRON,
              color: INK,
              padding: '4px 16px 10px',
              textTransform: 'uppercase',
            }}
          >
            Ship it.
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: `2px solid ${INK}`,
          paddingTop: 22,
          fontFamily: 'mono',
          fontSize: 24,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        <span>{event.displayRange}</span>
        <span style={{ color: '#5A5751' }}>
          Register by {registration.closesDisplayShort}
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'display', data: display, style: 'normal', weight: 800 },
        { name: 'mono', data: mono, style: 'normal', weight: 500 },
      ],
    },
  );
}
