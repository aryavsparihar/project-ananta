import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHead } from '@/components/PageHead';
import { Cutout } from '@/components/Cutout';
import { CircuitRule, Eyebrow, Strip } from '@/components/Marks';
import styles from './page.module.css';
import { EVENT } from '@/content/event';
import { CLUBS, RECORDS, SOURCES, type SourceId } from '@/content/glimpses';

export const metadata: Metadata = {
  title: 'Glimpses',
  description: `What SANGAM, DevGrowth, Code Club, NULL and the AI & ML Club have already run and won at SMVDU, before ${EVENT.name}.`,
  alternates: { canonical: '/glimpses' },
};

/** Sources are numbered in the order they first appear on the page. */
const ORDER: SourceId[] = [];
const cite = (id: SourceId) => {
  if (!ORDER.includes(id)) ORDER.push(id);
  return ORDER.indexOf(id) + 1;
};
RECORDS.forEach((r) => cite(r.source));
CLUBS.forEach((c) => c.events.forEach((e) => cite(e.source)));

/** Deterministic tilts, so the paste-up does not reshuffle on every build. */
const TILTS = [-1.8, 1.4, -2.4, 2.1, -1.2];

const CLUB_CLASS: Record<string, string> = {
  sangam: styles.sangam,
  devgrowth: styles.devgrowth,
  codeclub: styles.codeclub,
  null: styles.null,
  aiml: styles.aiml,
};

function Cite({ id }: { id: SourceId }) {
  const n = cite(id);
  return (
    <a href={`#source-${n}`} className={styles.cite}>
      <span className="visually-hidden">Source </span>
      {n}
    </a>
  );
}

export default function Glimpses() {
  return (
    <>
      <PageHead
        label="Glimpses"
        title={
          <>
            Before ANANTA,
            <br />
            <em>there was this.</em>
          </>
        }
        lead="Workshops, bootcamps, hackathons and wins from the five clubs behind the event. Every figure links to where it came from."
      />

      {/* ------------------------------------------------------ the record */}
      <section className="section" aria-labelledby="record-title">
        <div className="shell">
          <Eyebrow>On the record</Eyebrow>
          <h2 id="record-title" className={styles.recordTitle}>
            Numbers with <em>receipts.</em>
          </h2>

          <ul className={styles.records}>
            {RECORDS.map((r) => (
              <li key={r.line} className={`${styles.record} ${CLUB_CLASS[r.club]}`}>
                <p className={styles.figure}>{r.figure}</p>
                <p className={styles.recordLine}>{r.line}</p>
                <p className={styles.recordDetail}>
                  {r.detail} <Cite id={r.source} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="shell">
        <CircuitRule />
      </div>

      {/* --------------------------------------------------- club by club */}
      {CLUBS.map((club, ci) => (
        <section
          key={club.id}
          className={`section ${styles.club} ${CLUB_CLASS[club.id]} ${ci % 2 ? styles.flip : ''}`}
          aria-labelledby={`club-${club.id}`}
        >
          <div className="shell">
            <div className={styles.clubGrid}>
              <div className={styles.clubText}>
                <h2 id={`club-${club.id}`} className={styles.clubName}>
                  <Strip
                    tone="ink"
                    rotate={ci % 2 ? 1.4 : -1.4}
                    className={styles.clubStrip}
                  >
                    {club.name}
                  </Strip>
                </h2>
                <p className={styles.blurb}>{club.blurb}</p>

                <ul className={styles.events}>
                  {club.events.map((e) => (
                    <li key={e.name} className={styles.event}>
                      <span className={styles.eventName}>
                        {e.name} <Cite id={e.source} />
                      </span>
                      {(e.when || e.note) && (
                        <span className={styles.eventMeta}>
                          {e.when && <span className={styles.when}>{e.when}</span>}
                          {e.note && <span>{e.note}</span>}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.board}>
                {club.photos.map((slug, pi) => (
                  <Cutout
                    key={slug}
                    slug={slug}
                    sizes="(min-width: 64rem) 26vw, (min-width: 48rem) 40vw, 84vw"
                    rotate={TILTS[(ci + pi) % TILTS.length]}
                    tape={pi % 2 ? ['tr'] : ['tl', 'br']}
                    className={styles.pin}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* -------------------------------------------------------- sources */}
      <section className={`section ${styles.sources}`} aria-labelledby="sources-title">
        <div className="shell">
          <Eyebrow>Sources</Eyebrow>
          <h2 id="sources-title" className="visually-hidden">
            Sources
          </h2>
          <ol className={styles.sourceList}>
            {ORDER.map((id, i) => {
              const s = SOURCES[id];
              return (
                <li key={id} id={`source-${i + 1}`}>
                  {s.href ? (
                    <a
                      href={s.href}
                      className={styles.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.label}
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    s.label
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- the ask */}
      <section className={`section ${styles.ask} on-dark`} aria-labelledby="ask-title">
        <div className="shell">
          <h2 id="ask-title" className={styles.askTitle}>
            The next glimpse
            <br />
            <em>is yours.</em>
          </h2>
          <Link href="/register" className={styles.askCta}>
            Enter {EVENT.name}
          </Link>
        </div>
      </section>
    </>
  );
}
