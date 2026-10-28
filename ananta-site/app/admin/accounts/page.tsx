'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/components/admin/AdminFrame';
import { formatDateTime, ROLE_LABEL, type AdminRole } from '@/lib/admin';
import styles from '@/components/admin/Admin.module.css';

type Account = {
  email: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  registrationStatus: 'registered' | 'not_registered';
  registrationDate: string | null;
  registrationSource: 'website' | 'google_forms' | null;
  participantName: string | null;
  entryNumber: string | null;
  adminRole: AdminRole | null;
  adminActive: boolean | null;
};

type Filter = 'all' | 'unregistered' | 'registered' | 'never-signed-in' | 'unverified';

const ROLE_OPTIONS: AdminRole[] = ['event_admin', 'judge', 'super_admin'];

function date(value: string | null) {
  return value ? formatDateTime(value) : 'Never';
}

export default function AccountsAdmin() {
  const { role } = useAdmin();
  const canGrant = role === 'super_admin';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminRole>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);
  const [truncated, setTruncated] = useState(false);

  const load = useCallback(async (background = false) => {
    // Prevent the initial load, manual refresh and automatic refresh from overlapping.
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setNotice(null);
    }

    try {
      const response = await fetch('/api/admin/accounts', { cache: 'no-store' });
      const result = (await response.json()) as {
        error?: string;
        accounts?: Account[];
        truncated?: boolean;
      };
      if (!response.ok) throw new Error(result.error ?? 'Could not load accounts.');
      const rows = result.accounts ?? [];
      setAccounts(rows);
      setTruncated(Boolean(result.truncated));
      setLastUpdated(new Date().toISOString());
      setNotice((current) => (current?.kind === 'error' ? null : current));
      setRoleDrafts((current) => {
        const next = { ...current };
        for (const account of rows) {
          if (!next[account.email]) next[account.email] = 'event_admin';
        }
        return next;
      });
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not load accounts.',
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load(true);
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [load]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesSearch =
        !query ||
        account.email.toLowerCase().includes(query) ||
        (account.participantName ?? '').toLowerCase().includes(query) ||
        (account.entryNumber ?? '').toLowerCase().includes(query);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'unregistered' && account.registrationStatus === 'not_registered') ||
        (filter === 'registered' && account.registrationStatus === 'registered') ||
        (filter === 'never-signed-in' && !account.lastSignInAt) ||
        (filter === 'unverified' && !account.emailConfirmedAt);
      return matchesSearch && matchesFilter;
    });
  }, [accounts, search, filter]);

  async function grant(account: Account) {
    const nextRole = roleDrafts[account.email] ?? 'event_admin';
    if (nextRole === 'super_admin') {
      const accepted = window.confirm(
        `Give ${account.email} full super-admin access, including organiser management and audit logs?`,
      );
      if (!accepted) return;
    }
    setBusyEmail(account.email);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, role: nextRole }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not grant access.');
      setNotice({
        kind: 'success',
        text: `${account.email} now has the ${ROLE_LABEL[nextRole]} role. They should sign in again before using admin pages.`,
      });
      await load();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not grant access.',
      });
    } finally {
      setBusyEmail(null);
    }
  }

  const notRegistered = accounts.filter(
    (account) => account.registrationStatus === 'not_registered',
  ).length;
  const neverSignedIn = accounts.filter((account) => !account.lastSignInAt).length;
  const unverified = accounts.filter((account) => !account.emailConfirmedAt).length;

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Participant <em>accounts.</em>
          </h1>
          <p className={styles.intro}>
            See who has created an account, verified their email, signed in, and completed
            the registration form. An account by itself is not an event registration.
          </p>
        </div>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => void load()}
          disabled={loading || refreshing}
        >
          {loading || refreshing ? 'Refreshing…' : 'Refresh accounts'}
        </button>
      </header>

      {notice && (
        <p
          className={notice.kind === 'error' ? styles.error : styles.success}
          role="status"
        >
          {notice.text}
        </p>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className="meta">Accounts visible</span>
          <strong>{loading ? '…' : accounts.length}</strong>
        </div>
        <div className={styles.stat}>
          <span className="meta">Not registered</span>
          <strong>{loading ? '…' : notRegistered}</strong>
        </div>
        <div className={styles.stat}>
          <span className="meta">Never signed in</span>
          <strong>{loading ? '…' : neverSignedIn}</strong>
        </div>
        <div className={styles.stat}>
          <span className="meta">Email not verified</span>
          <strong>{loading ? '…' : unverified}</strong>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>Search by email, name or entry number</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="student@smvdu.ac.in"
            />
          </label>
          <label className={styles.field}>
            <span>Show accounts</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
            >
              <option value="all">All visible accounts</option>
              <option value="unregistered">Signed up but not registered</option>
              <option value="registered">Registration submitted</option>
              <option value="never-signed-in">Never signed in</option>
              <option value="unverified">Email not verified</option>
            </select>
          </label>
        </div>
        <p className={styles.muted}>
          The directory refreshes automatically every minute. Last checked:{' '}
          {lastUpdated ? formatDateTime(lastUpdated) : 'not yet'}.
        </p>
        <p className={styles.muted}>
          Last sign-in is supplied by Supabase Auth. It does not mean a registration was
          submitted.
          {canGrant
            ? ' You can grant an existing account an organiser role from this page.'
            : ''}
        </p>
      </div>

      {truncated && (
        <p className={styles.notice} role="status">
          The directory reached its safety limit. Some accounts may be outside this
          result; ask a super admin to review the account volume.
        </p>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {loading
            ? 'Loading accounts…'
            : `${visible.length} account${visible.length === 1 ? '' : 's'}`}
        </h2>
        {!loading && visible.length === 0 ? (
          <p className={styles.muted}>No accounts match this filter.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Created</th>
                  <th>Email verification</th>
                  <th>Last sign-in</th>
                  <th>Registration</th>
                  <th>Admin access</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((account) => (
                  <tr key={account.email}>
                    <td>
                      <strong>{account.email || 'No email on record'}</strong>
                      {account.participantName && (
                        <div className={styles.muted}>{account.participantName}</div>
                      )}
                      {account.entryNumber && (
                        <div className={styles.muted}>Entry {account.entryNumber}</div>
                      )}
                    </td>
                    <td>{date(account.createdAt)}</td>
                    <td>
                      {account.emailConfirmedAt
                        ? date(account.emailConfirmedAt)
                        : 'Pending'}
                    </td>
                    <td>{date(account.lastSignInAt)}</td>
                    <td>
                      {account.registrationStatus === 'registered' ? (
                        <>
                          <strong>Registered</strong>
                          <div className={styles.muted}>
                            {account.registrationSource === 'google_forms'
                              ? 'Google Form'
                              : 'Site registration'}
                          </div>
                          <div className={styles.muted}>
                            Recorded {date(account.registrationDate)}
                          </div>
                        </>
                      ) : (
                        <span>Not registered</span>
                      )}
                    </td>
                    <td>
                      {account.adminRole ? (
                        <>
                          <strong>{ROLE_LABEL[account.adminRole]}</strong>
                          <div className={styles.muted}>
                            {account.adminActive ? 'Active' : 'Deactivated'}
                          </div>
                          {canGrant && (
                            <Link className="link" href="/admin/users">
                              Manage role
                            </Link>
                          )}
                        </>
                      ) : (
                        <span className={styles.muted}>Participant</span>
                      )}
                    </td>
                    <td>
                      {canGrant && !account.adminRole && account.emailConfirmedAt ? (
                        <div className={styles.grid}>
                          <label className={styles.field}>
                            <span>Grant role</span>
                            <select
                              value={roleDrafts[account.email] ?? 'event_admin'}
                              onChange={(event) =>
                                setRoleDrafts((current) => ({
                                  ...current,
                                  [account.email]: event.target.value as AdminRole,
                                }))
                              }
                              aria-label={`Role to grant to ${account.email}`}
                            >
                              {ROLE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {ROLE_LABEL[option]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            className={styles.button}
                            disabled={busyEmail !== null}
                            onClick={() => void grant(account)}
                          >
                            {busyEmail === account.email ? 'Granting…' : 'Grant access'}
                          </button>
                        </div>
                      ) : account.adminRole ? (
                        <span className={styles.muted}>Use Organisers to change</span>
                      ) : !account.emailConfirmedAt ? (
                        <span className={styles.muted}>Verify email first</span>
                      ) : (
                        <span className={styles.muted}>Super admin only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
