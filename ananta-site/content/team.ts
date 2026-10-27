/**
 * The people behind ANANTA.
 *
 * These are the shipped defaults. Organisers can override the whole list from
 * /admin/content without a deploy; a photo still has to be committed under
 * public/team first. See "Adding a team member" in the root README.
 *
 * Faculty names, designations and order were confirmed by the organisers. Student
 * names and roles are from the SANGAM deck (25 Sept 2026); where the deck lists
 * one person under two spellings, the organisers confirmed which is right.
 * A production build refuses to run while any `TODO Name` remains:
 * see scripts/check-team.mjs.
 */

export type TeamGroupId = 'faculty' | 'organising-core' | 'devgrowth' | 'codeclub';

export type Club = 'sangam' | 'devgrowth' | 'codeclub' | 'smvdu';

export type Person = {
  name: string;
  role: string;
  group: TeamGroupId;
  club?: Club;
  year?: string;
  /** Faculty only: the school, shown where a student's year would be. */
  school?: string;
  /** Slug of the file in public/team/raw/<slug>.jpg. Omit for an initials card. */
  photo?: string;
  linkedin?: string;
  github?: string;
  /** A personal site. Full URL, https included. */
  website?: string;
};

export type TeamGroup = {
  id: TeamGroupId;
  title: string;
  blurb: string;
  club?: Club;
  /** Faculty are shown larger. */
  featured?: boolean;
};

/** Order matters — this is the order they appear on the page. */
export const GROUPS: TeamGroup[] = [
  {
    id: 'faculty',
    title: 'Faculty',
    blurb: 'SoCSE, SoECE and SoME, SMVDU.',
    club: 'smvdu',
  },
  {
    id: 'organising-core',
    title: 'Organising core',
    blurb: 'SANGAM, the SoCSE tech community.',
    club: 'sangam',
  },
  {
    id: 'devgrowth',
    title: 'DevGrowth',
    blurb: 'Workshops, mentoring and the developer track.',
    club: 'devgrowth',
  },
  {
    id: 'codeclub',
    title: 'Code Club',
    blurb: 'Contests, sessions and the student build community.',
    club: 'codeclub',
  },
];

export const TEAM: Person[] = [
  // --- Faculty — this order is deliberate ------------------------------------
  {
    name: 'Dr. Ankush Raina',
    photo: 'ankush-raina',
    role: 'President, Board of Professional Activities',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoME',
  },
  {
    name: 'Dr. Sunanda',
    photo: 'sunanda',
    role: 'Head of Department, SoCSE',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoCSE',
  },
  {
    name: 'Dr. Sonika Gupta',
    photo: 'sonika-gupta',
    role: 'Faculty Coordinator',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoCSE',
  },
  {
    name: 'Dr. Shashi Bhushan Kotwal',
    photo: 'shashi-bhushan-kotwal',
    role: 'Faculty Coordinator',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoECE',
  },
  {
    name: 'Dr. Swastik Gupta',
    photo: 'swastik-gupta',
    role: 'Faculty Coordinator',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoECE',
  },

  // --- Organising core (SANGAM) --------------------------------------------
  // Everyone here also belongs to a club, so the card carries that club, and
  // their club role is folded into this one. Each person appears once.
  {
    name: 'Yash Srivastava',
    photo: 'yash-srivastava',
    role: 'President · DevGrowth Coordinator',
    group: 'organising-core',
    club: 'devgrowth',
    linkedin: 'https://www.linkedin.com/in/yash-srivastava-46a02a28b/',
  },
  {
    name: 'Sachin Tripathi',
    photo: 'sachin-tripathi',
    role: 'Vice President · DevGrowth Co-Coordinator',
    group: 'organising-core',
    club: 'devgrowth',
    linkedin: 'https://www.linkedin.com/in/sachin-tripathi-2314a6259/',
  },
  {
    name: 'Kartikey Saxena',
    photo: 'kartikey-saxena',
    role: 'Vice President · DevGrowth Co-Coordinator',
    group: 'organising-core',
    club: 'devgrowth',
    linkedin: 'https://www.linkedin.com/in/kartikey-saxena-b16193290/',
  },
  {
    name: 'Maneesh Kumar',
    photo: 'maneesh-kumar',
    role: 'Finance Lead · Code Club Coordinator',
    group: 'organising-core',
    club: 'codeclub',
    linkedin: 'https://www.linkedin.com/in/0aimaneesh/',
  },
  {
    name: 'Shubham Saini',
    photo: 'shubham-saini',
    role: 'Technical Lead',
    group: 'organising-core',
    club: 'devgrowth',
    linkedin: 'https://www.linkedin.com/in/shubham-saini-b76741274/',
  },
  {
    name: 'Mukti Porwal',
    role: 'PR Lead',
    group: 'organising-core',
    club: 'devgrowth',
    photo: 'mukti-porwal',
  },
  {
    name: 'Naresh Kumar',
    photo: 'naresh-kumar',
    role: 'Management Lead',
    group: 'organising-core',
    club: 'devgrowth',
    linkedin: 'https://www.linkedin.com/in/naresh-kumar-6692a3324/',
  },
  {
    name: 'Akshit Raj',
    photo: 'akshit-raj',
    role: 'Co-Management Lead',
    group: 'organising-core',
    club: 'devgrowth',
    linkedin: 'https://www.linkedin.com/in/akshit-raj-59bb34289/',
  },
  {
    name: 'Aryaveer Singh Parihar',
    photo: 'aryaveer-singh-parihar',
    role: 'Outreach and Alumni Lead',
    group: 'organising-core',
    club: 'sangam',
    linkedin: 'https://www.linkedin.com/in/aryavsparihar/',
    github: 'https://github.com/aryavsparihar',
    website: 'https://aryavsparihar.in',
  },

  // --- DevGrowth -----------------------------------------------------------
  {
    name: 'Subham Prasad',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'subham-prasad',
  },
  // The deck gives first names only for the wider team.
  {
    name: 'Srijan',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'srijan',
  },
  {
    name: 'Ankita',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'ankita',
  },
  {
    name: 'Astha',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'astha',
  },
  {
    name: 'Rishu',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'rishu',
  },
  {
    name: 'Sneha',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'sneha',
  },
  {
    name: 'Prince',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'prince',
  },
  {
    name: 'Shailja',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'shailja',
  },
  {
    name: 'Armaan',
    role: 'Core Team',
    group: 'devgrowth',
    club: 'devgrowth',
    photo: 'armaan',
  },

  // --- Code Club -----------------------------------------------------------
  {
    name: 'Tejas Singh',
    role: 'Core Team',
    group: 'codeclub',
    club: 'codeclub',
    photo: 'tejas-singh',
    linkedin: 'https://www.linkedin.com/in/tejas-singh-4695a1386/',
    github: 'https://github.com/tejas-singh-0212',
  },
  {
    name: 'Himanshu Soni',
    role: 'Core Team',
    group: 'codeclub',
    club: 'codeclub',
    photo: 'himanshu-soni',
  },
  {
    name: 'Kushagra Pandey',
    role: 'Core Team',
    group: 'codeclub',
    club: 'codeclub',
    photo: 'kushagra-pandey',
  },
  {
    name: 'Nandita Gupta',
    role: 'Core Team',
    group: 'codeclub',
    club: 'codeclub',
    photo: 'nandita-gupta',
  },
  {
    name: 'Shivali Virdi',
    role: 'Core Team',
    group: 'codeclub',
    club: 'codeclub',
    photo: 'shivali-virdi',
  },
  {
    name: 'Manthan Gupta',
    role: 'Core Team',
    group: 'codeclub',
    club: 'codeclub',
    photo: 'manthan-gupta',
  },
];

/** True while a row is still a placeholder. */
export const isPlaceholder = (p: Person) =>
  p.name.trim().toUpperCase().startsWith('TODO');

export const peopleIn = (group: TeamGroupId) => TEAM.filter((p) => p.group === group);

export const placeholders = () => TEAM.filter(isPlaceholder);

/** Honorifics are not part of anyone's initials. */
const TITLES = /^(dr|prof|mr|ms|mrs)\.?$/i;

/** "Asha Rani" -> "AR", "Dr. Asha Rani" -> "AR". Placeholders say so rather than showing "TN". */
export function initials(name: string): string {
  if (isPlaceholder({ name } as Person)) return 'TBC';
  return name
    .split(/\s+/)
    .filter((w) => w && !TITLES.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
