import Image from 'next/image';
import Link from 'next/link';
import styles from './SiteFooter.module.css';
import { CircuitRule } from './Marks';
import { presentedBy, type SiteContent } from '@/lib/content-sections';

const LOGOS = [
  { src: '/logos/sangam.png', alt: 'SANGAM', w: 954, h: 960 },
  { src: '/logos/devgrowth.png', alt: 'DevGrowth', w: 800, h: 800 },
  { src: '/logos/codeclub.png', alt: 'Code Club', w: 398, h: 398 },
  { src: '/logos/smvdu.png', alt: 'Shri Mata Vaishno Devi University', w: 490, h: 434 },
];

/**
 * The credits block the poster ends on: a hairline, the four marks, then the
 * attribution in mono. Deliberately at the foot of the page rather than a
 * letterhead row across the top.
 */
export function SiteFooter({
  event,
  contact,
}: {
  event: SiteContent['event'];
  contact: SiteContent['contact'];
}) {
  return (
    <footer className={`${styles.footer} on-dark`}>
      <div className={styles.inner}>
        <CircuitRule className={styles.rule} />

        <div className={styles.grid}>
          <div>
            <p className={styles.mark}>
              {event.name} <span className="deva">{event.devanagari}</span>
            </p>
            <p className={styles.meaning}>
              <em>{event.meaning}</em> · {event.displayRange}
            </p>
          </div>

          <ul className={styles.logos}>
            {LOGOS.map((logo) => (
              <li key={logo.src}>
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.w}
                  height={logo.h}
                  sizes="(min-width: 48rem) 56px, 44px"
                  className={styles.logo}
                />
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.contact}>
          <span className="meta">Write to the organisers</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </p>

        <p className={styles.credit}>
          {presentedBy(event)} · {event.school}
          <br />
          {event.association}
        </p>

        <div className={styles.base}>
          <span className="meta">
            © {event.year} {event.name}
          </span>
          <Link href="/admin" className={styles.admin}>
            Organiser sign-in
          </Link>
        </div>
      </div>
    </footer>
  );
}
