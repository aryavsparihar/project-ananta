import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { CircuitRule } from '@/components/Marks';
import styles from './page.module.css';
import { EVENT, ROUNDS, REGISTRATION } from '@/content/event';

export const metadata: Metadata = {
  title: 'The journey',
  description: `The four marked rounds of ${EVENT.name}, from ideation on 6 November to the live demo on 4 December, with the build window in between.`,
  alternates: { canonical: '/journey' },
};

const TOTAL_MARKS = ROUNDS.reduce((sum, r) => sum + (r.marks ?? 0), 0);

export default function Journey() {
  return (
    <>
      <PageHead
        label="The journey"
        title={
          <>
            From first sketch
            <br />
            to <em>live URL.</em>
          </>
        }
        lead="Four marked rounds and one build window, read the way you would read the history of the thing you are making."
      />

      {/*
        The build log. It is the event's own git-audit rule turned into the
        page's structure — but every entry still says the date, the round
        number and the marks in plain words, so it reads as a timeline whether
        or not you have ever run `git log`.
      */}
      <section className="section" aria-labelledby="log-title">
        <div className="shell">
          <div className={styles.logHead}>
            <h2 id="log-title" className={styles.logTitle}>
              The build log
            </h2>
            <p className={styles.logKey}>
              <code className={styles.sample}>a1d3f09</code> is a commit hash — the short
              id git gives every saved change. Each round below is one entry in the
              project&rsquo;s history.
            </p>
          </div>

          <ol className={styles.entries}>
            {ROUNDS.map((round) => {
              const isWindow = round.marks === null;
              return (
                <li
                  key={round.id}
                  className={`${styles.entry} ${isWindow ? styles.windowEntry : ''}`}
                >
                  <span className={styles.node} aria-hidden="true" />

                  <div className={styles.line}>
                    <code className={styles.hash}>{round.hash}</code>
                    <span className={styles.date}>{round.dateLabel}</span>
                    {!isWindow && <span className={styles.round}>Round {round.n}</span>}
                    {round.onCampus && <span className={styles.campus}>On campus</span>}
                    {isWindow ? (
                      <span className={styles.noMarks}>no submission</span>
                    ) : (
                      <span className={styles.tag}>tag: {round.marks} marks</span>
                    )}
                  </div>

                  <h3 className={styles.name}>{round.name}</h3>
                  <p className={styles.summary}>{round.summary}</p>

                  {round.criteria.length > 0 && (
                    <>
                      <p className={`meta ${styles.criteriaLabel}`}>Marked on</p>
                      <ul className={styles.criteria}>
                        {round.criteria.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <p className={styles.deliverable}>
                    <span className="meta">Deliverable</span> {round.deliverable}
                  </p>
                </li>
              );
            })}

            <li className={`${styles.entry} ${styles.headEntry}`}>
              <span className={styles.node} aria-hidden="true" />
              <div className={styles.line}>
                <code className={styles.hash}>HEAD</code>
                <span className={styles.date}>4 Dec</span>
              </div>
              <h3 className={styles.name}>Your product, live.</h3>
              <p className={styles.summary}>
                Still online after the event, still in your history, still yours.
              </p>
            </li>
          </ol>

          <p className={styles.total}>
            {TOTAL_MARKS} marks across four rounds · Rounds 3 and 4 are on campus
          </p>
        </div>
      </section>

      <div className="shell">
        <CircuitRule flip />
      </div>

      <section className="section" aria-labelledby="before-title">
        <div className="shell">
          <h2 id="before-title" className={styles.beforeTitle}>
            Before any of that
          </h2>
          <ol className={styles.pre}>
            <li>
              <span className="meta">{REGISTRATION.displayRange}</span>
              <p>Registration is open.</p>
            </li>
            <li>
              <span className="meta">By {REGISTRATION.teamsAnnouncedBy}</span>
              <p>Teams are announced.</p>
            </li>
          </ol>
          <p className={styles.beforeNote}>
            Dates are set by the organisers and may be updated. Submission times for each
            round are confirmed closer to the date.
          </p>
          <p>
            <Link href="/register" className="link">
              How to register
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
