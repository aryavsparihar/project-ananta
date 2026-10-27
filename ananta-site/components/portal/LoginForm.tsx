'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { friendlyError, safeNext } from '@/lib/portal';
import styles from './Portal.module.css';

const NOTICES: Record<string, string> = {
  confirmed: 'Your email is confirmed. Sign in to continue.',
  reset: 'Your password has been changed. Sign in with the new one.',
  link: 'That link has expired or was already used. Sign in, or ask for a new link.',
  config: 'Sign-in is temporarily unavailable. Please try again shortly.',
};

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const notice =
    NOTICES[params.get('error') ?? ''] ??
    (params.get('confirmed')
      ? NOTICES.confirmed
      : params.get('reset')
        ? NOTICES.reset
        : '');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      // A full navigation, so the middleware sees the new session cookie.
      window.location.assign(next);
    } catch (err) {
      setError(friendlyError(err, 'Could not sign in.'));
      setLoading(false);
    }
  }

  const withNext = (path: string) =>
    next === '/account' ? path : `${path}?next=${encodeURIComponent(next)}`;

  return (
    <>
      {notice && (
        <p className={styles.message} role="status">
          {notice}
        </p>
      )}

      <form onSubmit={signIn} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.submit} disabled={loading} type="submit">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className={styles.after}>
        <p>
          New here? <Link href={withNext('/signup')}>Create your account</Link>
        </p>
        <p>
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
    </>
  );
}
