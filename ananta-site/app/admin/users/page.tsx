'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { ADMIN_ROLES, ROLE_LABEL, formatDateTime, type AdminRole } from '@/lib/admin';
import { friendlyError } from '@/lib/portal';
import { useAdmin } from '@/components/admin/AdminFrame';
import styles from '@/components/admin/Admin.module.css';

type AdminUser = {
  user_id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
};

const ROLE_HELP: Record<AdminRole, string> = {
  super_admin: 'Everything, including this page and the audit log.',
  event_admin: 'Registrations, teams, problems and content.',
  judge: 'The dashboard, and judging once it exists.',
};

export default function UsersAdmin() {
  const me = useAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('event_admin');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AdminRole>('event_admin');
  const [inviting, setInviting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await createClient().rpc('admin_list_users');
    if (error) setNotice({ kind: 'error', text: error.message });
    setUsers((data ?? []) as AdminUser[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setUser(
    target: string,
    nextRole: AdminRole,
    active: boolean,
    ok: string,
  ) {
    setBusy(true);
    setNotice(null);
    const { error } = await createClient().rpc('admin_set_user', {
      target_email: target,
      target_role: nextRole,
      target_active: active,
    });
    setBusy(false);
    if (error) {
      setNotice({ kind: 'error', text: friendlyError(error) });
      return false;
    }
    setNotice({ kind: 'success', text: ok });
    await load();
    return true;
  }

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (await setUser(target, role, true, `${target} is now ${ROLE_LABEL[role]}.`)) {
      setEmail('');
    }
  }

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = inviteEmail.trim().toLowerCase();
    const confirmMessage =
      `Give ${target} full super-admin access, including organiser management? ` +
      'Only invite someone you trust.';
    if (inviteRole === 'super_admin' && !window.confirm(confirmMessage)) {
      return;
    }

    setInviting(true);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target, role: inviteRole }),
      });
      const result = (await response.json()) as {
        error?: string;
        email?: string;
        role?: AdminRole;
        invited?: boolean;
        assignedExistingAccount?: boolean;
        auditLogged?: boolean;
        warning?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? 'Could not invite the organiser.');
      }

      const invitedEmail = result.email ?? target;
      const invitedRole = result.role ?? inviteRole;
      const invitationMessage = result.assignedExistingAccount
        ? `${invitedEmail} already had an account; the ${ROLE_LABEL[invitedRole]} role has now been assigned.`
        : `Invitation sent to ${invitedEmail} with the ${ROLE_LABEL[invitedRole]} role.`;

      setInviteEmail('');
      setNotice({
        kind: result.auditLogged === false ? 'error' : 'success',
        text: [invitationMessage, result.warning].filter(Boolean).join(' '),
      });
      await load();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Could not invite the organiser.',
      });
    } finally {
      setInviting(false);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Organisers<em>.</em>
          </h1>
          <p className={styles.intro}>
            Invite new organisers by email or assign a role to an existing Supabase
            account. Access is enforced by the database, not just by this page.
            Deactivating keeps the role record but removes access.
          </p>
        </div>
      </header>

      {notice && (
        <p
          className={notice.kind === 'error' ? styles.error : styles.success}
          role="status"
        >
          {notice.text}
        </p>
      )}

      <form onSubmit={invite} className={`${styles.card} ${styles.grid}`}>
        <h2 className={styles.cardTitle}>Invite a new organiser</h2>
        <p className={styles.muted}>
          Sends a time-limited invitation email. The recipient sets a password before
          signing in. The Supabase “Invite user” email template must link to /auth/confirm
          with token_hash and type=invite; see the participant-portal setup guide.
        </p>
        <div className={`${styles.grid} ${styles.grid3}`}>
          <label className={styles.field}>
            <span>Organiser email</span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label className={styles.field}>
            <span>Role to grant</span>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AdminRole)}
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.field}>
            <span>&nbsp;</span>
            <button type="submit" className={styles.button} disabled={inviting || busy}>
              {inviting ? 'Sending invitation…' : 'Send invitation'}
            </button>
          </div>
        </div>
        <p className={styles.muted}>{ROLE_HELP[inviteRole]}</p>
      </form>

      <form onSubmit={add} className={`${styles.card} ${styles.grid}`}>
        <h2 className={styles.cardTitle}>Add or change an existing organiser</h2>
        <p className={styles.muted}>
          Use this for an account that already exists in Supabase Auth. New accounts
          should be created with the invitation form above.
        </p>
        <div className={`${styles.grid} ${styles.grid3}`}>
          <label className={styles.field}>
            <span>Account email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.field}>
            <span>&nbsp;</span>
            <button type="submit" className={styles.button} disabled={busy}>
              Save
            </button>
          </div>
        </div>
        <p className={styles.muted}>{ROLE_HELP[role]}</p>
      </form>

      <div className={styles.section}>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last sign-in</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = u.user_id === me.userId;
                  return (
                    <tr key={u.user_id}>
                      <td>
                        {u.email}
                        {self && <span className={styles.muted}> (you)</span>}
                      </td>
                      <td>
                        <select
                          className={styles.input}
                          value={u.role}
                          disabled={busy || self}
                          aria-label={`Role for ${u.email}`}
                          onChange={(e) => {
                            const nextRole = e.target.value as AdminRole;
                            void setUser(
                              u.email,
                              nextRole,
                              u.is_active,
                              `${u.email} is now ${ROLE_LABEL[nextRole]}.`,
                            );
                          }}
                        >
                          {ADMIN_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${u.is_active ? styles.badgeLive : ''}`}
                        >
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>{formatDateTime(u.last_sign_in_at)}</td>
                      <td>
                        {!self && (
                          <button
                            type="button"
                            className={u.is_active ? styles.danger : styles.ghost}
                            disabled={busy}
                            onClick={() => {
                              const action = u.is_active ? 'deactivated' : 'reactivated';
                              void setUser(
                                u.email,
                                u.role,
                                !u.is_active,
                                `${u.email} ${action}.`,
                              );
                            }}
                          >
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
