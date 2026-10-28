import styles from './PageHead.module.css';

/**
 * The masthead every inner page opens with: the display title and an optional lead.
 *
 * Deliberately not numbered. The old build labelled these "01—04", "02—04"
 * and so on, which implied an order the pages do not have.
 */
export function PageHead({
  title,
  lead,
  children,
}: {
  title: React.ReactNode;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className={styles.head}>
      <div className="shell">
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className={`lead ${styles.lead}`}>{lead}</p>}
        {children}
      </div>
    </header>
  );
}
