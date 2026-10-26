
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type AdminRole = 'super_admin' | 'event_admin' | 'judge';

const ADMIN_ROUTES: {
  path: string;
  roles: AdminRole[];
}[] = [
  {
    path: '/admin/dashboard',
    roles: ['super_admin', 'event_admin', 'judge'],
  },
  {
    path: '/admin/content',
    roles: ['super_admin', 'event_admin'],
  },
  {
    path: '/admin/registrations',
    roles: ['super_admin', 'event_admin'],
  },
  {
    path: '/admin/teams',
    roles: ['super_admin', 'event_admin'],
  },
  {
    path: '/admin/rounds',
    roles: ['super_admin', 'event_admin'],
  },
  {
    path: '/admin/submissions',
    roles: ['super_admin', 'event_admin', 'judge'],
  },
  {
    path: '/admin/judging',
    roles: ['super_admin', 'judge'],
  },
  {
    path: '/admin/users',
    roles: ['super_admin'],
  },
  {
    path: '/admin/audit',
    roles: ['super_admin'],
  },
];

function redirectPreservingCookies(
  request: NextRequest,
  response: NextResponse,
  destination: string,
) {
  const redirect = NextResponse.redirect(
    new URL(destination, request.url),
  );

  for (const { name, value, ...options } of response.cookies.getAll()) {
    redirect.cookies.set(name, value, options);
  }

  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = response.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }

  return redirect;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/+$/, '') || '/';

  // The sign-in page must remain reachable when signed out.
  if (pathname === '/admin') {
    return NextResponse.next({ request });
  }

  // Every other /admin route must be explicitly registered below.
  const rule = ADMIN_ROUTES.find(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!rule) {
    return NextResponse.redirect(
      new URL('/admin?access=denied', request.url),
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed: protected routes never bypass checks on configuration errors.
  if (!url || !key) {
    return NextResponse.redirect(
      new URL('/admin?error=config', request.url),
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Verify the current session with Supabase Auth.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return redirectPreservingCookies(
      request,
      response,
      '/admin?login=1',
    );
  }

  // The database is the source of truth for the current user's role.
  const { data: role, error: roleError } =
    await supabase.rpc('current_admin_role');

  if (
    roleError ||
    typeof role !== 'string' ||
    !rule.roles.includes(role as AdminRole)
  ) {
    return redirectPreservingCookies(
      request,
      response,
      '/admin?access=denied',
    );
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
