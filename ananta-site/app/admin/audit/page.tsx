'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { formatDateTime } from '@/lib/admin';
import styles from '@/components/admin/Admin.module.css';

type Entry = {
  id: number;
  at: string;
  actor_email: string | null;
  table_name: string;
  row_key: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

const PAGE = 100;
const IGNORED = new Set(['updated_at', 'created_at']);

/** Only the fields that changed, so an edit reads as an edit. */
function changes(entry: Entry): string {
  const before = entry.old_data ?? {};
  const after = entry.new_data ?? {};
  if (entry.action !== 'UPDATE') {
    return JSON.stringify(entry.action === 'INSERT' ? after : before, null, 2);
  }
  const lines = Object.keys({ ...before, ...after })
    .filter((k) => !IGNORED.has(k))
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map(
      (k) =>
        `${k}:\n  was ${JSON.stringify(before[k])}\n  now ${JSON.stringify(after[k])}`,
    );
  return lines.join('\n') || 'No visible change.';
}

const LABEL: Record<Entry['action'], string> = {
  INSERT: 'Added',
  UPDATE: 'Changed',
  DELETE: 'Deleted',
};

export default function AuditLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [table, setTable] = useState('all');
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (offset: number) => {
      setLoading(true);
      let query = createClient()
        .from('audit_log')
        .select('*')
        .order('at', { ascending: false })
        .range(offset, offset + PAGE - 1);
      if (table !== 'all') query = query.eq('table_name', table);
      const { data, error } = await query;
      if (error) setError(error.message);
      const page = (data ?? []) as Entry[];
      setEntries((current) => (offset === 0 ? page : [...current, ...page]));
      setMore(page.length === PAGE);
      setLoading(false);
    },
    [table],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <p className={`meta ${styles.kicker}`}>ANANTA / Admin</p>
          <h1 className={styles.title}>
            Audit <em>log.</em>
          </h1>
          <p className={styles.intro}>
            Every change organisers make to content, problems, teams, organiser roles and
            registration decisions, written by the database itself.
          </p>
        </div>
        <label className={styles.field}>
          <span>Show</span>
          <select value={table} onChange={(e) => setTable(e.target.value)}>
            <option value="all">Everything</option>
            <option value="site_content">Content</option>
            <option value="problem_statements">Problem statements</option>
            <option value="contest_teams">Teams</option>
            <option value="contest_team_members">Team members</option>
            <option value="registrations">Registration decisions</option>
            <option value="admin_users">Organiser roles</option>
          </select>
        </label>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{formatDateTime(e.at)}</td>
                <td>{e.actor_email ?? 'System'}</td>
                <td>
                  {LABEL[e.action]} <code>{e.table_name}</code>
                  <br />
                  <span className={styles.muted}>{e.row_key}</span>
                </td>
                <td>
                  <details>
                    <summary className="meta">Show</summary>
                    <pre className={styles.diff}>{changes(e)}</pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && entries.length === 0 && (
        <p className={styles.muted}>Nothing logged yet.</p>
      )}
      {loading && <p className={styles.muted}>Loading…</p>}
      {more && !loading && (
        <p className={styles.section}>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => void load(entries.length)}
          >
            Load older
          </button>
        </p>
      )}
    </section>
  );
}
