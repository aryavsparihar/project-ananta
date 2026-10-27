'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { friendlyError, type MyRegistration } from '@/lib/portal';
import styles from './Portal.module.css';

type MyTeam = {
  role: string;
  contest_teams: { code: string; name: string; project_title: string | null } | null;
};

const ROLE_LABEL: Record<string, string> = {
  lead: 'Team lead',
  developer: 'Developer',
  mentor: 'Student mentor',
};

export function AccountView({ contactEmail }: { contactEmail: string }) {
  const [email, setEmail] = useState('');
  const [registration, setRegistration] = useState<MyRegistration | null>(null);
  const [team, setTeam] = useState<MyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          window.location.replace('/login?next=/account');
          return;
        }
        const { data: mine, error: regError } = await supabase.rpc('my_registration');
        if (regError) throw regError;

        let myTeam: MyTeam | null = null;
        if (mine) {
          // Only published teams are readable, so this stays empty until the
          // organisers announce them.
          const { data } = await supabase
            .from('contest_team_members')
            .select('role, contest_teams(code, name, project_title)')
            .eq('registration_id', (mine as MyRegistration).id)
            .maybeSingle();
          myTeam = (data as MyTeam | null) ?? null;
        }

        if (cancelled) return;
        setEmail(user.email ?? '');
        setRegistration((mine as MyRegistration | null) ?? null);
        setTeam(myTeam);
      } catch (err) {
        if (!cancelled) setError(friendlyError(err, 'Could not load your account.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    window.location.assign('/');
  }

  if (loading) return <p className={styles.message}>Loading your account…</p>;

  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.panels}>
        <section className={styles.panel} aria-labelledby="entry-title">
          <span className={`${styles.status} ${registration ? styles.statusDone : ''}`}>
            {registration ? 'Registered' : 'Not registered yet'}
          </span>
          <h2 id="entry-title">Your entry</h2>
          {registration ? (
            <p>
              {registration.full_name}, {registration.year_of_study} year,{' '}
              {registration.department}.
            </p>
          ) : (
            <p>
              Fill in the registration form to enter ANANTA. It takes about five minutes.
            </p>
          )}
          <div className={styles.actions}>
            <Link href="/register/form" className={styles.button}>
              {registration ? 'View or edit my entry' : 'Fill the form'}
            </Link>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="team-title">
          <h2 id="team-title">Your team</h2>
          {team?.contest_teams ? (
            <>
              <p>
                <strong>{team.contest_teams.name}</strong> ({team.contest_teams.code})
                {team.contest_teams.project_title
                  ? `, building ${team.contest_teams.project_title}`
                  : ''}
                .
              </p>
              <p className={styles.hint}>
                Your role: {ROLE_LABEL[team.role] ?? team.role}
              </p>
              <div className={styles.actions}>
                <Link href="/contest" className={styles.ghost}>
                  See every team
                </Link>
              </div>
            </>
          ) : (
            <p className={styles.hint}>
              Not announced yet. The organisers form the teams once registration closes;
              yours will show here and on the contest page.
            </p>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="links-title">
          <h2 id="links-title">The event</h2>
          <div className={styles.actions}>
            <Link href="/problems" className={styles.ghost}>
              Problem statements
            </Link>
            <Link href="/contest" className={styles.ghost}>
              Contest
            </Link>
            <Link href="/journey" className={styles.ghost}>
              Rounds
            </Link>
          </div>
          <p className={styles.hint}>
            Questions? Write to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </p>
        </section>

        <section className={styles.panel} aria-labelledby="account-title">
          <h2 id="account-title">Account</h2>
          <dl className={styles.facts}>
            <div>
              <dt>Signed in as</dt>
              <dd>{email}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <Link href="/account/password" className={styles.ghost}>
              Change password
            </Link>
            <button type="button" className={styles.ghost} onClick={signOut}>
              Sign out
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
