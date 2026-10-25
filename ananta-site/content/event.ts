/**
 * The event facts, in one place.
 *
 * Pages import from here. Never retype a date, a mark or an attribution line
 * into a component - change it here and every page follows.
 */

export const EVENT = {
  name: 'ANANTA',
  devanagari: 'अनन्त',
  meaning: 'endless',
  tagline: "Don't pitch it. Ship it.",
  blurb: 'A six-week, project-based hackathon. Every team ships one live product.',

  /** Presented by, in order. Used for the credits block and metadata. */
  presenters: ['SANGAM', 'DevGrowth', 'Code Club'] as const,
  school: 'School of CSE, SMVDU Katra',
  association: 'in association with the Board of Professional Activities',
  place: 'Katra, J&K',

  starts: '2026-10-23',
  ends: '2026-12-04',
  displayRange: '23 October to 4 December 2026',
  year: 2026,
} as const;

export const REGISTRATION = {
  opens: '2026-10-23',
  closes: '2026-11-04',
  displayRange: '23 Oct to 4 Nov',
  /** Rendered forms of `closes`, so pages never re-derive a date from a string. */
  closesDisplay: '4 November',
  closesDisplayShort: '4 Nov',
  closesDisplayFull: '4 November 2026, 23:59 IST',
  teamsAnnouncedBy: '5 November',

  /** The instant the countdown runs to. Confirmed by the organisers. */
  closesAt: '2026-11-04T23:59:00+05:30',
} as const;

export type Round = {
  id: string;
  /** Short hash shown in the build log. Stable, decorative, not a real commit. */
  hash: string;
  n: string;
  name: string;
  deliverable: string;
  start: string;
  end: string;
  dateLabel: string;
  marks: number | null;
  onCampus: boolean;
  /** Only stated where the organisers have stated it. */
  mode: string | null;
  summary: string;
  criteria: string[];
};

/**
 * The four rounds plus the build window.
 *
 * The build window carries no marks and is not a round - it is the stretch
 * between the UI/UX review and the on-campus review. It is listed here because
 * leaving it out makes the timeline jump from 18 Nov to 25 Nov with no
 * explanation.
 */
export const ROUNDS: Round[] = [
  {
    id: 'ideation',
    hash: 'a1d3f09',
    n: '01',
    name: 'Ideation',
    deliverable: 'PPT submission',
    start: '2026-11-06',
    end: '2026-11-12',
    dateLabel: '6–12 Nov',
    marks: 20,
    onCampus: false,
    mode: 'Online',
    summary: 'Define the problem and show the solution can be built.',
    criteria: [
      'Problem statement and originality',
      'Architecture, schema, workflow and stack rationale',
      'Feasible plan and clear role division',
    ],
  },
  {
    id: 'uiux',
    hash: '7c4e2b1',
    n: '02',
    name: 'UI / UX',
    deliverable: 'Figma or Adobe XD prototype',
    start: '2026-11-13',
    end: '2026-11-18',
    dateLabel: '13–18 Nov',
    marks: 20,
    onCampus: false,
    mode: null,
    summary: 'Turn the plan into something testable before the code is finished.',
    criteria: [
      'Visual design and usability',
      'Complete user flow',
      'Clickable prototype',
    ],
  },
  {
    id: 'build',
    hash: '0b9a5fd',
    n: '--',
    name: 'Build window',
    deliverable: 'No submission',
    start: '2026-11-19',
    end: '2026-11-24',
    dateLabel: '19–24 Nov',
    marks: null,
    onCampus: false,
    mode: null,
    summary: 'Six days to build. Nothing is due and nothing is marked.',
    criteria: [],
  },
  {
    id: 'review',
    hash: 'e58c7a3',
    n: '03',
    name: 'Hands-on review',
    deliverable: 'Working build, full team present',
    start: '2026-11-25',
    end: '2026-11-25',
    dateLabel: '25 Nov',
    marks: 30,
    onCampus: true,
    mode: 'On campus',
    summary: 'Bring the working build. This round eliminates.',
    criteria: [
      'Functionality and completeness',
      'Code quality and integration',
      'Deployment and documentation',
    ],
  },
  {
    id: 'final',
    hash: 'f20d816',
    n: '04',
    name: 'The final',
    deliverable: 'Live demo',
    start: '2026-12-04',
    end: '2026-12-04',
    dateLabel: '4 Dec',
    marks: 30,
    onCampus: true,
    mode: 'On campus',
    summary: 'Put the live product in front of the jury.',
    criteria: [
      'Live product demonstration',
      'Impact and usefulness',
      'Presentation and questions',
    ],
  },
];

export const PRIZES = {
  poolLabel: '₹10,000',
  pool: 10000,
  places: [
    { place: '1st', amount: '₹5,000' },
    { place: '2nd', amount: '₹3,000' },
    { place: '3rd', amount: '₹2,000' },
  ],
  certificates: 50,
} as const;

export const TEAM_RULES = [
  {
    n: '01',
    title: 'Who is on a team',
    body: 'A 3rd-year team lead, 1st- and 2nd-year developers, a 4th-year student mentor and a faculty mentor.',
  },
  {
    n: '02',
    title: 'At least one woman per team',
    body: 'Every team must include at least one woman.',
  },
  {
    n: '03',
    title: 'The git history is audited',
    body: 'Work must be original and done inside the event window. Commit history and commit authenticity are checked.',
  },
  {
    n: '04',
    title: 'Deploy it',
    body: 'The product must be deployed and publicly reachable so the jury can use the real thing.',
  },
  {
    n: '05',
    title: 'Be ready to explain it',
    body: 'At every round, be ready to talk through the design, architecture, implementation and the decisions behind them.',
  },
] as const;

/**
 * The organisers' Google Form. NEXT_PUBLIC_REGISTRATION_URL overrides it, so a
 * replacement form needs no code change. public/register-qr.svg encodes this
 * same URL: regenerate it if the form changes (see the root README).
 */
const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeDYTTzawslLVx6se_leJ91Y6uZSzkkuN5uyFLag9rwdoCPlQ/viewform';

// The old .env.example shipped a placeholder for this variable, so an older
// .env.local (or a host dashboard) can still carry it. Treat that as unset
// rather than publishing a dead button.
const envUrl = process.env.NEXT_PUBLIC_REGISTRATION_URL?.trim();

export const REGISTRATION_URL =
  envUrl && !envUrl.includes('REPLACE_WITH') ? envUrl : FORM_URL;

/** "SANGAM × DevGrowth × Code Club" */
export const PRESENTED_BY = EVENT.presenters.join(' × ');

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ananta.smvdu.ac.in';
