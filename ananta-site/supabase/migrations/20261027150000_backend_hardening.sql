-- ANANTA backend hardening: minimise privilege elevation and index team lookup.

-- This helper only reads site_content, which is intentionally publicly readable
-- under RLS. It does not need to bypass row-level security.
create or replace function public.allowed_email_domains()
returns text[]
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    case
      when jsonb_typeof(portal.value -> 'allowedEmailDomains') = 'array' then
        array(
          select lower(btrim(domain))
          from jsonb_array_elements_text(portal.value -> 'allowedEmailDomains') as domain
          where btrim(domain) <> ''
        )
      else array['smvdu.ac.in']
    end
  from (
    select (
      select sc.value from public.site_content as sc where sc.key = 'portal'
    ) as value
  ) as portal;
$function$;

-- Preserve the intended public API: anonymous and signed-in clients may read
-- the allowed-domain list, but PUBLIC is not granted execute implicitly.
revoke execute on function public.allowed_email_domains() from public;
grant execute on function public.allowed_email_domains() to anon, authenticated;

-- PostgreSQL does not automatically index the referencing side of a foreign
-- key. This helps lookups and deletes/updates of referenced problem statements.
create index if not exists contest_teams_problem_statement_id_idx
  on public.contest_teams (problem_statement_id)
  where problem_statement_id is not null;
