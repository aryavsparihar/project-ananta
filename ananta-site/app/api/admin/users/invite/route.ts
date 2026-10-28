import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createRouteClient, isSameOrigin } from '@/lib/supabase-server';
import type { AdminRole } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES: readonly AdminRole[] = ['super_admin', 'event_admin', 'judge'];
const FALLBACK_SITE_URL = 'https://project-ananta.vercel.app';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Invite a new organiser. The caller's cookie-backed session is verified first;
 * only then is the server-only Supabase admin client used to send the email.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError('Cross-origin requests are not allowed.', 403);
  }

  const sessionClient = await createRouteClient();
  if (!sessionClient) {
    return jsonError('Supabase is not configured.', 503);
  }

  const {
    data: { user },
    error: authError,
  } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return jsonError('Sign in as an active super admin first.', 401);
  }

  const { data: role, error: roleError } = await sessionClient.rpc('current_admin_role');
  if (roleError || role !== 'super_admin') {
    return jsonError('Only active super admins can invite organisers.', 403);
  }

  let body: { email?: unknown; role?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; role?: unknown };
  } catch {
    return jsonError('Send a valid JSON request.', 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const targetRole = body.role;

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Enter a valid organiser email address.', 400);
  }

  if (typeof targetRole !== 'string' || !ROLES.includes(targetRole as AdminRole)) {
    return jsonError('Choose a valid organiser role.', 400);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const privilegedKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !privilegedKey) {
    return jsonError('The organiser invitation service is not configured.', 503);
  }

  const adminClient = createSupabaseClient(url, privilegedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: existingAdmin, error: lookupError } = await adminClient
    .from('admin_users')
    .select('user_id, email, role, is_active')
    .ilike('email', email)
    .maybeSingle();

  if (lookupError) {
    console.error(
      'Could not check organiser account before invite:',
      lookupError.message,
    );
    return jsonError('Could not check existing organiser accounts.', 500);
  }

  if (existingAdmin) {
    return jsonError(
      'This email already has an organiser record. Change its role or status in the list below.',
      409,
    );
  }

  // Use the configured canonical site URL so invite links do not depend on an
  // arbitrary Vercel preview hostname. It must be present in Supabase's redirect allow-list.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL).replace(
    /\/$/,
    '',
  );

  const callbackUrl = new URL('/auth/confirm', siteUrl);
  callbackUrl.searchParams.set('next', '/account/password');
  const redirectTo = callbackUrl.toString();
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

  if (inviteError || !inviteData.user) {
    const message = inviteError?.message ?? 'Supabase did not return an invited user.';
    if (/already (been )?registered|already exists|user exists/i.test(message)) {
      // Existing student accounts can be promoted directly instead of forcing
      // organisers to retry an invitation that can never succeed for that email.
      const { error: existingRoleError } = await sessionClient.rpc('admin_set_user', {
        target_email: email,
        target_role: targetRole,
        target_active: true,
      });

      if (!existingRoleError) {
        return NextResponse.json({
          invited: false,
          assignedExistingAccount: true,
          email,
          role: targetRole,
          auditLogged: true,
        });
      }

      console.error('Existing account could not be assigned an organiser role:', {
        code: existingRoleError.code,
        message: existingRoleError.message,
      });
      return jsonError(
        existingRoleError.code === 'P0002'
          ? 'The account was not found. Ask the person to create and confirm their account first.'
          : 'This email already has a Supabase account, but role assignment failed. Use Accounts to inspect the account and try granting access there.',
        409,
      );
    }
    console.error('Supabase organiser invitation failed:', message);
    return jsonError(
      'The invitation email could not be sent. Check Auth email delivery settings.',
      502,
    );
  }

  // Assign the role through the database function using the verified caller's
  // session, rather than writing admin_users with the privileged client.
  const { error: assignmentError } = await sessionClient.rpc('admin_set_user', {
    target_email: email,
    target_role: targetRole,
    target_active: true,
  });

  if (assignmentError) {
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(
      inviteData.user.id,
    );
    if (cleanupError) {
      console.error('Could not clean up an invited user after role assignment failed:', {
        userId: inviteData.user.id,
        code: cleanupError.status,
      });
    }

    console.error(
      'Could not assign role after organiser invite:',
      assignmentError.message,
    );
    return jsonError(
      cleanupError
        ? 'The invite was sent, but role assignment and cleanup both failed. Contact a super admin before resending.'
        : 'The invite could not be completed and the pending account was removed. Check the database role function, then try again.',
      500,
    );
  }

  // The admin_users trigger records the role change. This additional row records
  // the invitation action with the real actor, without copying participant data.
  const { error: auditError } = await adminClient.from('audit_log').insert({
    actor_id: user.id,
    actor_email: user.email ?? null,
    table_name: 'admin_invitations',
    row_key: inviteData.user.id,
    action: 'INSERT',
    old_data: null,
    new_data: {
      email,
      role: targetRole,
      invitation_sent: true,
    },
  });

  if (auditError) {
    console.error(
      'Could not write organiser-invitation audit entry:',
      auditError.message,
    );
  }

  return NextResponse.json({
    invited: true,
    email,
    role: targetRole,
    auditLogged: !auditError,
    ...(auditError
      ? {
          warning:
            'The invitation was sent and the role was assigned, but the invitation audit entry could not be written. Contact a super admin.',
        }
      : {}),
  });
}
