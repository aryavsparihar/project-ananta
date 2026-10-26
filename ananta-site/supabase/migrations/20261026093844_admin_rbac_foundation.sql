
-- ANANTA role-based admin foundation.

do $$
begin
  create type public.admin_role as enum (
    'super_admin',
    'event_admin',
    'judge'
  );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.admin_users (
  user_id uuid primary key
    references auth.users(id) on delete cascade,

  email text not null,
  role public.admin_role not null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_email_lower_uidx
  on public.admin_users (lower(email));

-- Default deny: browser clients cannot read or edit role records.
alter table public.admin_users enable row level security;

revoke all on table public.admin_users
  from public, anon, authenticated;

-- Return only the current authenticated user's active role.
create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select au.role::text
  from public.admin_users as au
  where au.user_id = (select auth.uid())
    and au.is_active = true
  limit 1;
$function$;

revoke execute on function public.current_admin_role()
  from public, anon;

grant execute on function public.current_admin_role()
  to authenticated;
