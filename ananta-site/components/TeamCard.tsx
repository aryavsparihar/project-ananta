import type { CSSProperties } from 'react';
import styles from './TeamCard.module.css';
import { SocialLinks } from './SocialLinks';
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
 *
 * Easter egg: if person.easterEggUrl is configured, clicking that person's
 * processed portrait opens the configured destination.
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

  const portrait =
    processed && person.photo ? (
      <picture>
        <source
          type="image/avif"
          srcSet={`/team/${person.photo}-320.avif 320w, /team/${person.photo}-640.avif 640w`}
          sizes={
            featured ? '(min-width: 48rem) 20rem, 44vw' : '(min-width: 48rem) 14rem, 42vw'
          }
        />
        <source
          type="image/webp"
          srcSet={`/team/${person.photo}-320.webp 320w, /team/${person.photo}-640.webp 640w`}
          sizes={
            featured ? '(min-width: 48rem) 20rem, 44vw' : '(min-width: 48rem) 14rem, 42vw'
          }
        />
        {/*
          These images are already cropped and encoded to AVIF and WebP by
          npm run team:photos. Keep the plain img inside picture to preserve
          the prepared variants instead of re-encoding them with next/image.
        */}
        <img
          src={`/team/${person.photo}-640.webp`}
          alt={person.easterEggUrl ? '' : person.name}
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
    );

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
      style={{ '--rotate': `${rotate}deg` } as CSSProperties}
    >
      <span className={`${styles.tape} ${styles.tapeTop}`} aria-hidden="true" />

      <div className={styles.frame}>
        {person.easterEggUrl && processed && person.photo ? (
          <a
            href={person.easterEggUrl}
            className={styles.easterEggLink}
            aria-label={`Open the hidden Easter egg for ${person.name}`}
          >
            {portrait}
          </a>
        ) : (
          portrait
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

        <SocialLinks
          name={person.name}
          links={{
            linkedin: person.linkedin,
            github: person.github,
            website: person.website,
          }}
        />
      </figcaption>
    </figure>
  );
}
