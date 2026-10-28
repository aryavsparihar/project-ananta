-- Minimise participant data retained in future registration-decision audit entries.
-- Historical audit rows are intentionally left unchanged.

create or replace function public.write_registration_audit_log()
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
  if tg_op = 'DELETE' then
    -- Keep enough context to identify a deleted registration without duplicating
    -- the full form response, CV path, contact numbers, links, or other fields.
    v_old := jsonb_build_object(
      'id', old.id,
      'source', old.source,
      'participant_name', old.participant_name,
      'participant_email', old.participant_email,
      'status', old.status,
      'admin_notes', old.admin_notes
    );
  elsif tg_op = 'UPDATE' then
    -- The trigger only fires when status or internal notes change.
    v_old := jsonb_build_object(
      'id', old.id,
      'status', old.status,
      'admin_notes', old.admin_notes
    );
    v_new := jsonb_build_object(
      'id', new.id,
      'status', new.status,
      'admin_notes', new.admin_notes
    );
  else
    -- This function is attached only to decision updates and deletions.
    return null;
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
    v_row ->> 'id',
    tg_op,
    v_old,
    v_new
  );

  return null;
end;
$function$;

revoke all on function public.write_registration_audit_log()
  from public, anon, authenticated;

drop trigger if exists registrations_audit on public.registrations;
create trigger registrations_audit
after update on public.registrations
for each row
when (
  old.status is distinct from new.status
  or old.admin_notes is distinct from new.admin_notes
)
execute function public.write_registration_audit_log();

drop trigger if exists registrations_delete_audit on public.registrations;
create trigger registrations_delete_audit
after delete on public.registrations
for each row
execute function public.write_registration_audit_log();
