import type { Metadata } from 'next';
import { RegistrationForm } from '@/components/portal/RegistrationForm';
import styles from '@/components/portal/Portal.module.css';
import { getSiteContent } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Registration form',
  robots: { index: false, follow: false },
};

export default async function RegisterForm() {
  const { portal, registration, contact } = await getSiteContent();

  return (
    <section className={styles.wrap}>
      <div className={styles.wide}>
        <h1 className={styles.title}>
          Your <em>entry.</em>
        </h1>
        <p className={styles.intro}>
          Everyone registers individually; the organisers form the teams. Fields marked *
          are required. Closes {registration.closesDisplayFull}.
        </p>
        <RegistrationForm
          formOpen={portal.formOpen}
          closesAt={registration.closesAt}
          closesLabel={registration.closesDisplayFull}
          contactEmail={contact.email}
        />
      </div>
    </section>
  );
}
