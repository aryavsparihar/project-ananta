import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PageHead } from '@/components/PageHead';
import { Countdown } from '@/components/Countdown';
import { Cutout } from '@/components/Cutout';
import { Strip } from '@/components/Marks';
import styles from './page.module.css';
import { getSiteContent } from '@/lib/site-content';

export async function generateMetadata(): Promise<Metadata> {
  const { event, registration } = await getSiteContent();
  return {
    title: 'Register',
    description: `Registration for ${event.name} is open ${registration.displayRange} ${event.year}. Teams are announced by ${registration.teamsAnnouncedBy}.`,
    alternates: { canonical: '/register' },
  };
}

const CHECKLIST = [
  'Six weeks of building, not one weekend',
  'You register on your own. The organisers form the teams.',
  'Original work, committed as you go from your own account',
  'A deployed product with a public URL by the final',
];

const FORM = '/register/form';

export default async function Register() {
  const { registration, team_rules: teamRules, portal, contact } = await getSiteContent();

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

      <section className="section" aria-labelledby="window-title">
        <div className="shell">
          <div className={styles.grid}>
            <div>
              <h2 id="window-title" className={styles.windowTitle}>
                Registration closes in
              </h2>

              <Countdown
                deadline={registration.closesAt}
                label={`Closes ${registration.closesDisplayFull}`}
                closedLabel="Registration has closed."
              />

              <p className={styles.dates}>
                <Strip tone="saffron" rotate={-1.5}>
                  {registration.displayRange}
                </Strip>
              </p>

              <div className={styles.ctaRow}>
                <Link
                  className={styles.cta}
                  href={`/signup?next=${encodeURIComponent(FORM)}`}
                >
                  Create your account
                </Link>
                <Link className="link" href={`/login?next=${encodeURIComponent(FORM)}`}>
                  Already registered? Sign in
                </Link>
              </div>

              <p className={styles.announce}>
                Sign up with your university email, confirm it, then fill the form. You
                can edit your entry until it closes. Teams are announced by{' '}
                {registration.teamsAnnouncedBy}.
              </p>

              {portal.showGoogleForm && (
                <div className={styles.fallback}>
                  <p className={styles.fallbackText}>
                    Site form not working for you? Use the{' '}
                    <a
                      href={portal.googleFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Form
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>{' '}
                    instead. Use one or the other, not both.
                  </p>

                  {/* For a laptop or a projected slide: scan it with a phone. Hidden
    on phones, where the link above is the way in. */}
                  <figure className={styles.qr}>
                    <Image
                      src="/register-qr.svg"
                      width={164}
                      height={164}
                      alt=""
                      unoptimized
                      className={styles.qrCode}
                    />
                    <figcaption className={`meta ${styles.qrCaption}`}>
                      Google Form
                      <span className={styles.qrBy}>
                        by {registration.closesDisplayShort}
                      </span>
                    </figcaption>
                  </figure>
                </div>
              )}

              <p className={styles.contact}>
                Questions: <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
            </div>

            <div className={styles.before}>
              <h2 className={styles.beforeTitle}>Before you enter</h2>
              <ul className={styles.checklist}>
                {CHECKLIST.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <p className={`meta ${styles.teamLabel}`}>Every team has</p>
              <p className={styles.team}>{teamRules[0].body}</p>
              <p className={styles.team}>{teamRules[1].body}</p>
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
