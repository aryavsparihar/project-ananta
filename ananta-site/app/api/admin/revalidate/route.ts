import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { CONTENT_TAG } from '@/lib/site-content';
import { createRouteClient, isSameOrigin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Called by the admin content editor after a save, so the public pages show
 * the change now instead of when the five-minute cache next expires.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: 'Cross-origin requests are not allowed.' },
      { status: 403 },
    );
  }

  const supabase = await createRouteClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  const { data: organiser, error } = await supabase.rpc('is_organiser');
  if (error || organiser !== true) {
    return NextResponse.json({ error: 'Organisers only.' }, { status: 403 });
  }

  revalidateTag(CONTENT_TAG);
  return NextResponse.json({ revalidated: true });
}
