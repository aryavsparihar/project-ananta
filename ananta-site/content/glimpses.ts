/**
 * What the clubs behind ANANTA have already done.
 *
 * Every line here comes from a source listed in SOURCES: the clubs' own decks,
 * the university's news pages, a club's LinkedIn page or a club's GitHub. If a
 * number or a result is not in a source, it does not go on the page. Where two
 * sources disagree (the IMC trip: the deck says 50 students, the university's
 * article says 27), the number is left out.
 */
import type { Club } from './photos';

export type SourceId =
  | 'sangam-deck'
  | 'sponsor-deck'
  | 'smvdu-udyamitsav'
  | 'smvdu-sih26'
  | 'smvdu-sih25'
  | 'smvdu-smart-solutions'
  | 'smvdu-imc'
  | 'smvdu-codeclub'
  | 'devgrowth-linkedin'
  | 'codeclub-gsoc';

export const SOURCES: Record<SourceId, { label: string; href?: string }> = {
  'sangam-deck': { label: 'SANGAM community deck, September 2026' },
  'sponsor-deck': { label: 'ANANTA sponsorship deck, October 2026' },
  'smvdu-udyamitsav': {
    label: 'SMVDU news: first place at the CXO Roundtable, Udyamitsav 2026',
    href: 'https://smvdu.ac.in/2026/02/12/',
  },
  'smvdu-sih26': {
    label: 'SMVDU news: internal hackathon for SIH 2026',
    href: 'https://smvdu.ac.in/?p=46318',
  },
  'smvdu-sih25': {
    label: 'SMVDU news: SoCSE internal hackathon for SIH 2025',
    href: 'https://smvdu.ac.in/smvdu-organizes-internal-hackathon-under-smart-india-hackathon-sih-in-collaboration-with-ieee-student-branch-smvdu/',
  },
  'smvdu-smart-solutions': {
    label: 'SMVDU news: Smart Solutions Exhibition 2.0',
    href: 'https://smvdu.ac.in/smart-solutions-exhibition-2-0-held-at-smvdu/',
  },
  'smvdu-imc': {
    label: 'SMVDU news: students at IMC 2024 and India Blockchain Summit 2024',
    href: 'https://smvdu.ac.in/smvdu-students-visit-the-india-mobile-congress-imc-2024-india-blockchain-summit-ibs-2024/',
  },
  'smvdu-codeclub': {
    label: 'SMVDU: Code Club',
    href: 'https://smvdu.ac.in/code-club/',
  },
  'devgrowth-linkedin': {
    label: 'Dev Growth SMVDU on LinkedIn',
    href: 'https://www.linkedin.com/company/dev-growth-smvdu/',
  },
  'codeclub-gsoc': {
    label: 'Code Club SMVDU: GSoC proposals, year by year',
    href: 'https://github.com/CodeClubSMVDU/gsoc-proposals',
  },
};

/** The headline numbers. Short, checkable, each with its source. */
export type Record_ = {
  figure: string;
  line: string;
  detail: string;
  club: Club;
  source: SourceId;
};

export const RECORDS: Record_[] = [
  {
    figure: '1st',
    line: 'CXO Roundtable, Udyamitsav 2026',
    detail: 'Team PyTensor Byte, second-year CSE, at IIT Jammu on 8 February 2026.',
    club: 'sangam',
    source: 'smvdu-udyamitsav',
  },
  {
    figure: '21',
    line: 'Google Summer of Code selections',
    detail:
      'SMVDU students picked by Mozilla, KDE, VideoLAN, LibreOffice and others, 2017 to 2022. Code Club keeps the record.',
    club: 'codeclub',
    source: 'codeclub-gsoc',
  },
  {
    figure: '150+',
    line: 'at the SIH 2026 internal hackathon',
    detail: 'Two days in LT-3, 24 and 25 August 2026, run by a student team from SANGAM.',
    club: 'sangam',
    source: 'smvdu-sih26',
  },
  {
    figure: '200+',
    line: 'in the room for the SANGAM launch',
    detail:
      'The orientation in LT-1 on 18 September 2026 that brought the clubs together.',
    club: 'sangam',
    source: 'devgrowth-linkedin',
  },
  {
    figure: '114',
    line: 'entries at Smart Solutions Exhibition 2.0',
    detail:
      'More than 70 stalls at EKATVA ’26, with SANGAM members among the student coordinators.',
    club: 'sangam',
    source: 'smvdu-smart-solutions',
  },
  {
    figure: 'ISTE',
    line: 'Best Student Award 2026',
    detail: 'Yash Srivastava, DevGrowth coordinator and SANGAM president, at MIET Jammu.',
    club: 'devgrowth',
    source: 'devgrowth-linkedin',
  },
];

export type ClubEvent = {
  name: string;
  /** As precise as the source is, and no more. */
  when?: string;
  note?: string;
  source: SourceId;
};

export type ClubStory = {
  id: Club;
  name: string;
  blurb: string;
  events: ClubEvent[];
  /** Slugs in content/photos.ts, in the order they are pasted up. */
  photos: string[];
};

export const CLUBS: ClubStory[] = [
  {
    id: 'sangam',
    name: 'SANGAM',
    blurb:
      'The tech community that brings the CSE clubs under one roof, and runs ANANTA.',
    events: [
      {
        name: 'SANGAM orientation and launch',
        when: '18 Sept 2026',
        note: 'LT-1. 200+ students.',
        source: 'devgrowth-linkedin',
      },
      {
        name: 'Internal hackathon for SIH 2026',
        when: '24 and 25 Aug 2026',
        note: 'Student organising team: Shubham Saini, Naresh Kumar, Maneesh Kumar, Mukti Porwal.',
        source: 'smvdu-sih26',
      },
      {
        name: 'First place, CXO Roundtable, Udyamitsav 2026',
        when: '8 Feb 2026',
        note: 'IIT Jammu.',
        source: 'smvdu-udyamitsav',
      },
      {
        name: 'Smart Solutions Exhibition 2.0, EKATVA ’26',
        when: 'March 2026',
        note: '114 entries, 70+ stalls.',
        source: 'smvdu-smart-solutions',
      },
      {
        name: 'CXO Roundtable and Pitchers, Udyamitsav ’25',
        note: 'IIT Jammu.',
        source: 'sangam-deck',
      },
      { name: 'Hacknovate 5.0', when: '2024', note: 'Ghaziabad.', source: 'sangam-deck' },
      { name: 'Agricultural Fair', note: 'SKUAST.', source: 'sangam-deck' },
    ],
    photos: ['sangam-launch', 'udyamitsav-26-win', 'udyamitsav-25'],
  },
  {
    id: 'devgrowth',
    name: 'DevGrowth',
    blurb: 'Learn. Build. Grow. Workshops, bootcamps and hackathons for every year.',
    events: [
      {
        name: 'Git and GitHub, hands on',
        when: '22 Sept 2026',
        source: 'devgrowth-linkedin',
      },
      {
        name: 'DSAx30: The DSA Chronicles',
        when: '5 June to 5 July 2026',
        note: 'Thirty days of problems, first to fourth year.',
        source: 'devgrowth-linkedin',
      },
      {
        name: 'Blockchain workshop',
        note: 'With the P2P community.',
        source: 'devgrowth-linkedin',
      },
      { name: 'Linux and Git workshop', when: '2026', source: 'sangam-deck' },
      { name: 'Avalanche tech talk', when: '2025', source: 'sangam-deck' },
      { name: 'Java workshop', when: '2025', source: 'sangam-deck' },
      { name: 'PyVerse bootcamp', source: 'sponsor-deck' },
      { name: 'CodeForge SMVDU-25 hackathon', source: 'sangam-deck' },
      {
        name: 'India Mobile Congress and India Blockchain Summit',
        when: 'October 2024',
        note: 'New Delhi.',
        source: 'smvdu-imc',
      },
    ],
    photos: ['imc-2024', 'linux-git-26', 'avalanche-25', 'pyverse-hands', 'codeforge-25'],
  },
  {
    id: 'codeclub',
    name: 'Code Club',
    blurb:
      'Code. Create. Collaborate. DSA, competitive programming and the habit of practice.',
    events: [
      {
        name: 'DSA sessions, twice a week',
        note: 'Mondays and Thursdays, 6 pm, COE-206. Running again since 28 August 2023.',
        source: 'smvdu-codeclub',
      },
      { name: 'Budhwar Battle Code', source: 'sponsor-deck' },
      { name: 'The AI Stack, with a live demo', source: 'sponsor-deck' },
      { name: 'Career Essentials, with DevGrowth', source: 'sponsor-deck' },
      {
        name: '21 Google Summer of Code selections',
        when: '2017 to 2022',
        source: 'codeclub-gsoc',
      },
      {
        name: 'Alumni at Google and CRED',
        source: 'smvdu-codeclub',
      },
    ],
    photos: ['codeclub-session', 'battle-code', 'ai-stack'],
  },
  {
    id: 'null',
    name: 'NULL',
    blurb:
      'The SMVDU chapter of NULL, the open security community: ethical hacking, CTFs and secure coding.',
    events: [
      {
        name: 'Ethical hacking workshop',
        note: 'Covered in the local Hindi press.',
        source: 'sangam-deck',
      },
      { name: 'Capture-the-flag rounds', source: 'sangam-deck' },
      { name: 'Workshops on security tooling', source: 'sangam-deck' },
      {
        name: 'Where the team has worked',
        note: 'Product security at SpotDraft, Gurugram Cyber Police, the GPCSSI programme, and research at NSUT Delhi.',
        source: 'sangam-deck',
      },
    ],
    photos: ['null-ethical-hacking', 'null-ctf', 'null-workshop'],
  },
  {
    id: 'aiml',
    name: 'AI & ML Club',
    blurb: 'Machine learning, deep learning and data science, learned by building.',
    events: [
      {
        name: 'HackAIthon',
        note: '15 teams on AI and ML problems.',
        source: 'sangam-deck',
      },
      { name: 'AI & ML awareness session', source: 'sangam-deck' },
    ],
    photos: ['aiml-hackaithon', 'aiml-awareness'],
  },
];
