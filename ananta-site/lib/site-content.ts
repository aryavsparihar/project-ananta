/**
 * The public site's content: shipped defaults, overridden section by section
 * by whatever organisers saved in Supabase (public.site_content).
 *
 * Server only. One small anon-key request, held in Next's data cache for five
 * minutes and dropped immediately when an organiser saves (see
 * app/api/admin/revalidate). So pages stay static and served from the CDN no
 * matter how much traffic arrives, and Supabase sees at most one read per
 * cache window. Any failure falls back to the defaults: content in the
 * database can make a page different, never broken.
 */
import { cache } from 'react';
import {
  CONTENT_DEFAULTS,
  isSectionKey,
  validateSection,
  type SiteContent,
} from './content-sections';

export const CONTENT_TAG = 'site-content';
const REVALIDATE_SECONDS = 300;

async function fetchOverrides(): Promise<Partial<Record<string, unknown>>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return {};

  try {
    const response = await fetch(`${url}/rest/v1/site_content?select=key,value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: REVALIDATE_SECONDS, tags: [CONTENT_TAG] },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return {};

    const rows = (await response.json()) as { key: string; value: unknown }[];
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch {
    return {};
  }
}

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const overrides = await fetchOverrides();
  const content = { ...CONTENT_DEFAULTS };

  for (const [key, value] of Object.entries(overrides)) {
    if (!isSectionKey(key)) continue;
    const errors = validateSection(key, value);
    if (errors.length) {
      console.warn(`site_content.${key} ignored: ${errors[0]}`);
      continue;
    }
    (content as Record<string, unknown>)[key] = value;
  }

  return content;
});
