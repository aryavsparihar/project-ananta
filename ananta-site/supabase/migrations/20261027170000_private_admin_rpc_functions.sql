-- Keep privileged implementations outside the exposed public schema.
-- Preserve the existing public RPC names with invoker-rights wrappers so the
-- browser client and RLS policies continue to use the same API surface.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Move the existing implementations without changing their bodies or OIDs.
alter function public.admin_list_users() set schema private;
alter function public.admin_set_user(text, text, boolean) set schema private;
alter function public.current_admin_role() set schema private;
alter function public.is_organiser() set schema private;
alter function public.my_registration() set schema private;
alter function public.submit_registration(jsonb) set schema private;

-- The moved functions remain server-authorized, but are no longer exposed as
-- public PostgREST RPC endpoints. Public wrappers below delegate to them.
revoke all on function private.admin_list_users()
  from public, anon;
revoke all on function private.admin_set_user(text, text, boolean)
  from public, anon;
revoke all on function private.current_admin_role()
  from public, anon;
revoke all on function private.is_organiser()
  from public, anon;
revoke all on function private.my_registration()
  from public, anon;
revoke all on function private.submit_registration(jsonb)
  from public, anon;

grant execute on function private.admin_list_users()
  to authenticated, service_role;
grant execute on function private.admin_set_user(text, text, boolean)
  to authenticated, service_role;
grant execute on function private.current_admin_role()
  to authenticated, service_role;
grant execute on function private.is_organiser()
  to authenticated, service_role;
grant execute on function private.my_registration()
  to authenticated, service_role;
grant execute on function private.submit_registration(jsonb)
  to authenticated, service_role;

-- Same public RPC names, with invoker-rights only. Authorization for the
-- sensitive work remains inside the private implementations.
create function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  role text,
  is_active boolean,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select *
  from private.admin_list_users();
$function$;

create function public.admin_set_user(
  target_email text,
  target_role text,
  target_active boolean
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $function$
  select private.admin_set_user(target_email, target_role, target_active);
$function$;

create function public.current_admin_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.current_admin_role();
$function$;

create function public.is_organiser()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.is_organiser();
$function$;

create function public.my_registration()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.my_registration();
$function$;

create function public.submit_registration(form jsonb)
returns jsonb
language sql
volatile
security invoker
set search_path = ''
as $function$
  select private.submit_registration(form);
$function$;

-- PostgreSQL grants EXECUTE to PUBLIC by default when creating a function.
-- Restrict the public RPC surface explicitly.
revoke all on function public.admin_list_users()
  from public, anon;
revoke all on function public.admin_set_user(text, text, boolean)
  from public, anon;
revoke all on function public.current_admin_role()
  from public, anon;
revoke all on function public.is_organiser()
  from public, anon;
revoke all on function public.my_registration()
  from public, anon;
revoke all on function public.submit_registration(jsonb)
  from public, anon;

grant execute on function public.admin_list_users()
  to authenticated, service_role;
grant execute on function public.admin_set_user(text, text, boolean)
  to authenticated, service_role;
grant execute on function public.current_admin_role()
  to authenticated, service_role;
grant execute on function public.is_organiser()
  to authenticated, service_role;
grant execute on function public.my_registration()
  to authenticated, service_role;
grant execute on function public.submit_registration(jsonb)
  to authenticated, service_role;

comment on schema private is
  'Non-exposed implementations for privileged ANANTA database routines.';
