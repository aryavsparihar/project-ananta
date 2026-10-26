import Link from 'next/link';
import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { Cutout } from '@/components/Cutout';
import { Strip, CircuitRule, Eyebrow } from '@/components/Marks';
import styles from './page.module.css';
import { EVENT, ROUNDS, PRIZES, REGISTRATION } from '@/content/event';

export const metadata: Metadata = {
  title: `${EVENT.name} · ${EVENT.tagline}`,
  description: `${EVENT.blurb} ${EVENT.displayRange}, ${EVENT.school}. Registration ${REGISTRATION.displayRange}.`,
  alternates: { canonical: '/' },
};

export default function Home() {
  return (
    <>
      <Hero />

      {/* ---------------------------------------------------- the point */}
      <section className="section" aria-labelledby="point-title">
        <div className="shell">
          <Eyebrow>Why six weeks</Eyebrow>

          <div className={styles.pointGrid}>
            <h2 id="point-title" className={styles.pointTitle}>
              Twenty-four hours
              <br />
              makes a demo.
              <br />
              <em>Six weeks makes a product.</em>
            </h2>

            <div className={`prose ${styles.pointBody}`}>
              <p>
                {EVENT.name} is built around the part that usually gets skipped:
                finishing. Pick a real problem, plan the system, design the experience,
                build it, deploy it, and stand behind what you made.
              </p>
              <p>
                The finish line is not a slide deck. It is a live product, a documented
                repository and a team that can explain every decision in it.
              </p>
              <p>
                <Link href="/about" className="link">
                  Why {EVENT.name} exists
                </Link>
              </p>
            </div>
          </div>

          <dl className={styles.facts}>
            <div className={styles.fact}>
              <dt className="meta">Weeks</dt>
              <dd>06</dd>
            </div>
            <div className={styles.fact}>
              <dt className="meta">Marked rounds</dt>
              <dd>04</dd>
            </div>
            <div className={styles.fact}>
              <dt className="meta">Live product per team</dt>
              <dd>01</dd>
            </div>
            <div className={styles.fact}>
              <dt className="meta">Prize pool</dt>
              <dd>{PRIZES.poolLabel}</dd>
            </div>
          </dl>

          <p className={styles.factNote}>
            {PRIZES.places.map((p) => `${p.place} ${p.amount}`).join(' · ')}
          </p>
        </div>
      </section>

      <div className="shell">
        <CircuitRule />
      </div>

      {/* --------------------------------------------------- the route */}
      <section className="section" aria-labelledby="route-title">
        <div className="shell">
          <div className={styles.routeHead}>
            <h2 id="route-title">
              Every round moves
              <br />
              the build <em>forward.</em>
            </h2>
            <Link href="/journey" className="link">
              The full build log
            </Link>
          </div>

          <ol className={styles.rounds}>
            {ROUNDS.map((round) => (
              <li
                key={round.id}
                className={`${styles.round} ${round.marks === null ? styles.window : ''}`}
              >
                <span className={styles.roundNo} aria-hidden="true">
                  {round.n}
                </span>
                <div className={styles.roundBody}>
                  <h3 className={styles.roundName}>{round.name}</h3>
                  <p className={styles.roundSummary}>{round.summary}</p>
                </div>
                <p className={styles.roundMeta}>
                  <span className="meta">{round.dateLabel}</span>
                  {round.onCampus && <span className={styles.campus}>On campus</span>}
                </p>
                <p className={styles.roundMarks}>
                  {round.marks === null ? (
                    <span className="meta">No submission</span>
                  ) : (
                    <>
                      <span className={styles.marksNum}>{round.marks}</span>
                      <span className="meta"> marks</span>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------ what came before */}
      <section className="section" aria-labelledby="before-title">
        <div className="shell">
          <Eyebrow>What came before</Eyebrow>
          <h2 id="before-title" className={styles.beforeTitle}>
            The rooms were <em>already full.</em>
          </h2>

          <div className={styles.gallery}>
            <Cutout
              slug="ai-stack"
              sizes="(min-width: 64rem) 30vw, (min-width: 48rem) 44vw, 84vw"
              rotate={-1.8}
              tape={['tl']}
              showTag
              className={styles.gal1}
            />
            <Cutout
              slug="pyverse-group"
              sizes="(min-width: 64rem) 34vw, (min-width: 48rem) 48vw, 84vw"
              rotate={1.4}
              tape={['tr', 'bl']}
              showTag
              className={styles.gal2}
            />
            <Cutout
              slug="sih-team"
              sizes="(min-width: 64rem) 26vw, (min-width: 48rem) 40vw, 72vw"
              rotate={-2.6}
              tape={['br']}
              showTag
              className={styles.gal3}
            />
            <Cutout
              slug="ekatva"
              sizes="(min-width: 64rem) 28vw, (min-width: 48rem) 44vw, 78vw"
              rotate={2.2}
              tape={['tl', 'br']}
              showTag
              className={styles.gal4}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ the ask */}
      <section className={`section ${styles.ask} on-dark`} aria-labelledby="ask-title">
        <div className="shell">
          <p className="meta">The build starts here</p>
          <h2 id="ask-title" className={styles.askTitle}>
            Make something
            <br />
            <em>worth shipping.</em>
          </h2>

          <p className={styles.askLine}>
            Registration closes {REGISTRATION.closesDisplay}. Teams announced by{' '}
            {REGISTRATION.teamsAnnouncedBy}.
          </p>

          <div className={styles.askActions}>
            <Link href="/register" className={styles.askCta}>
              Registration details
            </Link>
            <Strip tone="saffron" rotate={-1.5} className={styles.askStrip}>
              {REGISTRATION.displayRange}
            </Strip>
          </div>
        </div>
      </section>
    </>
  );
}
