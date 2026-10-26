
-- ANANTA registration records imported from Google Forms.
-- Only active super admins and event admins can read/update these rows.

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),

  source text not null default 'google_forms'
    check (source = 'google_forms'),

  -- Stable identifier from the import process, when available.
  source_response_id text,

  submitted_at timestamptz,
  participant_name text,
  participant_email text,

  status text not null default 'new'
    check (
      status in (
        'new',
        'reviewing',
        'accepted',
        'waitlisted',
        'rejected'
      )
    ),

  admin_notes text,

  -- Preserves original form answers without guessing the form's fields.
  form_response jsonb not null default '{}'::jsonb,

  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists registrations_source_response_uidx
  on public.registrations (source, source_response_id)
  where source_response_id is not null;

create index if not exists registrations_status_idx
  on public.registrations (status);

create index if not exists registrations_submitted_at_idx
  on public.registrations (submitted_at desc);

-- Keep updated_at current without allowing users to set it themselves.
create or replace function public.touch_registration_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

revoke all on function public.touch_registration_updated_at()
  from public, anon, authenticated;

drop trigger if exists registrations_touch_updated_at
  on public.registrations;

create trigger registrations_touch_updated_at
before update on public.registrations
for each row
execute function public.touch_registration_updated_at();

-- RLS and explicit grants work together.
alter table public.registrations enable row level security;

revoke all on table public.registrations
  from public, anon, authenticated;

grant select on table public.registrations
  to authenticated;

-- Organisers can change only status and internal notes through the Data API.
grant update (status, admin_notes)
  on table public.registrations
  to authenticated;

drop policy if exists registrations_read_for_organisers
  on public.registrations;

create policy registrations_read_for_organisers
on public.registrations
for select
to authenticated
using (
  (select public.current_admin_role())
  in ('super_admin', 'event_admin')
);

drop policy if exists registrations_update_for_organisers
  on public.registrations;

create policy registrations_update_for_organisers
on public.registrations
for update
to authenticated
using (
  (select public.current_admin_role())
  in ('super_admin', 'event_admin')
)
with check (
  (select public.current_admin_role())
  in ('super_admin', 'event_admin')
);
