'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import styles from './admin.module.css';

export default function Admin() {
  return (
    <Suspense fallback={null}>
      <AdminSignIn />
    </Suspense>
  );
}

function AdminSignIn() {
  const params = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('access') === 'denied') {
      setMessage('This account does not have an active ANANTA admin role.');
    } else if (params.get('error') === 'config') {
      setMessage(
        'Admin access is temporarily unavailable. Please contact the administrator.',
      );
    } else if (params.get('login')) {
      setMessage('Sign in with the administrator account approved for this site.');
    }
  }, [params]);

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      window.location.assign('/admin/dashboard');
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Check your configuration.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <p className={`meta ${styles.label}`}>ANANTA / Organisers</p>

        <h1 className={styles.title}>
          Admin <em>access.</em>
        </h1>

        <p className={styles.intro}>
          This area is restricted to the approved organiser accounts.
        </p>

        <form onSubmit={signIn} className={styles.form}>
          <label className={styles.field}>
            <span className="meta">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className={styles.field}>
            <span className="meta">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button className={styles.submit} disabled={loading} type="submit">
            {loading ? 'Checking…' : 'Sign in'}
          </button>
        </form>

        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
