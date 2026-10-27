'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { friendlyError } from '@/lib/portal';
import styles from './Portal.module.css';

/** Step one: email a reset link. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/confirm?next=/account/password`,
        },
      );
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(friendlyError(err, 'Could not send the reset email.'));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className={`${styles.success} ${styles.form}`} role="status">
        If an account uses {email.trim()}, a reset link is on its way. Open it on this
        device to choose a new password.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={send} className={styles.form}>
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
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button className={styles.submit} disabled={loading} type="submit">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <div className={styles.after}>
        <p>
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </>
  );
}

/** Step two, signed in through the link: set the new password. */
export function NewPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.assign('/login?reset=1');
    } catch (err) {
      setError(friendlyError(err, 'Could not change the password.'));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>New password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Confirm new password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.submit} disabled={loading} type="submit">
        {loading ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
