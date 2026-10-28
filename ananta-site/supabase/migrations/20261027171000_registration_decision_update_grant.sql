-- Let authorised organisers update only registration review fields.
-- RLS still restricts rows to active super_admin/event_admin roles through
-- registrations_update_for_organisers. Participants cannot update registrations
-- directly; website submissions continue through submit_registration().

grant update (status, admin_notes)
  on table public.registrations
  to authenticated;
