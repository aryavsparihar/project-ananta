import Link from 'next/link';
import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { Cutout } from '@/components/Cutout';
import { Strip } from '@/components/Marks';
import styles from './page.module.css';
import { getSiteContent } from '@/lib/site-content';

export async function generateMetadata(): Promise<Metadata> {
  const { event } = await getSiteContent();
  return {
    title: 'Rules',
    description: `Who is on an ${event.name} team, what counts as original work, and what has to be deployed by the final.`,
    alternates: { canonical: '/rules' },
  };
}

export default async function Rules() {
  const { team_rules: teamRules, prizes } = await getSiteContent();

  return (
    <>
      <PageHead
        label="Rules of the build"
        title={
          <>
            Make it yours.
            <br />
            <em>Make it work.</em>
          </>
        }
        lead="Five ground rules, so the work and the people doing it get a fair shot."
      />

      <section className="section" aria-labelledby="rules-title">
        <div className="shell">
          <h2 id="rules-title" className="visually-hidden">
            The rules
          </h2>

          <ol className={styles.list}>
            {teamRules.map((rule) => (
              <li key={rule.n} className={styles.rule}>
                <span className={styles.n} aria-hidden="true">
                  {rule.n}
                </span>
                <div>
                  <h3 className={styles.name}>{rule.title}</h3>
                  <p className={styles.body}>{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`section ${styles.audit}`} aria-labelledby="audit-title">
        <div className="shell">
          <div className={styles.auditGrid}>
            <div>
              <h2 id="audit-title" className={styles.auditTitle}>
                About that git audit
              </h2>
              <div className={`prose ${styles.auditBody}`}>
                <p>
                  Nobody is trying to catch you out. The history is checked because it is
                  the only honest record of how a product got built: who wrote what, when,
                  and in what order.
                </p>
                <p>
                  Commit as you go, from your own account, in small pieces. A repository
                  with one commit the night before the final tells the jury more than you
                  want it to.
                </p>
              </div>
              <p>
                <Link href="/journey" className="link">
                  See the four rounds
                </Link>
              </p>
            </div>

            <Cutout
              slug="sih-demo"
              sizes="(min-width: 64rem) 30vw, (min-width: 48rem) 42vw, 76vw"
              rotate={-2}
              tape={['tr', 'bl']}
              className={styles.auditPhoto}
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="prizes-title">
        <div className="shell">
          <h2 id="prizes-title" className={styles.prizesTitle}>
            What&rsquo;s on the table
          </h2>

          <dl className={styles.prizeList}>
            {prizes.places.map((p) => (
              <div key={p.place} className={styles.prize}>
                <dt className="meta">{p.place}</dt>
                <dd>{p.amount}</dd>
              </div>
            ))}
          </dl>

          <p className={styles.certs}>{prizes.poolLabel} total.</p>

          <p className={styles.strips}>
            <Strip tone="saffron" rotate={-1.6}>
              Ship it.
            </Strip>
          </p>

          <p className={styles.unclear}>
            If a requirement or a deadline is unclear, ask the organisers before you
            submit rather than after.
          </p>
        </div>
      </section>
    </>
  );
}
