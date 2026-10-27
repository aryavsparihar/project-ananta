import type { Metadata } from 'next';
import { PageHead } from '@/components/PageHead';
import { ContestBoard } from '@/components/portal/ContestBoard';
import { getSiteContent } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Contest',
  description: 'The teams building in ANANTA, their members and where they stand.',
  robots: { index: false, follow: false },
};

export default async function Contest() {
  const { portal } = await getSiteContent();

  return (
    <>
      <PageHead
        label="The contest"
        title={
          <>
            The teams
            <br />
            <em>on the board.</em>
          </>
        }
        lead="Every team, who is on it and what they are building. Updated by the organisers as the rounds go."
      />
      <section className="section" aria-label="Teams">
        <div className="shell">
          <ContestBoard emptyNote={portal.contestNote} />
        </div>
      </section>
    </>
  );
}
