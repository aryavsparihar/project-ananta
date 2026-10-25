/**
 * Captions and alt text for the treated event photos.
 *
 * Keyed by the slug in scripts/photo-manifest.mjs, which decides how each
 * photo is cropped and duotoned. Captions are short, factual sentences in the
 * serif italic: they say what the photograph is, nothing more.
 *
 * These are real photographs of real events. Do not write a caption that
 * claims anything the photo does not show.
 */

export type Club = 'sangam' | 'devgrowth' | 'codeclub' | 'smvdu' | 'null' | 'aiml';

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
    caption: 'The SANGAM launch, with 200+ in the room.',
    alt: 'A packed lecture hall at the SANGAM launch, most of the audience with their hands raised.',
    club: 'sangam',
  },
  'ai-stack': {
    slug: 'ai-stack',
    caption: 'The AI Stack session.',
    alt: 'A speaker at a whiteboard presenting The AI Stack session run by Code Club.',
    club: 'codeclub',
  },
  'pyverse-hands': {
    slug: 'pyverse-hands',
    caption: 'Hands on keyboards at the PyVerse bootcamp.',
    alt: "Students working at laptops during DevGrowth's PyVerse bootcamp.",
    club: 'devgrowth',
  },
  'pyverse-group': {
    slug: 'pyverse-group',
    caption: 'The PyVerse bootcamp cohort.',
    alt: "Group photograph of the participants in DevGrowth's PyVerse bootcamp.",
    club: 'devgrowth',
  },
  'battle-code': {
    slug: 'battle-code',
    caption: 'Budhwar Battle Code, on stage.',
    alt: 'Participants of Budhwar Battle Code lined up on stage.',
    club: 'codeclub',
  },
  'sih-demo': {
    slug: 'sih-demo',
    caption: 'A team demo at SIH 2025.',
    alt: 'A team demonstrating their project at Smart India Hackathon 2025.',
    club: 'smvdu',
  },
  'sih-team': {
    slug: 'sih-team',
    caption: 'A team at SIH 2025.',
    alt: 'A team photographed at Smart India Hackathon 2025.',
    club: 'smvdu',
  },
  ekatva: {
    slug: 'ekatva',
    caption: 'Winners at EKATVA ’26.',
    alt: "Winners holding their certificates at EKATVA '26.",
    club: 'smvdu',
  },
  'sangam-launch-stage': {
    slug: 'sangam-launch-stage',
    caption: 'On stage at the SANGAM launch.',
    alt: 'A speaker beside a screen showing the SANGAM logo at the community launch.',
    club: 'sangam',
  },
  'imc-2024': {
    slug: 'imc-2024',
    caption: 'DevGrowth at India Mobile Congress 2024, New Delhi.',
    alt: 'A group of SMVDU students in front of the India Mobile Congress 2024 stage in New Delhi.',
    club: 'devgrowth',
  },
  'ibs-2024': {
    slug: 'ibs-2024',
    caption: 'The floor at India Blockchain Summit 2024.',
    alt: 'The main hall of India Blockchain Summit 2024, rows of seats facing a lit stage.',
    club: 'devgrowth',
  },
  'udyamitsav-26-win': {
    slug: 'udyamitsav-26-win',
    caption: 'First place, CXO Roundtable, Udyamitsav 2026.',
    alt: 'SMVDU students on stage at IIT Jammu holding the winners’ cheque for the CXO Roundtable at Udyamitsav 2026.',
    club: 'sangam',
  },
  'udyamitsav-25': {
    slug: 'udyamitsav-25',
    caption: 'On stage at Udyamitsav ’25, IIT Jammu.',
    alt: 'SMVDU students lined up on stage with organisers at Udyamitsav 2025, IIT Jammu.',
    club: 'sangam',
  },
  'codeforge-25': {
    slug: 'codeforge-25',
    caption: 'A prize handed over at CodeForge SMVDU-25.',
    alt: 'A student receiving a memento from a faculty member at the CodeForge SMVDU-25 hackathon.',
    club: 'devgrowth',
  },
  'avalanche-25': {
    slug: 'avalanche-25',
    caption: 'After the Avalanche tech talk, 2025.',
    alt: 'Students and speakers lined up in front of the screen after DevGrowth’s Avalanche tech talk in 2025.',
    club: 'devgrowth',
  },
  'linux-git-26': {
    slug: 'linux-git-26',
    caption: 'The Linux and Git workshop, 2026.',
    alt: 'A full lecture hall group photo after DevGrowth’s Linux and Git workshop in 2026.',
    club: 'devgrowth',
  },
  'java-25': {
    slug: 'java-25',
    caption: 'The Java workshop, 2025.',
    alt: 'Students standing together in a lab after DevGrowth’s Java workshop in 2025.',
    club: 'devgrowth',
  },
  'devgrowth-workshop': {
    slug: 'devgrowth-workshop',
    caption: 'A DevGrowth workshop, full house.',
    alt: 'Students in rows facing the camera at a DevGrowth workshop, the club logo on the screen behind them.',
    club: 'devgrowth',
  },
  'codeclub-session': {
    slug: 'codeclub-session',
    caption: 'A Code Club session in the lecture hall.',
    alt: 'A packed lecture hall during a Code Club session, a speaker at the front.',
    club: 'codeclub',
  },
  'null-ethical-hacking': {
    slug: 'null-ethical-hacking',
    caption: 'After the ethical hacking workshop.',
    alt: 'A large group of students outside after NULL’s ethical hacking workshop.',
    club: 'null',
  },
  'null-ctf': {
    slug: 'null-ctf',
    caption: 'A NULL capture-the-flag round.',
    alt: 'Students at laptops around a seminar table during a NULL capture-the-flag round.',
    club: 'null',
  },
  'null-workshop': {
    slug: 'null-workshop',
    caption: 'A NULL workshop group.',
    alt: 'Students lined up in front of a projector screen after a NULL workshop.',
    club: 'null',
  },
  'aiml-awareness': {
    slug: 'aiml-awareness',
    caption: 'The AI & ML awareness session.',
    alt: 'A group of students on a stage after the AI & ML Club’s awareness session.',
    club: 'aiml',
  },
  'aiml-hackaithon': {
    slug: 'aiml-hackaithon',
    caption: 'HackAIthon: 15 teams, one room.',
    alt: 'Participants of the AI & ML Club’s HackAIthon standing together in a classroom.',
    club: 'aiml',
  },
};

export const photo = (slug: string): Photo => {
  const p = PHOTOS[slug];
  if (!p) throw new Error(`Unknown photo slug: ${slug}`);
  return p;
};
