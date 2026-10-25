'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import styles from './SiteNav.module.css';

const LINKS = [
  { href: '/about', label: 'The idea' },
  { href: '/journey', label: 'The journey' },
  { href: '/glimpses', label: 'Glimpses' },
  { href: '/rules', label: 'Rules' },
  { href: '/team', label: 'Team' },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on route change, so the panel never survives a navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes and returns focus to the button that opened it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={styles.nav}>
      <div className={styles.bar}>
        <Link href="/" className={styles.wordmark} aria-label="ANANTA, home">
          ANANTA
        </Link>

        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <nav
          id={panelId}
          className={`${styles.links} ${open ? styles.open : ''}`}
          aria-label="Main"
        >
          {LINKS.map(({ href, label }) => {
            const current = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={styles.link}
                aria-current={current ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
          <Link href="/register" className={styles.cta}>
            Enter ANANTA
          </Link>
        </nav>
      </div>
    </header>
  );
}
