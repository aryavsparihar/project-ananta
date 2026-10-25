import styles from './TeamCard.module.css';
import { initials, isPlaceholder, type Person } from '@/content/team';
import manifest from '@/public/team/manifest.json';

const PHOTOS = manifest as Record<string, { width: number; height: number }>;

const CLUB_LABEL: Record<NonNullable<Person['club']>, string> = {
  sangam: 'SANGAM',
  devgrowth: 'DevGrowth',
  codeclub: 'Code Club',
  smvdu: 'SMVDU',
};

/**
 * One person, pinned to the board.
 *
 * With a photo: the processed 4:5 crop, desaturated, with colour coming back
 * on hover and focus on pointer devices only.
 *
 * Without one: an initials card in the person's club colour, carrying the
 * same paper texture. Never a grey avatar silhouette.
 */
export function TeamCard({
  person,
  rotate = 0,
  featured = false,
}: {
  person: Person;
  rotate?: number;
  featured?: boolean;
}) {
  const pending = isPlaceholder(person);
  const processed = person.photo ? PHOTOS[person.photo] : undefined;
  const club = person.club ?? 'sangam';

  return (
    <figure
      className={[
        styles.card,
        featured ? styles.featured : '',
        pending ? styles.pending : '',
        styles[club],
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--rotate': `${rotate}deg` } as React.CSSProperties}
    >
      <span className={`${styles.tape} ${styles.tapeTop}`} aria-hidden="true" />

      <div className={styles.frame}>
        {processed && person.photo ? (
          <picture>
            <source
              type="image/avif"
              srcSet={`/team/${person.photo}-320.avif 320w, /team/${person.photo}-640.avif 640w`}
              sizes={
                featured
                  ? '(min-width: 48rem) 20rem, 44vw'
                  : '(min-width: 48rem) 14rem, 42vw'
              }
            />
            <source
              type="image/webp"
              srcSet={`/team/${person.photo}-320.webp 320w, /team/${person.photo}-640.webp 640w`}
              sizes={
                featured
                  ? '(min-width: 48rem) 20rem, 44vw'
                  : '(min-width: 48rem) 14rem, 42vw'
              }
            />
            {/* A plain <img> inside <picture> on purpose: these are already
                cropped, treated and encoded to AVIF and WebP at two sizes by
                `npm run team:photos`. next/image would re-encode an image we
                deliberately processed and would ignore the AVIF we generated.
                (next's no-img-element rule does not flag <img> inside
                <picture>, so no disable comment is needed.) */}
            <img
              src={`/team/${person.photo}-640.webp`}
              alt={person.name}
              width={processed.width}
              height={processed.height}
              loading="lazy"
              decoding="async"
              className={styles.photo}
            />
          </picture>
        ) : (
          <div className={styles.initials} aria-hidden="true">
            <span>{initials(person.name)}</span>
          </div>
        )}
      </div>

      <figcaption className={styles.caption}>
        <span className={styles.name}>{person.name}</span>
        <span className={styles.role}>{person.role}</span>
        <span className={styles.tags}>
          {person.club && <span className={styles.tag}>{CLUB_LABEL[person.club]}</span>}
          {person.year && <span className={styles.year}>{person.year}</span>}
          {person.school && <span className={styles.year}>{person.school}</span>}
        </span>

        {(person.linkedin || person.github) && (
          <span className={styles.links}>
            {person.linkedin && (
              <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
                <span className="visually-hidden">
                  {' '}
                  ({person.name}, opens in a new tab)
                </span>
              </a>
            )}
            {person.github && (
              <a href={person.github} target="_blank" rel="noopener noreferrer">
                GitHub
                <span className="visually-hidden">
                  {' '}
                  ({person.name}, opens in a new tab)
                </span>
              </a>
            )}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
