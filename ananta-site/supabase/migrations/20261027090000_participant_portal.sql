-- ANANTA participant portal.
--
-- Adds, on top of the admin RBAC foundation and the Google Forms import:
--   * website registration through student accounts (email + password)
--   * a private bucket for CV uploads
--   * problem statements and contest teams, published by organisers
--   * site_content: organiser-editable overrides for the public pages
--   * organiser account management for super admins
--   * an audit log of every organiser change
--
-- Students never read or write public.registrations directly. They go through
-- my_registration() and submit_registration(), which only ever touch the
-- caller's own row and never expose status or admin_notes.

-- ------------------------------------------------------------------ helpers

-- True for active super admins and event admins: the people who run the event.
create or replace function public.is_organiser()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    public.current_admin_role() in ('super_admin', 'event_admin'),
    false
  );
$function$;

revoke execute on function public.is_organiser()
  from public, anon;

grant execute on function public.is_organiser()
  to authenticated;

-- Generic updated_at trigger for the tables below.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

revoke all on function public.touch_updated_at()
  from public, anon, authenticated;

-- A cast that returns null instead of failing, so a badly edited setting can
-- never take registration down with an exception.
create or replace function public.try_timestamptz(value text)
returns timestamptz
language plpgsql
immutable
set search_path = ''
as $function$
begin
  return value::timestamptz;
exception
  when others then
    return null;
end;
$function$;

revoke all on function public.try_timestamptz(text)
  from public, anon, authenticated;

-- ------------------------------------------------------------- site content

-- One row per editable section of the site (event, rounds, team, portal...).
-- The app ships defaults for every key; a row here overrides that default.
create table if not exists public.site_content (
  key text primary key
    check (key ~ '^[a-z][a-z_]{1,39}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_content_touch_updated_at
  on public.site_content;

create trigger site_content_touch_updated_at
before update on public.site_content
for each row
execute function public.touch_updated_at();

alter table public.site_content enable row level security;

revoke all on table public.site_content
  from public, anon, authenticated;

-- Public pages read it with the anon key, so everything here is public.
grant select on table public.site_content
  to anon, authenticated;

grant insert, update, delete on table public.site_content
  to authenticated;

drop policy if exists site_content_read on public.site_content;

create policy site_content_read
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists site_content_insert_for_organisers on public.site_content;

create policy site_content_insert_for_organisers
on public.site_content
for insert
to authenticated
with check ((select public.is_organiser()));

drop policy if exists site_content_update_for_organisers on public.site_content;

create policy site_content_update_for_organisers
on public.site_content
for update
to authenticated
using ((select public.is_organiser()))
with check ((select public.is_organiser()));

drop policy if exists site_content_delete_for_organisers on public.site_content;

create policy site_content_delete_for_organisers
on public.site_content
for delete
to authenticated
using ((select public.is_organiser()));

-- Email domains allowed to register. Defaults to SMVDU; an empty list in the
-- portal settings means any domain.
create or replace function public.allowed_email_domains()
returns text[]
language sql
stable
security definer
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

revoke execute on function public.allowed_email_domains()
  from public;

grant execute on function public.allowed_email_domains()
  to anon, authenticated;

-- ----------------------------------------------------- website registrations

alter table public.registrations
  drop constraint if exists registrations_source_check;

alter table public.registrations
  add constraint registrations_source_check
  check (source in ('google_forms', 'website'));

alter table public.registrations
  add column if not exists user_id uuid
    references auth.users(id) on delete set null,
  add column if not exists entry_number text,
  add column if not exists year_of_study text
    check (year_of_study in ('1st', '2nd', '3rd', '4th')),
  add column if not exists department text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists skills text[] not null default '{}',
  add column if not exists experience_level text
    check (experience_level in ('beginner', 'intermediate', 'advanced')),
  add column if not exists project_idea text,
  add column if not exists cv_path text,
  add column if not exists consented_at timestamptz;

-- One website registration per account, and per university entry number.
create unique index if not exists registrations_user_uidx
  on public.registrations (user_id)
  where user_id is not null;

create unique index if not exists registrations_website_entry_uidx
  on public.registrations (upper(entry_number))
  where source = 'website' and entry_number is not null;

create index if not exists registrations_source_idx
  on public.registrations (source);

-- Organisers may remove spam or duplicate entries.
grant delete on table public.registrations
  to authenticated;

drop policy if exists registrations_delete_for_organisers
  on public.registrations;

create policy registrations_delete_for_organisers
on public.registrations
for delete
to authenticated
using ((select public.is_organiser()));

-- The caller's own website registration, without status or internal notes.
create or replace function public.my_registration()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'id', r.id,
    'submitted_at', r.submitted_at,
    'updated_at', r.updated_at,
    'full_name', r.participant_name,
    'email', r.participant_email,
    'entry_number', r.entry_number,
    'year_of_study', r.year_of_study,
    'department', r.department,
    'phone', r.phone,
    'whatsapp', r.whatsapp,
    'github_url', r.github_url,
    'linkedin_url', r.linkedin_url,
    'skills', to_jsonb(r.skills),
    'experience_level', r.experience_level,
    'project_idea', r.project_idea,
    'cv_path', r.cv_path
  )
  from public.registrations as r
  where r.user_id = (select auth.uid())
    and r.source = 'website'
  limit 1;
$function$;

revoke execute on function public.my_registration()
  from public, anon;

grant execute on function public.my_registration()
  to authenticated;

-- Create or update the caller's registration. Every rule the form shows is
-- enforced again here, because the form itself can be bypassed.
create or replace function public.submit_registration(form jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  allowed_skills constant text[] := array[
    'Frontend development',
    'Backend development',
    'Full-stack development',
    'UI/UX design',
    'Artificial intelligence / Machine Learning',
    'Data science / Data analytics',
    'Mobile app development',
    'Cloud / DevOps',
    'Cybersecurity',
    'Database management',
    'Hardware / IoT',
    'Research / documentation / presentation'
  ];

  v_uid uuid := auth.uid();
  v_email text;
  v_confirmed_at timestamptz;
  v_domains text[];
  v_portal jsonb;
  v_registration jsonb;
  v_closes_at timestamptz;

  v_name text := btrim(coalesce(form ->> 'full_name', ''));
  v_entry text := upper(btrim(coalesce(form ->> 'entry_number', '')));
  v_year text := btrim(coalesce(form ->> 'year_of_study', ''));
  v_phone text := regexp_replace(coalesce(form ->> 'phone', ''), '[\s()-]', '', 'g');
  v_whatsapp text := regexp_replace(coalesce(form ->> 'whatsapp', ''), '[\s()-]', '', 'g');
  v_department text := btrim(coalesce(form ->> 'department', ''));
  v_github text := btrim(coalesce(form ->> 'github_url', ''));
  v_linkedin text := btrim(coalesce(form ->> 'linkedin_url', ''));
  v_skills text[];
  v_level text := btrim(coalesce(form ->> 'experience_level', ''));
  v_idea text := nullif(btrim(coalesce(form ->> 'project_idea', '')), '');
  v_cv text := nullif(btrim(coalesce(form ->> 'cv_path', '')), '');
  v_answers jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in to register.' using errcode = '28000';
  end if;

  select lower(u.email), u.email_confirmed_at
    into v_email, v_confirmed_at
  from auth.users as u
  where u.id = v_uid;

  if v_email is null or v_confirmed_at is null then
    raise exception 'Confirm your email address before registering.'
      using errcode = '28000';
  end if;

  v_domains := public.allowed_email_domains();
  if cardinality(v_domains) > 0
    and not (split_part(v_email, '@', 2) = any (v_domains)) then
    raise exception 'Register with your university email address (%).',
      array_to_string(v_domains, ', ')
      using errcode = '42501';
  end if;

  select sc.value into v_portal from public.site_content as sc where sc.key = 'portal';
  select sc.value into v_registration from public.site_content as sc where sc.key = 'registration';

  v_closes_at := coalesce(
    public.try_timestamptz(v_registration ->> 'closesAt'),
    '2026-11-04T23:59:00+05:30'::timestamptz
  );

  if coalesce(v_portal ->> 'formOpen', 'true') = 'false' or now() > v_closes_at then
    raise exception 'Registration is closed.' using errcode = '42501';
  end if;

  if jsonb_typeof(form -> 'skills') = 'array' then
    v_skills := array(
      select distinct skill
      from jsonb_array_elements_text(form -> 'skills') as skill
    );
  else
    v_skills := '{}';
  end if;

  if char_length(v_name) not between 2 and 120 then
    raise exception 'Enter your full name.' using errcode = '22023';
  elsif v_entry !~ '^[A-Z0-9/-]{3,30}$' then
    raise exception 'Enter a valid university entry number.' using errcode = '22023';
  elsif v_year not in ('1st', '2nd', '3rd', '4th') then
    raise exception 'Choose your year of study.' using errcode = '22023';
  elsif v_phone !~ '^\+?[0-9]{10,13}$' then
    raise exception 'Enter a valid mobile number.' using errcode = '22023';
  elsif v_whatsapp <> '' and v_whatsapp !~ '^\+?[0-9]{10,13}$' then
    raise exception 'Enter a valid WhatsApp number, or leave it blank.'
      using errcode = '22023';
  elsif char_length(v_department) not between 2 and 120 then
    raise exception 'Enter your department or school.' using errcode = '22023';
  elsif v_github !~* '^https://(www\.)?github\.com/[a-z0-9](?:[a-z0-9-]{0,38})/?$' then
    raise exception 'Enter your GitHub profile URL, like https://github.com/username.'
      using errcode = '22023';
  elsif v_linkedin !~* '^https://([a-z]{2,3}\.)?linkedin\.com/in/[^/?#\s]{2,100}/?$' then
    raise exception 'Enter your LinkedIn profile URL, like https://www.linkedin.com/in/name.'
      using errcode = '22023';
  elsif cardinality(v_skills) = 0 then
    raise exception 'Choose at least one technical skill.' using errcode = '22023';
  elsif not (v_skills <@ allowed_skills) then
    raise exception 'Choose skills from the list.' using errcode = '22023';
  elsif v_level not in ('beginner', 'intermediate', 'advanced') then
    raise exception 'Choose your experience level.' using errcode = '22023';
  elsif char_length(coalesce(v_idea, '')) > 2000 then
    raise exception 'Keep the project idea under 2,000 characters.' using errcode = '22023';
  elsif v_cv is not null
    and v_cv !~ ('^' || v_uid::text || '/[A-Za-z0-9._-]{1,120}$') then
    raise exception 'The CV upload could not be matched to your account. Upload it again.'
      using errcode = '22023';
  elsif coalesce(form ->> 'consent', 'false') <> 'true' then
    raise exception 'Tick the consent box to register.' using errcode = '22023';
  end if;

  -- The same answers keyed by the Google Form's own questions, so the admin
  -- view and CSV exports read the same for both intakes.
  v_answers := jsonb_build_object(
    'Full Name', v_name,
    'University Entry Number', v_entry,
    'Year of Study', v_year,
    'Email', v_email,
    'Mobile Number', v_phone,
    'WhatsApp number (if different)', v_whatsapp,
    'Department / School', v_department,
    'Github Profile URL', v_github,
    'LinkedIn Profile URL', v_linkedin,
    'Technical Skill to be Opted', array_to_string(v_skills, ', '),
    'Experience Level', initcap(v_level),
    'Project Idea / Area of Interest', coalesce(v_idea, ''),
    'Upload CV (pdf/doc)', case when v_cv is null then '' else 'Uploaded' end,
    'Consent', 'Agreed'
  );

  begin
    insert into public.registrations (
      source,
      source_response_id,
      user_id,
      submitted_at,
      participant_name,
      participant_email,
      entry_number,
      year_of_study,
      department,
      phone,
      whatsapp,
      github_url,
      linkedin_url,
      skills,
      experience_level,
      project_idea,
      cv_path,
      consented_at,
      form_response
    )
    values (
      'website',
      v_uid::text,
      v_uid,
      now(),
      v_name,
      v_email,
      v_entry,
      v_year,
      v_department,
      v_phone,
      nullif(v_whatsapp, ''),
      v_github,
      v_linkedin,
      v_skills,
      v_level,
      v_idea,
      v_cv,
      now(),
      v_answers
    )
    on conflict (user_id) where user_id is not null
    do update set
      participant_name = excluded.participant_name,
      participant_email = excluded.participant_email,
      entry_number = excluded.entry_number,
      year_of_study = excluded.year_of_study,
      department = excluded.department,
      phone = excluded.phone,
      whatsapp = excluded.whatsapp,
      github_url = excluded.github_url,
      linkedin_url = excluded.linkedin_url,
      skills = excluded.skills,
      experience_level = excluded.experience_level,
      project_idea = excluded.project_idea,
      cv_path = excluded.cv_path,
      consented_at = excluded.consented_at,
      form_response = excluded.form_response;
  exception
    when unique_violation then
      raise exception 'Entry number % is already registered. Contact the organisers if this is wrong.',
        v_entry
        using errcode = '23505';
  end;

  return public.my_registration();
end;
$function$;

revoke execute on function public.submit_registration(jsonb)
  from public, anon;

grant execute on function public.submit_registration(jsonb)
  to authenticated;

-- Optional server-side signup guard. Enable it in the Supabase dashboard under
-- Authentication > Hooks > "Before User Created" to refuse accounts outside
-- the allowed domains at signup itself. Registration enforces the domain
-- either way; this only stops stray accounts from being created. While it is
-- on, it also applies to accounts created from the dashboard, so organiser
-- accounts on other domains need the domain added to the portal settings.
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
  v_domains text[] := public.allowed_email_domains();
begin
  if cardinality(v_domains) = 0 or split_part(v_email, '@', 2) = any (v_domains) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code', 403,
      'message',
      'Use your university email address (' || array_to_string(v_domains, ', ') || ').'
    )
  );
end;
$function$;

revoke execute on function public.hook_before_user_created(jsonb)
  from public, anon, authenticated;

grant execute on function public.hook_before_user_created(jsonb)
  to supabase_auth_admin;

-- ------------------------------------------------------------------ CV bucket

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Files live at cvs/<user id>/<file>. Students manage only their own folder;
-- organisers can read every CV.
drop policy if exists cvs_insert_own on storage.objects;

create policy cvs_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cvs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists cvs_update_own on storage.objects;

create policy cvs_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cvs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'cvs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists cvs_delete_own on storage.objects;

create policy cvs_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cvs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists cvs_read_own_or_organiser on storage.objects;

create policy cvs_read_own_or_organiser
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cvs'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_organiser())
  )
);

-- --------------------------------------------------------- problem statements

create table if not exists public.problem_statements (
  id uuid primary key default gen_random_uuid(),
  code text not null
    check (char_length(code) between 1 and 16),
  title text not null
    check (char_length(title) between 1 and 200),
  domain text
    check (char_length(domain) <= 80),
  summary text
    check (char_length(summary) <= 600),
  body text
    check (char_length(body) <= 20000),
  resource_url text
    check (resource_url ~ '^https://'),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists problem_statements_code_uidx
  on public.problem_statements (lower(code));

drop trigger if exists problem_statements_touch_updated_at
  on public.problem_statements;

create trigger problem_statements_touch_updated_at
before update on public.problem_statements
for each row
execute function public.touch_updated_at();

alter table public.problem_statements enable row level security;

revoke all on table public.problem_statements
  from public, anon, authenticated;

grant select, insert, update, delete on table public.problem_statements
  to authenticated;

-- Signed-in participants see published statements; organisers see drafts too.
drop policy if exists problem_statements_read on public.problem_statements;

create policy problem_statements_read
on public.problem_statements
for select
to authenticated
using (is_published or (select public.is_organiser()));

drop policy if exists problem_statements_insert_for_organisers
  on public.problem_statements;

create policy problem_statements_insert_for_organisers
on public.problem_statements
for insert
to authenticated
with check ((select public.is_organiser()));

drop policy if exists problem_statements_update_for_organisers
  on public.problem_statements;

create policy problem_statements_update_for_organisers
on public.problem_statements
for update
to authenticated
using ((select public.is_organiser()))
with check ((select public.is_organiser()));

drop policy if exists problem_statements_delete_for_organisers
  on public.problem_statements;

create policy problem_statements_delete_for_organisers
on public.problem_statements
for delete
to authenticated
using ((select public.is_organiser()));

-- -------------------------------------------------------------- contest teams

create table if not exists public.contest_teams (
  id uuid primary key default gen_random_uuid(),
  code text not null
    check (char_length(code) between 1 and 16),
  name text not null
    check (char_length(name) between 1 and 80),
  project_title text
    check (char_length(project_title) <= 160),
  summary text
    check (char_length(summary) <= 1000),
  problem_statement_id uuid
    references public.problem_statements(id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'qualified', 'eliminated', 'finalist', 'winner')),
  placement smallint
    check (placement between 1 and 3),
  repo_url text
    check (repo_url ~ '^https://'),
  demo_url text
    check (demo_url ~ '^https://'),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists contest_teams_code_uidx
  on public.contest_teams (lower(code));

drop trigger if exists contest_teams_touch_updated_at
  on public.contest_teams;

create trigger contest_teams_touch_updated_at
before update on public.contest_teams
for each row
execute function public.touch_updated_at();

create table if not exists public.contest_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null
    references public.contest_teams(id) on delete cascade,
  -- Links the member to their registration when they registered online or
  -- were imported; null for anyone added by hand.
  registration_id uuid
    references public.registrations(id) on delete set null,
  name text not null
    check (char_length(name) between 1 and 120),
  role text not null default 'developer'
    check (role in ('lead', 'developer', 'mentor')),
  year_of_study text
    check (year_of_study in ('1st', '2nd', '3rd', '4th')),
  github_url text
    check (github_url ~ '^https://'),
  linkedin_url text
    check (linkedin_url ~ '^https://'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Nobody is on two teams.
create unique index if not exists contest_team_members_registration_uidx
  on public.contest_team_members (registration_id)
  where registration_id is not null;

create index if not exists contest_team_members_team_idx
  on public.contest_team_members (team_id);

alter table public.contest_teams enable row level security;
alter table public.contest_team_members enable row level security;

revoke all on table public.contest_teams
  from public, anon, authenticated;

revoke all on table public.contest_team_members
  from public, anon, authenticated;

grant select, insert, update, delete on table public.contest_teams
  to authenticated;

grant select, insert, update, delete on table public.contest_team_members
  to authenticated;

drop policy if exists contest_teams_read on public.contest_teams;

create policy contest_teams_read
on public.contest_teams
for select
to authenticated
using (is_published or (select public.is_organiser()));

drop policy if exists contest_teams_insert_for_organisers on public.contest_teams;

create policy contest_teams_insert_for_organisers
on public.contest_teams
for insert
to authenticated
with check ((select public.is_organiser()));

drop policy if exists contest_teams_update_for_organisers on public.contest_teams;

create policy contest_teams_update_for_organisers
on public.contest_teams
for update
to authenticated
using ((select public.is_organiser()))
with check ((select public.is_organiser()));

drop policy if exists contest_teams_delete_for_organisers on public.contest_teams;

create policy contest_teams_delete_for_organisers
on public.contest_teams
for delete
to authenticated
using ((select public.is_organiser()));

drop policy if exists contest_team_members_read on public.contest_team_members;

create policy contest_team_members_read
on public.contest_team_members
for select
to authenticated
using (
  exists (
    select 1
    from public.contest_teams as t
    where t.id = team_id
      and t.is_published
  )
  or (select public.is_organiser())
);

drop policy if exists contest_team_members_insert_for_organisers
  on public.contest_team_members;

create policy contest_team_members_insert_for_organisers
on public.contest_team_members
for insert
to authenticated
with check ((select public.is_organiser()));

drop policy if exists contest_team_members_update_for_organisers
  on public.contest_team_members;

create policy contest_team_members_update_for_organisers
on public.contest_team_members
for update
to authenticated
using ((select public.is_organiser()))
with check ((select public.is_organiser()));

drop policy if exists contest_team_members_delete_for_organisers
  on public.contest_team_members;

create policy contest_team_members_delete_for_organisers
on public.contest_team_members
for delete
to authenticated
using ((select public.is_organiser()));

-- ------------------------------------------------------- organiser accounts

-- Super admins manage roles from /admin/users instead of the SQL editor.
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  role text,
  is_active boolean,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if public.current_admin_role() is distinct from 'super_admin' then
    raise exception 'Only super admins can manage organiser accounts.'
      using errcode = '42501';
  end if;

  return query
    select au.user_id, au.email, au.role::text, au.is_active, u.last_sign_in_at, au.created_at
    from public.admin_users as au
    left join auth.users as u on u.id = au.user_id
    order by au.created_at;
end;
$function$;

revoke execute on function public.admin_list_users()
  from public, anon;

grant execute on function public.admin_list_users()
  to authenticated;

create or replace function public.admin_set_user(
  target_email text,
  target_role text,
  target_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_email text;
begin
  if public.current_admin_role() is distinct from 'super_admin' then
    raise exception 'Only super admins can manage organiser accounts.'
      using errcode = '42501';
  end if;

  if target_role not in ('super_admin', 'event_admin', 'judge') then
    raise exception 'Unknown role %.', target_role using errcode = '22023';
  end if;

  select u.id, lower(u.email)
    into v_user_id, v_email
  from auth.users as u
  where lower(u.email) = lower(btrim(target_email));

  if v_user_id is null then
    raise exception 'No account uses that email yet. Ask them to create one first.'
      using errcode = 'P0002';
  end if;

  if v_user_id = auth.uid() and (target_role <> 'super_admin' or not target_active) then
    raise exception 'You cannot remove your own super admin access.'
      using errcode = '42501';
  end if;

  insert into public.admin_users (user_id, email, role, is_active)
  values (v_user_id, v_email, target_role::public.admin_role, target_active)
  on conflict (user_id) do update
  set
    email = excluded.email,
    role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now();
end;
$function$;

revoke execute on function public.admin_set_user(text, text, boolean)
  from public, anon;

grant execute on function public.admin_set_user(text, text, boolean)
  to authenticated;

-- ------------------------------------------------------------------ audit log

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  table_name text not null,
  row_key text,
  action text not null
    check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb
);

create index if not exists audit_log_at_idx
  on public.audit_log (at desc);

alter table public.audit_log enable row level security;

revoke all on table public.audit_log
  from public, anon, authenticated;

grant select on table public.audit_log
  to authenticated;

drop policy if exists audit_log_read_for_super_admins on public.audit_log;

create policy audit_log_read_for_super_admins
on public.audit_log
for select
to authenticated
using ((select public.current_admin_role()) = 'super_admin');

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
begin
  if tg_op <> 'INSERT' then
    v_old := to_jsonb(old);
  end if;

  if tg_op <> 'DELETE' then
    v_new := to_jsonb(new);
  end if;

  v_row := coalesce(v_new, v_old);

  insert into public.audit_log (
    actor_id,
    actor_email,
    table_name,
    row_key,
    action,
    old_data,
    new_data
  )
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'user_id'),
    tg_op,
    v_old,
    v_new
  );

  return null;
end;
$function$;

revoke all on function public.write_audit_log()
  from public, anon, authenticated;

do $$
declare
  audited text;
begin
  foreach audited in array array[
    'site_content',
    'problem_statements',
    'contest_teams',
    'contest_team_members',
    'admin_users'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', audited || '_audit', audited);
    execute format(
      'create trigger %I after insert or update or delete on public.%I '
      'for each row execute function public.write_audit_log()',
      audited || '_audit',
      audited
    );
  end loop;
end
$$;

-- Registrations: only organiser decisions are audited, not every student edit.
drop trigger if exists registrations_audit on public.registrations;

create trigger registrations_audit
after update on public.registrations
for each row
when (
  old.status is distinct from new.status
  or old.admin_notes is distinct from new.admin_notes
)
execute function public.write_audit_log();

drop trigger if exists registrations_delete_audit on public.registrations;

create trigger registrations_delete_audit
after delete on public.registrations
for each row
execute function public.write_audit_log();
