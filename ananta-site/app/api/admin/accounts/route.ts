import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createRouteClient, isSameOrigin } from '@/lib/supabase-server';
import type { AdminRole } from '@/lib/admin';
import {
  buildAccountDirectory,
  type AuthDirectoryUser,
  type RegistrationDirectoryRow,
  type AdminDirectoryRow,
} from '@/lib/account-directory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES: readonly AdminRole[] = ['super_admin', 'event_admin', 'judge'];
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

async function currentCaller(request: Request) {
  if (!isSameOrigin(request)) {
    return { response: jsonError('Cross-origin requests are not allowed.', 403) };
  }

  const client = await createRouteClient();
  if (!client) {
    return { response: jsonError('Supabase is not configured.', 503) };
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return { response: jsonError('Sign in to view participant accounts.', 401) };
  }

  const { data: role, error: roleError } = await client.rpc('current_admin_role');
  if (roleError || !['super_admin', 'event_admin'].includes(String(role))) {
    return {
      response: jsonError('Only active organisers can view participant accounts.', 403),
    };
  }

  return { client, user, role: role as AdminRole };
}

/**
 * Lists account metadata from the server-side Auth Admin API. The browser never
 * receives service credentials or raw auth.users rows. Event admins see
 * participants only; super admins can also promote an existing account.
 */
export async function GET(request: Request) {
  const caller = await currentCaller(request);
  if ('response' in caller) return caller.response;

  const adminClient = serviceClient();
  if (!adminClient) {
    return jsonError(
      'The account directory service is not configured on the server.',
      503,
    );
  }

  const authUsers = [];
  let truncated = false;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      console.error('Could not list Auth accounts:', error.message);
      return jsonError(
        'Could not load the account directory. Check the server Auth credentials.',
        502,
      );
    }

    authUsers.push(...data.users);

    if (data.users.length < PAGE_SIZE) break;
    if (page === MAX_PAGES) truncated = true;
  }

  const [
    { data: registrations, error: registrationError },
    { data: adminRows, error: adminError },
  ] = await Promise.all([
    adminClient
      .from('registrations')
      .select(
        'user_id, participant_email, participant_name, entry_number, submitted_at, imported_at, source',
      )
      .limit(10000),
    adminClient.from('admin_users').select('user_id, role, is_active'),
  ]);

  if (registrationError || adminError) {
    console.error('Could not join account status:', {
      registrations: registrationError?.message,
      admins: adminError?.message,
    });
    return jsonError('Could not load registration or organiser status.', 502);
  }

  const accounts = buildAccountDirectory(
    authUsers as AuthDirectoryUser[],
    (registrations ?? []) as RegistrationDirectoryRow[],
    (adminRows ?? []) as AdminDirectoryRow[],
    caller.role === 'super_admin',
  );

  return NextResponse.json(
    {
      accounts,
      truncated,
      count: accounts.length,
    },
    {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    },
  );
}

/** Assign a role to an account that already exists (for example, a student account). */
export async function POST(request: Request) {
  const caller = await currentCaller(request);
  if ('response' in caller) return caller.response;

  if (caller.role !== 'super_admin') {
    return jsonError('Only a super admin can grant organiser access.', 403);
  }

  let body: { email?: unknown; role?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; role?: unknown };
  } catch {
    return jsonError('Send a valid JSON request.', 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = body.role;

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Enter a valid account email.', 400);
  }
  if (typeof role !== 'string' || !ROLES.includes(role as AdminRole)) {
    return jsonError('Choose a valid organiser role.', 400);
  }

  const { error } = await caller.client.rpc('admin_set_user', {
    target_email: email,
    target_role: role,
    target_active: true,
  });

  if (error) {
    console.error('Could not grant organiser role:', {
      code: error.code,
      message: error.message,
    });
    const status = error.code === 'P0002' ? 404 : error.code === '42501' ? 403 : 400;
    return jsonError(
      error.code === 'P0002'
        ? 'No account uses that email yet. Ask the person to create and confirm their account first.'
        : error.message,
      status,
    );
  }

  return NextResponse.json({ granted: true, email, role });
}
