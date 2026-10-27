import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * A Supabase client for route handlers, acting as the signed-in visitor
 * through their session cookies. Uses the anon key only; RLS decides what it
 * can do.
 */
export async function createRouteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Read-only context. The session is still verified per request.
        }
      },
    },
  });
}

/** Rejects requests a browser on another site sent. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
