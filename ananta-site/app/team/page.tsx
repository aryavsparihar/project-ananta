import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { TeamCard } from '@/components/TeamCard';
import { CircuitRule } from '@/components/Marks';
import styles from './page.module.css';
import { EVENT, PRESENTED_BY } from '@/content/event';
import { GROUPS, peopleIn, placeholders } from '@/content/team';

export const metadata: Metadata = {
  title: 'Team',
  description: `The faculty, organising core and club leads running ${EVENT.name} at the ${EVENT.school}.`,
  alternates: { canonical: '/team' },
};

/**
 * Deterministic tilt, so a card does not jump to a new angle on every build.
 * Index-based rather than random: the board should look hand-pinned, not
 * reshuffled.
 */
const TILTS = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.2, -2.6, 0.9];
const tilt = (i: number) => TILTS[i % TILTS.length];

export default function Team() {
  const pending = placeholders().length;

  return (
    <>
      <PageHead
        label="The team"
        title={
          <>
            The people
            <br />
            <em>running it.</em>
          </>
        }
        lead={`${PRESENTED_BY}, with the School of CSE. Faculty, the organising core and the club leads.`}
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

      {GROUPS.map((group, gi) => {
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

            {gi < GROUPS.length - 1 && (
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
            {PRESENTED_BY} take on new organisers every year, usually from the people who
            competed the year before.
          </p>
        </div>
      </section>
    </>
  );
}
