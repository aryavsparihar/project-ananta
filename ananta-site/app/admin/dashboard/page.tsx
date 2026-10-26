'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import styles from '../admin.module.css';

type AdminRole = 'super_admin' | 'event_admin' | 'judge';

const ADMIN_ROLES: AdminRole[] = ['super_admin', 'event_admin', 'judge'];

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && ADMIN_ROLES.includes(value as AdminRole);
}

export default function Dashboard() {
  const [email, setEmail] = useState('Checking session…');
  const [role, setRole] = useState('Checking role…');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAdmin() {
      const supabase = createClient();

      try {
        // Verify the current authenticated user with Supabase.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.replace('/admin?login=1');
          return;
        }

        // Retrieve the role recorded in the database.
        const { data: currentRole, error: roleError } =
          await supabase.rpc('current_admin_role');

        if (roleError || !isAdminRole(currentRole)) {
          await supabase.auth.signOut();

          window.location.replace('/admin?access=denied');
          return;
        }

        if (!cancelled) {
          setEmail(user.email ?? 'Authorised administrator');
          setRole(currentRole.replace('_', ' '));
        }
      } catch {
        if (!cancelled) {
          window.location.replace('/admin?error=config');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAdmin();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Unable to sign out:', error.message);
        return;
      }

      window.location.replace('/admin');
    } catch {
      console.error('An unexpected error occurred during sign out.');
    }
  }

  return (
    <section className={styles.wrap}>
      <div className="shell">
        <div className={styles.top}>
          <p className={`meta ${styles.label}`}>ANANTA / Admin</p>

          <button
            className={styles.signOut}
            onClick={logout}
            disabled={loading}
            type="button"
          >
            Sign out
          </button>
        </div>

        <h1 className={styles.title}>
          Control <em>room.</em>
        </h1>

        <p className={styles.intro}>
          {loading
            ? 'Verifying administrator access…'
            : `Signed in as ${email} · Role: ${role}.`}
        </p>

        <ul className={styles.modules}>
          <li className={styles.module}>
            <span className={`meta ${styles.moduleNo}`}>01 / Event content</span>

            <h2 className={styles.moduleName}>Site updates</h2>

            <p className={styles.moduleBody}>
              Connect this module to Supabase to manage announcements, dates and
              public-page content without redeploying.
            </p>

            <span className={styles.status}>Database setup required</span>
          </li>

          <li className={styles.module}>
            <span className={`meta ${styles.moduleNo}`}>02 / Registrations</span>

            <h2 className={styles.moduleName}>Participant entries</h2>

            <p className={styles.moduleBody}>
              Manage participant records through restricted database access while keeping
              Google Forms as the registration intake.
            </p>

            <span className={styles.status}>Database setup required</span>
          </li>

          <li className={styles.module}>
            <span className={`meta ${styles.moduleNo}`}>03 / Round management</span>

            <h2 className={styles.moduleName}>Submissions &amp; reviews</h2>

            <p className={styles.moduleBody}>
              Manage round deadlines, project submissions, reviews and evaluation results.
            </p>

            <span className={styles.status}>Database setup required</span>
          </li>
        </ul>

        <p className={styles.notice}>
          Administrator access is verified through Supabase. Registration, team and
          evaluation management will become available as their database modules are
          implemented.
        </p>
      </div>
    </section>
  );
}
