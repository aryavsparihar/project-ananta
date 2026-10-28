import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignupForm } from '@/components/portal/SignupForm';
import styles from '@/components/portal/Portal.module.css';
import { getSiteContent } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Create your account',
  description:
    'Create an ANANTA account with your university email, then fill the registration form.',
  alternates: { canonical: '/signup' },
};

export default async function Signup() {
  const { portal } = await getSiteContent();

  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          Create your <em>account.</em>
        </h1>
        <p className={styles.intro}>
          One account per person. Confirm your email, and the registration form is next.
        </p>
        <Suspense fallback={null}>
          <SignupForm domains={portal.allowedEmailDomains} />
        </Suspense>
      </div>
    </section>
  );
}
