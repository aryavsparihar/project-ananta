'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ADMIN_NAV } from '@/lib/admin';
import { useAdmin } from '@/components/admin/AdminFrame';
import styles from '@/components/admin/Admin.module.css';

type Counts = Record<string, number | null>;

/** Each count is a HEAD request: no rows travel, only the total. */
async function count(table: string, column?: string, value?: string | boolean) {
  let query = createClient().from(table).select('*', { count: 'exact', head: true });
  if (column !== undefined && value !== undefined) query = query.eq(column, value);
  const { count: n, error } = await query;
  return error ? null : n;
}

export default function Dashboard() {
  const { role } = useAdmin();
  const organiser = role !== 'judge';
  const [counts, setCounts] = useState<Counts>({});

  useEffect(() => {
    if (!organiser) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all([
        count('registrations').then((n) => ['registrations', n] as const),
        count('registrations', 'source', 'website').then((n) => ['website', n] as const),
        count('registrations', 'status', 'new').then((n) => ['new', n] as const),
        count('registrations', 'status', 'accepted').then(
          (n) => ['accepted', n] as const,
        ),
        count('contest_teams').then((n) => ['teams', n] as const),
        count('problem_statements', 'is_published', true).then(
          (n) => ['problems', n] as const,
        ),
      ]);
      if (!cancelled) setCounts(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [organiser]);

  const show = (key: string) => counts[key] ?? '…';
  const modules = ADMIN_NAV.filter(
    (item) => item.href !== '/admin/dashboard' && item.roles.includes(role),
  );

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Control <em>room.</em>
          </h1>
          <p className={styles.intro}>
            Everything on the public site and the participant portal is managed from here.
            Changes to content reach the live pages within seconds.
          </p>
        </div>
      </header>

      {organiser && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className="meta">Registrations</span>
            <strong>{show('registrations')}</strong>
          </div>
          <div className={styles.stat}>
            <span className="meta">Via the site</span>
            <strong>{show('website')}</strong>
          </div>
          <div className={styles.stat}>
            <span className="meta">Awaiting review</span>
            <strong>{show('new')}</strong>
          </div>
          <div className={styles.stat}>
            <span className="meta">Accepted</span>
            <strong>{show('accepted')}</strong>
          </div>
          <div className={styles.stat}>
            <span className="meta">Teams</span>
            <strong>{show('teams')}</strong>
          </div>
          <div className={styles.stat}>
            <span className="meta">Problems live</span>
            <strong>{show('problems')}</strong>
          </div>
        </div>
      )}

      {organiser && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Launch checklist</h2>
          <div className={styles.modules}>
            <Link href="/admin/accounts" className={styles.module}>
              <h2>Review participant accounts</h2>
              <p className={styles.muted}>
                Find signed-in students who have not submitted the registration form.
              </p>
            </Link>
            <Link href="/admin/problems" className={styles.module}>
              <h2>
                {counts.problems === 0
                  ? 'Publish problem statements'
                  : 'Review problem statements'}
              </h2>
              <p className={styles.muted}>
                {counts.problems === 0
                  ? 'No problem statements are published yet. Add the approved statements before sharing the page.'
                  : `${counts.problems} problem statement(s) are currently published.`}
              </p>
            </Link>
            <Link href="/admin/teams" className={styles.module}>
              <h2>
                {counts.teams === 0 ? 'Create the team roster' : 'Review team roster'}
              </h2>
              <p className={styles.muted}>
                {counts.teams === 0
                  ? 'No teams are saved yet. Create teams after the registration review and publish them when approved.'
                  : `${counts.teams} team(s) are saved. Check member details and publication status.`}
              </p>
            </Link>
            <Link href="/admin/content" className={styles.module}>
              <h2>Verify event content</h2>
              <p className={styles.muted}>
                Review dates, rules, prizes, contact details, registration settings and
                the team page. Shipped defaults remain active until a section is saved
                here.
              </p>
            </Link>
          </div>
          {counts.registrations === 0 && (
            <p className={styles.notice}>
              No registration rows exist yet. Check participant accounts separately: a
              confirmed sign-in is not the same as a submitted entry.
            </p>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Modules</h2>
        {modules.length ? (
          <div className={styles.modules}>
            {modules.map((item) => (
              <Link key={item.href} href={item.href} className={styles.module}>
                <h2>{item.label}</h2>
                <p className={styles.muted}>{item.blurb}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>
            Judging tools arrive with the rounds. Until then there is nothing to manage
            with a judge account.
          </p>
        )}
      </div>
    </section>
  );
}
