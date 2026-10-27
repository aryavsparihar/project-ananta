/**
 * Every organiser-editable section of the public site, with its shipped
 * default and its shape check.
 *
 * Pure and client-safe: the admin editor validates with exactly the same code
 * the server uses before it lets an override reach a page.
 */
import {
  ANNOUNCEMENT,
  CONTACT,
  EVENT,
  PORTAL,
  PRIZES,
  REGISTRATION,
  ROUNDS,
  TEAM_RULES,
} from '@/content/event';
import { GROUPS, TEAM } from '@/content/team';
import { check, shapeOf, type Shape } from './content-schema';

/** The defaults are `as const`; an override is any value of the same shape. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? readonly Widen<U>[]
        : T extends object
          ? { [K in keyof T]: Widen<T[K]> }
          : T;

export type SiteContent = {
  event: Widen<typeof EVENT>;
  registration: Widen<typeof REGISTRATION>;
  rounds: Widen<typeof ROUNDS>;
  prizes: Widen<typeof PRIZES>;
  team_rules: Widen<typeof TEAM_RULES>;
  team: { groups: typeof GROUPS; people: typeof TEAM };
  contact: Widen<typeof CONTACT>;
  announcement: Widen<typeof ANNOUNCEMENT>;
  portal: Widen<typeof PORTAL>;
};

export type SectionKey = keyof SiteContent;

export const CONTENT_DEFAULTS: SiteContent = {
  event: EVENT,
  registration: REGISTRATION,
  rounds: ROUNDS,
  prizes: PRIZES,
  team_rules: TEAM_RULES,
  team: { groups: GROUPS, people: TEAM },
  contact: CONTACT,
  announcement: ANNOUNCEMENT,
  portal: PORTAL,
};

const CLUBS: readonly string[] = ['sangam', 'devgrowth', 'codeclub', 'smvdu'];

const isHttps = (v: unknown) => typeof v === 'string' && /^https:\/\/\S+$/.test(v);
const isDate = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

export type Section = {
  key: SectionKey;
  title: string;
  description: string;
  /** Samples for optional fields no default happens to use. */
  extraSamples?: unknown[];
  /** Rules a shape cannot express. */
  refine?: (value: never) => string[];
};

export const SECTIONS: Section[] = [
  {
    key: 'announcement',
    title: 'Announcement bar',
    description: 'A one-line notice above every page. Set enabled to true to show it.',
    refine: (v: SiteContent['announcement']) =>
      v.href && !v.href.startsWith('/') && !isHttps(v.href)
        ? ['href must start with / or https://']
        : [],
  },
  {
    key: 'portal',
    title: 'Participant portal',
    description:
      'Whether the form accepts entries, which email domains may register, and the Google Form fallback. The database enforces formOpen and allowedEmailDomains as well.',
    refine: (v: SiteContent['portal']) => [
      ...(isHttps(v.googleFormUrl) ? [] : ['googleFormUrl must be an https:// URL']),
      ...v.allowedEmailDomains
        .filter((d) => !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d))
        .map((d) => `"${d}" is not a domain like smvdu.ac.in`),
    ],
  },
  {
    key: 'registration',
    title: 'Registration dates',
    description:
      'closesAt drives the countdown and the server-side cut-off, so keep the +05:30 offset. The display strings are what the pages print.',
    refine: (v: SiteContent['registration']) =>
      isDate(v.closesAt)
        ? []
        : ['closesAt must be a date like 2026-11-04T23:59:00+05:30'],
  },
  {
    key: 'contact',
    title: 'Contact',
    description: 'The address participants write to.',
    refine: (v: SiteContent['contact']) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ? [] : ['email is not an email address'],
  },
  {
    key: 'event',
    title: 'Event facts',
    description: 'Name, tagline, dates and credits used across every page.',
  },
  {
    key: 'rounds',
    title: 'Rounds',
    description:
      'The timeline on the home page and /journey. marks: null marks a window.',
  },
  {
    key: 'prizes',
    title: 'Prizes',
    description: 'The pool and the three places.',
  },
  {
    key: 'team_rules',
    title: 'Team rules',
    description: 'The five rules on /rules. The first two also appear on /register.',
  },
  {
    key: 'team',
    title: 'Team page',
    description:
      'Groups and people on /team. photo must name a processed file in public/team (commit it first); links take full https:// URLs.',
    extraSamples: [
      {
        groups: [
          { id: 'x', title: 'x', blurb: 'x', club: 'sangam', featured: true },
          { id: 'x', title: 'x', blurb: 'x' },
        ],
        people: [
          {
            name: 'x',
            role: 'x',
            group: 'x',
            club: 'sangam',
            year: 'x',
            school: 'x',
            photo: 'x',
            linkedin: 'https://x',
            github: 'https://x',
            website: 'https://x',
          },
          { name: 'x', role: 'x', group: 'x' },
        ],
      },
    ],
    refine: (v: SiteContent['team']) => [
      ...v.people.flatMap((p) =>
        (['linkedin', 'github', 'website'] as const)
          .filter((k) => p[k] && !isHttps(p[k]))
          .map((k) => `${p.name}: ${k} must be an https:// URL`),
      ),
      ...[...v.groups, ...v.people]
        .filter((x) => x.club && !CLUBS.includes(x.club))
        .map((x) => `club "${x.club}" must be one of ${CLUBS.join(', ')}`),
    ],
  },
];

const SHAPES = new Map<SectionKey, Shape>(
  SECTIONS.map((s) => [
    s.key,
    shapeOf(CONTENT_DEFAULTS[s.key], ...(s.extraSamples ?? [])),
  ]),
);

/** Problems with an override for `key`. Empty means it is safe to publish. */
export function validateSection(key: SectionKey, value: unknown): string[] {
  const shape = SHAPES.get(key);
  if (!shape) return [`Unknown section "${key}"`];
  const errors = check(value, shape, key);
  if (errors.length) return errors;
  const refine = SECTIONS.find((s) => s.key === key)?.refine as
    ((v: unknown) => string[]) | undefined;
  return refine ? refine(value) : [];
}

export const isSectionKey = (key: string): key is SectionKey =>
  SHAPES.has(key as SectionKey);

/** "SANGAM × DevGrowth × Code Club" */
export const presentedBy = (event: SiteContent['event']) => event.presenters.join(' × ');
