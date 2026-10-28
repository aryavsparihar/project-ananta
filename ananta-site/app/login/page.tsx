import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/portal/LoginForm';
import styles from '@/components/portal/Portal.module.css';

export const metadata: Metadata = {
  title: 'Sign in',
  description:
    'Sign in to register for ANANTA, see the problem statements and your team.',
  alternates: { canonical: '/login' },
};

export default function Login() {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          Sign <em>in.</em>
        </h1>
        <p className={styles.intro}>
          Your account holds your registration, the problem statements and, once teams are
          announced, your team.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
