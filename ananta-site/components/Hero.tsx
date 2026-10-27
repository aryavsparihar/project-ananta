import Link from 'next/link';
import styles from './Hero.module.css';
import { Cutout } from './Cutout';
import { Stamp } from './Stamp';
import { Strip } from './Marks';
import type { SiteContent } from '@/lib/content-sections';

/** "2026-10-23" -> "23.10", the poster's date style. */
const dotted = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

/**
 * The poster, pasted up.
 *
 * On load the wordmark, the cutouts and the strips drop in and settle, in the
 * order someone would actually stick them to a wall. The whole sequence is
 * under 1.2s and lives entirely in CSS, inside a
 * `prefers-reduced-motion: no-preference` block — so when motion is not wanted
 * the page simply renders finished, with no JS deciding anything.
 */
export function Hero({
  event,
  registration,
  prizes,
}: {
  event: SiteContent['event'];
  registration: SiteContent['registration'];
  prizes: SiteContent['prizes'];
}) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.head}>
        <p className={styles.presents}>
          <em>SANGAM presents</em>
        </p>
        <p className="meta">A project hackathon · SMVDU</p>
      </div>

      <h1 id="hero-title" className={styles.wordmark}>
        <span className={styles.wordmarkText}>{event.name}</span>
        <span className="visually-hidden">
          {' '}
          , {event.devanagari}, {event.meaning}. {event.tagline}
        </span>
      </h1>

      <div className={styles.collage}>
        <Cutout
          slug="sangam-launch"
          sizes="(min-width: 64rem) 46vw, (min-width: 48rem) 60vw, 88vw"
          rotate={-1.5}
          tape={['tl', 'br']}
          priority
          showCaption={false}
          className={`${styles.photo} ${styles.photoMain}`}
        />
        <Cutout
          slug="battle-code"
          sizes="(min-width: 64rem) 26vw, (min-width: 48rem) 36vw, 54vw"
          rotate={2.5}
          tape={['tr']}
          showCaption={false}
          className={`${styles.photo} ${styles.photoLeft}`}
        />
        <Cutout
          slug="sangam-launch-stage"
          sizes="(min-width: 64rem) 20vw, (min-width: 48rem) 28vw, 42vw"
          rotate={-2.5}
          tape={['bl']}
          showCaption={false}
          className={`${styles.photo} ${styles.photoRight}`}
        />

        {/* Wrapper owns the placement; Stamp owns its own internals. Putting
            both classes on one element would make their rules collide. */}
        <div className={styles.stamp}>
          <Stamp size={150} />
        </div>

        <p className={styles.strips}>
          <Strip tone="ink" rotate={-2.2}>
            Don&rsquo;t pitch it.
          </Strip>
          <Strip tone="saffron" rotate={1.6} className={styles.stripShip}>
            Ship it.
          </Strip>
        </p>
      </div>

      <div className={styles.foot}>
        <p className={styles.dates}>
          <span>{dotted(event.starts)}</span>
          <svg
            className={styles.arrow}
            viewBox="0 0 64 16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M0 8 H56 M48 1 L62 8 L48 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
          </svg>
          <span>{dotted(event.ends)}</span>
        </p>

        <p className={styles.summary}>
          Six weeks. All four years. <em>One live product</em> per team.{' '}
          {prizes.poolLabel} in prizes. Finals on campus.
        </p>

        <div className={styles.actions}>
          <Link href="/register" className={styles.cta}>
            Enter ANANTA
          </Link>
          <p className={styles.deadline}>
            <span className="meta">Register by</span>
            <Strip tone="saffron" rotate={-1.4} className={styles.deadlineDate}>
              {registration.closesDisplayShort}
            </Strip>
          </p>
        </div>
      </div>
    </section>
  );
}
