import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { safeNext } from '@/lib/portal';

export const dynamic = 'force-dynamic';

/**
 * Where the links in Supabase's emails land: sign-up confirmation and
 * password reset.
 *
 * Handles both link styles. `token_hash` (the recommended email template)
 * works on any device. `code` is the default PKCE link, which only completes
 * in the browser that asked for it; opened anywhere else, the email is still
 * confirmed, so the visitor is sent to sign in.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get('token_hash');
  const type = params.get('type') as EmailOtpType | null;
  const code = params.get('code');
  const next = safeNext(params.get('next'), '/register/form');

  const supabase = await createRouteClient();
  if (!supabase) redirect('/login?error=config');

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(next);
    redirect(`/login?confirmed=1&next=${encodeURIComponent(next)}`);
  }

  redirect('/login?error=link');
}
