'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { emailAllowed, friendlyError, safeNext } from '@/lib/portal';
import styles from './Portal.module.css';

const MIN_PASSWORD = 8;

export function SignupForm({ domains }: { domains: readonly string[] }) {
  const params = useSearchParams();
  const next = safeNext(params.get('next'), '/register/form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [resent, setResent] = useState(false);

  const domainHint = domains.length
    ? `Use your university address (${domains.map((d) => `@${d}`).join(' or ')}).`
    : 'Use an address you check: the confirmation link goes there.';

  const redirectTo = () =>
    `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;

  async function signUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const address = email.trim().toLowerCase();

    if (!emailAllowed(address, domains)) {
      setError(domainHint);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for the password.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createClient().auth.signUp({
        email: address,
        password,
        options: { emailRedirectTo: redirectTo() },
      });
      if (error) throw error;
      // Supabase answers an existing address with a user that has no
      // identities, rather than an error, so addresses cannot be probed.
      if (data.user && data.user.identities?.length === 0) {
        setError('An account with this email already exists. Sign in instead.');
        return;
      }
      setSentTo(address);
    } catch (err) {
      setError(friendlyError(err, 'Could not create the account.'));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError('');
    try {
      const { error } = await createClient().auth.resend({
        type: 'signup',
        email: sentTo,
        options: { emailRedirectTo: redirectTo() },
      });
      if (error) throw error;
      setResent(true);
    } catch (err) {
      setError(friendlyError(err, 'Could not resend the email.'));
    }
  }

  if (sentTo) {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          Check your inbox at <strong>{sentTo}</strong>. Open the link in that email to
          confirm your account; it brings you straight to the registration form.
        </p>
        <p className={styles.hint}>
          Nothing after a few minutes? Look in spam or promotions, then resend.
        </p>
        <p>
          <button
            type="button"
            className={styles.ghost}
            onClick={resend}
            disabled={resent}
          >
            {resent ? 'Sent again' : 'Resend the email'}
          </button>
        </p>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <form onSubmit={signUp} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>University email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            aria-describedby="email-hint"
          />
          <span id="email-hint" className={styles.hint}>
            {domainHint}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Confirm password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.submit} disabled={loading} type="submit">
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className={styles.after}>
        <p>
          Already have an account?{' '}
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </p>
      </div>
    </>
  );
}
