import type { Metadata } from 'next';
import { NewPasswordForm } from '@/components/portal/PasswordForms';
import styles from '@/components/portal/Portal.module.css';

export const metadata: Metadata = {
  title: 'Change password',
  robots: { index: false, follow: false },
};

export default function ChangePassword() {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <p className={`meta ${styles.label}`}>ANANTA / Account</p>
        <h1 className={styles.title}>
          New <em>password.</em>
        </h1>
        <p className={styles.intro}>
          Choose a new password. You will be asked to sign in again with it.
        </p>
        <NewPasswordForm />
      </div>
    </section>
  );
}
