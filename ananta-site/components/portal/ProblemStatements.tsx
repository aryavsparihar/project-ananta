'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { friendlyError } from '@/lib/portal';
import styles from './ProblemStatements.module.css';

type Statement = {
  id: string;
  code: string;
  title: string;
  domain: string | null;
  summary: string | null;
  body: string | null;
  resource_url: string | null;
};

/** Redaction bars: widths as fractions of the line, fixed so nothing reshuffles. */
const REDACTED = [0.92, 0.74, 0.86, 0.4, 0.97, 0.68, 0.81, 0.55];

/**
 * Published problem statements, or, until the first one is out, a sealed
 * brief: a taped envelope, a stamp and a page of redacted lines.
 */
export function ProblemStatements({ note }: { note: string }) {
  const [items, setItems] = useState<Statement[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await createClient()
          .from('problem_statements')
          .select('id, code, title, domain, summary, body, resource_url')
          .eq('is_published', true)
          .order('sort_order')
          .order('code');
        if (error) throw error;
        if (!cancelled) setItems((data ?? []) as Statement[]);
      } catch (err) {
        if (!cancelled)
          setError(friendlyError(err, 'Could not load the problem statements.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className={styles.note}>{error}</p>;
  if (!items) return <p className={styles.note}>Opening the file…</p>;
  if (items.length === 0) return <SealedBrief note={note} />;

  return (
    <ol className={styles.list}>
      {items.map((ps) => (
        <li key={ps.id} className={styles.item}>
          <p className={styles.code}>
            {ps.code}
            {ps.domain && <span className={styles.domain}>{ps.domain}</span>}
          </p>
          <div>
            <h2 className={styles.title}>{ps.title}</h2>
            {ps.summary && <p className={styles.summary}>{ps.summary}</p>}
            {ps.body && <p className={styles.body}>{ps.body}</p>}
            {ps.resource_url && (
              <p>
                <a
                  className="link"
                  href={ps.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Full brief
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function SealedBrief({ note }: { note: string }) {
  return (
    <div className={styles.sealed}>
      <div className={styles.envelope} aria-hidden="true">
        <span className={`${styles.tape} ${styles.tapeL}`} />
        <span className={`${styles.tape} ${styles.tapeR}`} />
        <p className={styles.fileNo}>FILE / ANANTA-PS / 2026</p>
        <p className={styles.stamp}>Sealed</p>
        <div className={styles.page}>
          {REDACTED.map((w, i) => (
            <span
              key={i}
              className={styles.bar}
              style={{ '--w': w, '--i': i } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className={styles.copy}>
        <h2 className={styles.soon}>
          To be released soon, <em>stay tuned.</em>
        </h2>
        <p className={styles.note}>
          The problems are written, and they are staying in the envelope until the
          organisers open it. When they do, they appear here first.
        </p>
        {note && <p className={styles.note}>{note}</p>}

        <pre className={styles.log} aria-label="Status">
          <span>$ git fetch origin problem-statements</span>
          <span>remote: Enumerating objects: sealed</span>
          <span className={styles.cursor}>remote: check back soon</span>
        </pre>
      </div>
    </div>
  );
}
