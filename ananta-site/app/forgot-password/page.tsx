import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/portal/PasswordForms';
import styles from '@/components/portal/Portal.module.css';

export const metadata: Metadata = {
  title: 'Reset your password',
  robots: { index: false, follow: false },
};

export default function ForgotPassword() {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <p className={`meta ${styles.label}`}>ANANTA / Participants</p>
        <h1 className={styles.title}>
          Forgot your <em>password?</em>
        </h1>
        <p className={styles.intro}>
          Enter the email you signed up with and we will send a link to set a new one.
        </p>
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
