/**
 * Admin roles and the admin navigation. The routes and roles mirror
 * ADMIN_ROUTES in middleware.ts, which is what actually enforces them; the
 * database enforces them again through RLS.
 */

export type AdminRole = 'super_admin' | 'event_admin' | 'judge';

export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'event_admin', 'judge'];

export const isAdminRole = (value: unknown): value is AdminRole =>
  typeof value === 'string' && ADMIN_ROLES.includes(value as AdminRole);

export const ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  event_admin: 'Event admin',
  judge: 'Judge',
};

const ORGANISERS: AdminRole[] = ['super_admin', 'event_admin'];

export const ADMIN_NAV: {
  href: string;
  label: string;
  roles: AdminRole[];
  blurb: string;
}[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    roles: ADMIN_ROLES,
    blurb: 'Counts and shortcuts.',
  },
  {
    href: '/admin/registrations',
    label: 'Registrations',
    roles: ORGANISERS,
    blurb: 'Every entry from the site form and the Google Form: review, note, export.',
  },
  {
    href: '/admin/accounts',
    label: 'Accounts',
    roles: ORGANISERS,
    blurb:
      'Who has signed in, who has registered, and which accounts still need attention.',
  },
  {
    href: '/admin/teams',
    label: 'Teams',
    roles: ORGANISERS,
    blurb: 'Form teams from registrations and publish them to /contest.',
  },
  {
    href: '/admin/problems',
    label: 'Problems',
    roles: ORGANISERS,
    blurb: 'Write problem statements and release them on /problems.',
  },
  {
    href: '/admin/content',
    label: 'Content',
    roles: ORGANISERS,
    blurb:
      'Dates, rounds, prizes, rules, the team page, the announcement bar and portal settings.',
  },
  {
    href: '/admin/judging',
    label: 'Judging',
    roles: ['super_admin', 'judge'],
    blurb: 'Score teams by round and track submitted judge scores.',
  },
  {
    href: '/admin/users',
    label: 'Organisers',
    roles: ['super_admin'],
    blurb: 'Who can use this panel, and with which role.',
  },
  {
    href: '/admin/audit',
    label: 'Audit log',
    roles: ['super_admin'],
    blurb: 'Every change made from this panel, by whom and when.',
  },
];

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Ask the server to drop the cached public pages after a content change. */
export async function refreshPublicPages(): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/revalidate', { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}

/** A CSV a spreadsheet opens cleanly: quoted, UTF-8 with BOM. */
export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => {
    const text = v === null ? '' : String(v);
    // A leading = + - @ would run as a formula in Excel or Sheets.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const body = rows.map((r) => r.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['﻿', body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
