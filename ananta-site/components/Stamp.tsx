'use client';

import { useEffect, useRef } from 'react';
import styles from './Stamp.module.css';
import { EVENT } from '@/content/event';

const RING_TEXT = 'ONE LIVE PRODUCT · SIX WEEKS · ALL YEARS ·';

/**
 * The viewBox is 1:1 with the default rendered size, so the ring text can be
 * a real 12px rather than a fraction of a unit that only looks right once the
 * viewBox has been scaled up.
 */
const BOX = 150;
const C = BOX / 2;

const RING_RADIUS = 60;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** Circle path for the textPath, drawn clockwise from the left. */
const ring = (r: number) =>
  `M ${C} ${C} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`;

type Props = {
  /** Rendered width. The SVG viewBox is {BOX}x{BOX}. */
  size?: number;
  className?: string;
};

/**
 * The poster's rubber stamp: अनन्त inside a ring of set text.
 *
 * Turns slowly with the scroll position. The listener is passive, writes one
 * custom property and does nothing else, and is never attached at all when the
 * visitor prefers reduced motion — the stamp then simply sits still, which is
 * what a stamp does anyway.
 */
export function Stamp({ size = 150, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)');
    if (!motionOk.matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      // A third of a turn over a full page scroll. Slow on purpose.
      el.style.setProperty('--turn', `${window.scrollY * 0.04}deg`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={[styles.stamp, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true" focusable="false">
        <defs>
          <path id="stamp-ring" d={ring(RING_RADIUS)} fill="none" />
        </defs>

        <circle cx={C} cy={C} r={71} className={styles.outer} />
        <circle cx={C} cy={C} r={45} className={styles.inner} />

        <text className={styles.ringText}>
          {/* Stretched to the circumference so one pass closes the ring
              exactly, instead of repeating and overflowing. */}
          <textPath
            href="#stamp-ring"
            startOffset="0"
            textLength={RING_LENGTH}
            lengthAdjust="spacing"
          >
            {RING_TEXT}
          </textPath>
        </text>
      </svg>

      <span className={styles.deva} aria-hidden="true">
        {EVENT.devanagari}
      </span>

      {/* The stamp carries meaning, so it has a text equivalent. */}
      <span className="visually-hidden">
        {EVENT.devanagari}: one live product, six weeks, all years.
      </span>
    </div>
  );
}
