import type { Metadata } from 'next';
import { AccountView } from '@/components/portal/AccountView';
import styles from '@/components/portal/Portal.module.css';
import { getSiteContent } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

export default async function Account() {
  const { contact } = await getSiteContent();

  return (
    <section className={styles.wrap}>
      <div className={styles.wide}>
        <h1 className={styles.title}>
          Your <em>desk.</em>
        </h1>
        <AccountView contactEmail={contact.email} />
      </div>
    </section>
  );
}
