import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { Countdown } from '@/components/Countdown';
import { Cutout } from '@/components/Cutout';
import { Strip } from '@/components/Marks';
import styles from './page.module.css';
import { EVENT, REGISTRATION, REGISTRATION_URL, TEAM_RULES } from '@/content/event';

export const metadata: Metadata = {
  title: 'Register',
  description: `Registration for ${EVENT.name} is open ${REGISTRATION.displayRange} 2026. Teams are announced by ${REGISTRATION.teamsAnnouncedBy}.`,
  alternates: { canonical: '/register' },
};

const CHECKLIST = [
  'Six weeks of building, not one weekend',
  'A team that meets the year and inclusion requirements',
  'Original work, committed as you go from your own account',
  'A deployed product with a public URL by the final',
];

export default function Register() {
  return (
    <>
      <PageHead
        label="Registration"
        title={
          <>
            Got a problem
            <br />
            worth <em>solving?</em>
          </>
        }
        lead="Bring the curiosity and the commitment. The next six weeks are for building."
      />

      <section className={`section ${styles.main}`} aria-labelledby="window-title">
        <div className="shell">
          <div className={styles.grid}>
            <div className={styles.action}>
              <h2 id="window-title" className={styles.windowTitle}>
                Registration closes in
              </h2>

              <Countdown
                deadline={REGISTRATION.closesAt}
                label={`Closes ${REGISTRATION.closesDisplayFull}`}
                closedLabel="Registration has closed."
              />

              <p className={styles.dates}>
                <Strip tone="saffron" rotate={-1.5}>
                  {REGISTRATION.displayRange}
                </Strip>
              </p>

              <a
                className={styles.cta}
                href={REGISTRATION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the registration form
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>

              <p className={styles.announce}>
                Teams are announced by {REGISTRATION.teamsAnnouncedBy}.
              </p>
            </div>

            <div className={styles.before}>
              <h2 className={styles.beforeTitle}>Before you enter</h2>
              <ul className={styles.checklist}>
                {CHECKLIST.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p className={`meta ${styles.teamLabel}`}>Your team needs</p>
              <p className={styles.team}>{TEAM_RULES[0].body}</p>
              <p className={styles.team}>{TEAM_RULES[1].body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`section ${styles.closing}`} aria-labelledby="closing-title">
        <div className="shell">
          <div className={styles.closingGrid}>
            <div>
              <h2 id="closing-title" className={styles.closingTitle}>
                You have done the hard part before.
              </h2>
              <p className={styles.closingBody}>
                Every one of these rooms was full of people who had not shipped anything
                yet either.
              </p>
              <p className={styles.fineprint}>
                Make sure what you submit is accurate. Organisers may update operational
                details as the event runs.
              </p>
            </div>

            <Cutout
              slug="sangam-launch"
              sizes="(min-width: 64rem) 34vw, (min-width: 48rem) 46vw, 84vw"
              rotate={1.8}
              tape={['tl', 'br']}
              showTag
              className={styles.closingPhoto}
            />
          </div>
        </div>
      </section>
    </>
  );
}
