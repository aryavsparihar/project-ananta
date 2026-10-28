-- Remove the provisional account-directory RPC. The application now uses
-- the role-checked server endpoint at /api/admin/accounts, which intentionally
-- hides organiser accounts from event admins. IF EXISTS keeps this safe for
-- fresh databases where the provisional functions were never created.
drop function if exists public.admin_list_accounts();
drop function if exists private.admin_list_accounts();
