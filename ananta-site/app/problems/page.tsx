import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { ProblemStatements } from '@/components/portal/ProblemStatements';
import { getSiteContent } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Problem statements',
  description: 'The problem statements for ANANTA.',
  robots: { index: false, follow: false },
};

export default async function Problems() {
  const { portal } = await getSiteContent();

  return (
    <>
      <PageHead
        label="Problem statements"
        title={
          <>
            Pick a problem
            <br />
            <em>worth a product.</em>
          </>
        }
      />
      <section className="section" aria-label="Problem statements">
        <div className="shell">
          <ProblemStatements note={portal.problemsNote} />
        </div>
      </section>
    </>
  );
}
