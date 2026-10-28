/**
 * The registration form's questions, as the organisers' Google Form asks them.
 *
 * public.submit_registration() checks the same lists and patterns, so a change
 * here needs the matching change in a migration.
 */

export const YEARS = ['1st', '2nd', '3rd', '4th'] as const;

export const SKILLS = [
  'Frontend development',
  'Backend development',
  'Full-stack development',
  'UI/UX design',
  'Artificial intelligence / Machine Learning',
  'Data science / Data analytics',
  'Mobile app development',
  'Cloud / DevOps',
  'Cybersecurity',
  'Database management',
  'Hardware / IoT',
  'Research / documentation / presentation',
] as const;

export const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', hint: 'Learning fundamentals' },
  {
    value: 'intermediate',
    label: 'Intermediate',
    hint: 'Have built projects independently',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    hint: 'Experience with complex projects or deployment',
  },
] as const;

export const CONSENT =
  "I confirm that the information provided in this form is accurate to the best of my knowledge. I agree to follow Project Ananta's rules, guidelines, deadlines, and instructions issued by the organising committee. I understand that registration is individual and teams will be formed by the organising committee. I agree to contribute responsibly to my assigned team and attend the required evaluation rounds as scheduled.";

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** Returns a form-safe error message for unsupported or unusable CV uploads. */
export function validateCvUpload(file: { type: string; size: number }): string | null {
  if (!CV_TYPES.includes(file.type)) {
    return 'Upload the CV as a PDF or Word document.';
  }
  if (file.size <= 0) {
    return 'Choose a non-empty CV file.';
  }
  if (file.size > CV_MAX_BYTES) {
    return 'Keep the CV under 5 MB.';
  }
  return null;
}

export type RegistrationForm = {
  full_name: string;
  entry_number: string;
  year_of_study: string;
  phone: string;
  whatsapp: string;
  department: string;
  github_url: string;
  linkedin_url: string;
  skills: string[];
  experience_level: string;
  project_idea: string;
  cv_path: string | null;
  consent: boolean;
};

/** What my_registration() returns. Never includes status or internal notes. */
export type MyRegistration = Omit<RegistrationForm, 'consent' | 'whatsapp'> & {
  id: string;
  email: string;
  whatsapp: string | null;
  submitted_at: string;
  updated_at: string;
};

/** "github.com/x" and "www.linkedin.com/in/x" become full https URLs. */
export function normaliseUrl(value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (/^https:\/\//i.test(v)) return v;
  return `https://${v.replace(/^http:\/\//i, '')}`;
}

export function emailAllowed(email: string, domains: readonly string[]): boolean {
  if (domains.length === 0) return true;
  const domain = email.trim().toLowerCase().split('@')[1] ?? '';
  return domains.includes(domain);
}

/** A relative path on this site, so ?next= can never send someone elsewhere. */
export function safeNext(
  value: string | null | undefined,
  fallback = '/account',
): string {
  return value && /^\/(?![/\\])/.test(value) ? value : fallback;
}

/** Postgres and Supabase errors, in words a participant can act on. */
export function friendlyError(
  error: unknown,
  fallback = 'Something went wrong.',
): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  if (/invalid login credentials/i.test(message)) return 'Wrong email or password.';
  if (/email not confirmed/i.test(message))
    return 'Confirm your email first: open the link we sent you.';
  if (/rate limit|too many/i.test(message))
    return 'Too many attempts. Wait a minute and try again.';
  if (/user already registered/i.test(message))
    return 'An account with this email already exists. Sign in instead.';
  if (/failed to fetch|network/i.test(message))
    return 'Could not reach the server. Check your connection and try again.';
  return message || fallback;
}
