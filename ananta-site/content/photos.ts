/**
 * Captions and alt text for the treated event photos.
 *
 * Keyed by the slug in scripts/photo-manifest.mjs, which decides how each
 * photo is cropped and duotoned. Captions are short, factual and in mono -
 * they say what the photograph is, nothing more.
 *
 * These are real photographs of real events. Do not write a caption that
 * claims anything the photo does not show.
 */

export type Club = 'sangam' | 'devgrowth' | 'codeclub' | 'smvdu';

export type Photo = {
  slug: string;
  /** Mono caption under the cutout. */
  caption: string;
  /** Alt text: what a person who cannot see it needs to know. */
  alt: string;
  club: Club;
};

export const PHOTOS: Record<string, Photo> = {
  'sangam-launch': {
    slug: 'sangam-launch',
    caption: 'SANGAM launch · 200+ in the room',
    alt: 'A packed lecture hall at the SANGAM launch, most of the audience with their hands raised.',
    club: 'sangam',
  },
  'ai-stack': {
    slug: 'ai-stack',
    caption: 'The AI Stack · Code Club',
    alt: 'A speaker at a whiteboard presenting The AI Stack session run by Code Club.',
    club: 'codeclub',
  },
  'pyverse-hands': {
    slug: 'pyverse-hands',
    caption: 'PyVerse bootcamp · hands on keyboards',
    alt: "Students working at laptops during DevGrowth's PyVerse bootcamp.",
    club: 'devgrowth',
  },
  'pyverse-group': {
    slug: 'pyverse-group',
    caption: 'PyVerse bootcamp',
    alt: "Group photograph of the participants in DevGrowth's PyVerse bootcamp.",
    club: 'devgrowth',
  },
  'battle-code': {
    slug: 'battle-code',
    caption: 'Budhwar Battle Code',
    alt: 'Participants of Budhwar Battle Code lined up on stage.',
    club: 'codeclub',
  },
  'sih-demo': {
    slug: 'sih-demo',
    caption: 'SIH 2025 · demo',
    alt: 'A team demonstrating their project at Smart India Hackathon 2025.',
    club: 'smvdu',
  },
  'sih-team': {
    slug: 'sih-team',
    caption: 'SIH 2025',
    alt: 'A team photographed at Smart India Hackathon 2025.',
    club: 'smvdu',
  },
  ekatva: {
    slug: 'ekatva',
    caption: "EKATVA '26",
    alt: "Winners holding their certificates at EKATVA '26.",
    club: 'smvdu',
  },
  'sangam-launch-stage': {
    slug: 'sangam-launch-stage',
    caption: 'SANGAM launch',
    alt: 'A speaker beside a screen showing the SANGAM logo at the community launch.',
    club: 'sangam',
  },
};

export const photo = (slug: string): Photo => {
  const p = PHOTOS[slug];
  if (!p) throw new Error(`Unknown photo slug: ${slug}`);
  return p;
};
