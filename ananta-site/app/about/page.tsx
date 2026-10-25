import Link from 'next/link';
import type { Metadata } from 'next';
import { Cutout } from '@/components/Cutout';
import { Stamp } from '@/components/Stamp';
import { Strip, CircuitRule, Eyebrow } from '@/components/Marks';
import { PageHead } from '@/components/PageHead';
import styles from './page.module.css';
import { EVENT, PRESENTED_BY, PRIZES } from '@/content/event';

export const metadata: Metadata = {
  title: 'The idea',
  description: `Why ${EVENT.name} runs for six weeks instead of a weekend: one live product per team, built in the open with an audited git history.`,
  alternates: { canonical: '/about' },
};

export default function About() {
  return (
    <>
      <PageHead
        label="The idea"
        title={
          <>
            A hackathon that
            <br />
            <em>doesn&rsquo;t stop</em> at the demo.
          </>
        }
        lead="The hard part was never the idea. It is carrying one all the way to something other people can actually use."
      />

      <section className="section" aria-labelledby="meaning-title">
        <div className="shell">
          <div className={styles.meaningGrid}>
            <div>
              <Eyebrow>The name</Eyebrow>
              <h2 id="meaning-title" className={styles.devaTitle}>
                <span className="deva">{EVENT.devanagari}</span>
                <span className={styles.meaningWord}>
                  <em>{EVENT.meaning}</em>
                </span>
              </h2>
              <div className={`prose ${styles.meaningBody}`}>
                <p>
                  {EVENT.name} means endless. Not endless work — endless in the sense that
                  a product you ship does not stop when the event does. It stays online,
                  it keeps a commit history, and it is still yours in March.
                </p>
                <p>
                  Six weeks is long enough for that to be true, and short enough that you
                  have to make decisions.
                </p>
              </div>
            </div>

            <Cutout
              slug="pyverse-hands"
              sizes="(min-width: 64rem) 28vw, (min-width: 48rem) 40vw, 70vw"
              rotate={2}
              tape={['tl', 'br']}
              className={styles.meaningPhoto}
            />
          </div>
        </div>
      </section>

      <div className="shell">
        <CircuitRule />
      </div>

      <section className="section" aria-labelledby="what-title">
        <div className="shell">
          <h2 id="what-title" className={styles.whatTitle}>
            What actually happens
          </h2>

          <div className={styles.whatGrid}>
            <div className="prose">
              <p>
                {EVENT.name} is a six-week, project-based hackathon run by {PRESENTED_BY}{' '}
                at the {EVENT.school}, {EVENT.association}.
              </p>
              <p>
                Teams work through problem definition, architecture, UI/UX, development
                and deployment, with a marked review at each stage. Mixed-year teams, a
                faculty mentor, and a 4th-year student mentor who has done it before.
              </p>
              <p>
                The finish line is not a slide deck. It is a live product, a documented
                repository and a team that can explain every decision in it.
              </p>
            </div>

            <aside className={styles.aside}>
              <p className="meta">What you leave with</p>
              <ul className={styles.leaveWith}>
                <li>A deployed product with a public URL</li>
                <li>A git history that shows how it was built</li>
                <li>
                  A share of {PRIZES.poolLabel} if you place —{' '}
                  {PRIZES.places.map((p) => p.amount).join(' / ')}
                </li>
                <li>One of {PRIZES.certificates} certificates</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section className={`section ${styles.rule}`} aria-labelledby="rule-title">
        <div className="shell">
          <div className={styles.ruleInner}>
            <div>
              <h2 id="rule-title" className="visually-hidden">
                The rule that matters
              </h2>
              <p className={styles.strips}>
                <Strip tone="ink" rotate={-1.8}>
                  Build it yourself.
                </Strip>
                <Strip tone="saffron" rotate={1.4} className={styles.stripTwo}>
                  Keep the commits real.
                </Strip>
                <Strip tone="ink" rotate={-1.2} className={styles.stripThree}>
                  Put it online.
                </Strip>
              </p>
              <p className={styles.ruleNote}>
                Commit history and commit authenticity are audited. That is not a threat —
                it is the whole point of running this over six weeks instead of one night.
              </p>
              <p>
                <Link href="/rules" className="link">
                  All the rules
                </Link>
              </p>
            </div>

            <div className={styles.stampWrap}>
              <Stamp size={150} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
