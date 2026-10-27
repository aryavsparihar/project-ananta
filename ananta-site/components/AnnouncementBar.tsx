import Link from 'next/link';
import styles from './AnnouncementBar.module.css';
import type { SiteContent } from '@/lib/content-sections';

/** The organisers' one-line notice, set from /admin/content. */
export function AnnouncementBar({
  announcement,
}: {
  announcement: SiteContent['announcement'];
}) {
  if (!announcement.enabled || !announcement.text.trim()) return null;

  const { href, linkLabel } = announcement;
  const external = href.startsWith('https://');

  return (
    <aside className={styles.bar} aria-label="Announcement">
      <p className={styles.inner}>
        <span>{announcement.text}</span>
        {href &&
          (external ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {linkLabel || 'Read more'}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link href={href} className={styles.link}>
              {linkLabel || 'Read more'}
            </Link>
          ))}
      </p>
    </aside>
  );
}
