/**
 * The people behind ANANTA.
 *
 * Static on purpose — no database, no Supabase. Editing this file is the whole
 * job of adding someone. See "Adding a team member" in the root README.
 *
 * Faculty names, designations and order were confirmed by Aryaveer. Student
 * names and roles are taken verbatim from the SANGAM deck (25 Sept 2026).
 * A production build refuses to run while any `TODO Name` remains:
 * see scripts/check-team.mjs.
 */

export type TeamGroupId =
  'faculty' | 'organising-core' | 'devgrowth' | 'codeclub' | 'web';

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
    blurb: 'SMVDU.',
    club: 'smvdu',
    featured: true,
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
  {
    id: 'web',
    title: 'Website & design',
    blurb: 'This site.',
    club: 'sangam',
  },
];

export const TEAM: Person[] = [
  // --- Faculty — this order is deliberate ------------------------------------
  {
    name: 'Dr. Ankush Raina',
    role: 'President, Board of Professional Activities',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoME',
  },
  {
    name: 'Dr. Sunanda',
    role: 'Head of Department, SoCSE',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoCSE',
  },
  {
    name: 'Dr. Sonika Gupta',
    role: 'Faculty Coordinator',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoCSE',
  },
  {
    name: 'Dr. Shashi Bhushan Kotwal',
    role: 'Faculty Coordinator',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoECE',
  },
  {
    name: 'Dr. Swastik Gupta',
    role: 'Faculty Coordinator',
    group: 'faculty',
    club: 'smvdu',
    school: 'SoECE',
  },

  // --- Organising core (SANGAM) --------------------------------------------
  {
    name: 'Yash Srivastava',
    role: 'President',
    group: 'organising-core',
    club: 'sangam',
  },
  {
    name: 'Sachin Tripathi',
    role: 'Vice President',
    group: 'organising-core',
    club: 'sangam',
  },
  {
    name: 'Kartikey Saxena',
    role: 'Vice President',
    group: 'organising-core',
    club: 'sangam',
  },
  {
    name: 'Shubham Saini',
    role: 'Technical Lead',
    group: 'organising-core',
    club: 'sangam',
  },
  {
    name: 'Maneesh Attri',
    role: 'Finance Lead',
    group: 'organising-core',
    club: 'sangam',
  },
  { name: 'Mukti Porwal', role: 'PR Lead', group: 'organising-core', club: 'sangam' },
  {
    name: 'Naresh Kumar',
    role: 'Management Lead',
    group: 'organising-core',
    club: 'sangam',
  },
  {
    name: 'Akshit Kumar',
    role: 'Co-Management Lead',
    group: 'organising-core',
    club: 'sangam',
  },

  // --- DevGrowth -----------------------------------------------------------
  { name: 'Yash Srivastava', role: 'Coordinator', group: 'devgrowth', club: 'devgrowth' },
  {
    name: 'Kartikey Saxena',
    role: 'Co-Coordinator',
    group: 'devgrowth',
    club: 'devgrowth',
  },
  {
    name: 'Sachin Tripathi',
    role: 'Co-Coordinator',
    group: 'devgrowth',
    club: 'devgrowth',
  },
  { name: 'Naresh Kumar', role: 'Core Team', group: 'devgrowth', club: 'devgrowth' },
  { name: 'Mukti Porwal', role: 'Core Team', group: 'devgrowth', club: 'devgrowth' },
  { name: 'Akshit Raj', role: 'Core Team', group: 'devgrowth', club: 'devgrowth' },
  { name: 'Shubham Saini', role: 'Core Team', group: 'devgrowth', club: 'devgrowth' },
  { name: 'Subham Prasad', role: 'Core Team', group: 'devgrowth', club: 'devgrowth' },

  // --- Code Club -----------------------------------------------------------
  { name: 'Maneesh Kumar', role: 'Coordinator', group: 'codeclub', club: 'codeclub' },
  { name: 'Tejas Singh', role: 'Core Team', group: 'codeclub', club: 'codeclub' },
  { name: 'Himanshu Soni', role: 'Core Team', group: 'codeclub', club: 'codeclub' },
  { name: 'Kushagra Pandey', role: 'Core Team', group: 'codeclub', club: 'codeclub' },
  { name: 'Nandita Gupta', role: 'Core Team', group: 'codeclub', club: 'codeclub' },
  { name: 'Shivali Virdi', role: 'Core Team', group: 'codeclub', club: 'codeclub' },
  { name: 'Manthan Gupta', role: 'Core Team', group: 'codeclub', club: 'codeclub' },

  // --- Website & design ----------------------------------------------------
  {
    name: 'Aryaveer Singh Parihar',
    role: 'Frontend & design',
    group: 'web',
    club: 'sangam',
  },
  {
    name: 'TODO Name',
    role: 'Backend & admin',
    group: 'web',
    club: 'sangam',
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
