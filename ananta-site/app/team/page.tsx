import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHead } from '@/components/PageHead';
import { TeamCard } from '@/components/TeamCard';
import { CircuitRule } from '@/components/Marks';
import styles from './page.module.css';
import { isPlaceholder } from '@/content/team';
import { presentedBy } from '@/lib/content-sections';
import { getSiteContent } from '@/lib/site-content';

// Keep this page in source control; set NEXT_PUBLIC_SHOW_TEAM_PAGE=true to restore it.
const TEAM_PAGE_ENABLED = process.env.NEXT_PUBLIC_SHOW_TEAM_PAGE === 'true';

export async function generateMetadata(): Promise<Metadata> {
  if (!TEAM_PAGE_ENABLED) {
    return {
      title: 'Page not found',
      robots: { index: false, follow: true },
    };
  }

  const { event } = await getSiteContent();
  return {
    title: 'Team',
    description: `The faculty, organising core and club leads running ${event.name} at the ${event.school}.`,
    alternates: { canonical: '/team' },
  };
}

/**
 * Deterministic tilt, so a card does not jump to a new angle on every build.
 * Index-based rather than random: the board should look hand-pinned, not
 * reshuffled.
 */
const TILTS = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.2, -2.6, 0.9];
const tilt = (i: number) => TILTS[i % TILTS.length];

export default async function Team() {
  if (!TEAM_PAGE_ENABLED) notFound();

  const { event, team } = await getSiteContent();
  const groups = team.groups;
  const peopleIn = (id: string) => team.people.filter((p) => p.group === id);
  const pending = team.people.filter(isPlaceholder).length;
  const credits = presentedBy(event);

  return (
    <>
      <PageHead
        title={
          <>
            The people
            <br />
            <em>running it.</em>
          </>
        }
        lead={`${credits}, with the School of CSE. Faculty, the organising core and the club leads.`}
      />

      {pending > 0 && (
        <div className="shell">
          <p className={styles.notice} role="note">
            <strong>Not final.</strong> {pending}{' '}
            {pending === 1 ? 'entry is' : 'entries are'} still <code>TODO Name</code>. A
            production build refuses to run until they are replaced.
          </p>
        </div>
      )}

      {groups.map((group, gi) => {
        const people = peopleIn(group.id);
        if (people.length === 0) return null;

        return (
          <section
            key={group.id}
            className={`section ${styles.group} ${group.featured ? styles.featuredGroup : ''}`}
            aria-labelledby={`group-${group.id}`}
          >
            <div className="shell">
              <div className={styles.groupHead}>
                <h2 id={`group-${group.id}`} className={styles.groupTitle}>
                  {group.title}
                </h2>
                <p className={styles.groupBlurb}>{group.blurb}</p>
              </div>

              <ul
                className={`${styles.board} ${group.featured ? styles.boardFeatured : ''}`}
              >
                {people.map((person, i) => (
                  <li key={`${person.group}-${i}`} className={styles.pin}>
                    <TeamCard
                      person={person}
                      rotate={tilt(gi * 3 + i)}
                      featured={group.featured}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {gi < groups.length - 1 && (
              <div className="shell">
                <CircuitRule flip={gi % 2 === 1} className={styles.divider} />
              </div>
            )}
          </section>
        );
      })}

      <section className={`section ${styles.join}`} aria-labelledby="join-title">
        <div className="shell">
          <h2 id="join-title" className={styles.joinTitle}>
            Run it with us next year.
          </h2>
          <p className={styles.joinBody}>
            {credits} take on new organisers every year, usually from the people who
            competed the year before.
          </p>
        </div>
      </section>
    </>
  );
}
