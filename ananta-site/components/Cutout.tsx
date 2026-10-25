import Image from 'next/image';
import styles from './Cutout.module.css';
import { photo as lookup, type Club } from '@/content/photos';
import manifest from '@/public/photos/manifest.json';

type Dimensions = { width: number; height: number; tone: string };
const DIMS = manifest as Record<string, Dimensions>;

const CLUB_LABEL: Record<Club, string> = {
  sangam: 'SANGAM',
  devgrowth: 'DevGrowth',
  codeclub: 'Code Club',
  smvdu: 'SMVDU',
  null: 'NULL',
  aiml: 'AI & ML',
};

type Props = {
  slug: string;
  /** Responsive sizes. Always pass this — it decides what gets downloaded. */
  sizes: string;
  /** Degrees. Small numbers only; this is a photo taped to a wall, not a fan. */
  rotate?: number;
  /** Where the tape sits. */
  tape?: ('tl' | 'tr' | 'bl' | 'br')[];
  priority?: boolean;
  showCaption?: boolean;
  showTag?: boolean;
  className?: string;
};

/**
 * A photocopied, torn-edged event photo taped to the page.
 *
 * The tear and the duotone are baked into the file by `npm run photos`; this
 * component only places it, tapes it and labels it. Width and height come from
 * the generated manifest, so the box is reserved before the image loads and
 * nothing shifts.
 */
export function Cutout({
  slug,
  sizes,
  rotate = 0,
  tape = ['tl', 'br'],
  priority = false,
  showCaption = true,
  showTag = false,
  className,
}: Props) {
  const meta = lookup(slug);
  const dim = DIMS[slug];
  if (!dim) throw new Error(`No processed photo for "${slug}". Run: npm run photos`);

  return (
    <figure
      className={[styles.cutout, className].filter(Boolean).join(' ')}
      style={{ '--rotate': `${rotate}deg` } as React.CSSProperties}
    >
      <div className={styles.plate}>
        <Image
          src={`/photos/${slug}.webp`}
          alt={meta.alt}
          width={dim.width}
          height={dim.height}
          sizes={sizes}
          priority={priority}
          className={styles.image}
        />
        {tape.map((corner) => (
          <span
            key={corner}
            className={`${styles.tape} ${styles[corner]}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {(showCaption || showTag) && (
        <figcaption className={styles.caption}>
          {showTag && (
            <span className={`${styles.tag} ${styles[meta.club]}`}>
              {CLUB_LABEL[meta.club]}
            </span>
          )}
          {showCaption && <span>{meta.caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}
