# ANANTA — event website starter

A multi-page Next.js website for the six-week ANANTA project hackathon. Design direction: editorial cream/ink/red, poster-inspired type, restrained paper texture, and an interactive Three.js sculptural loop. References inform layout and usability, not copied assets or copy.

## Pages

- Public site: `/`, `/about`, `/journey`, `/rules`, `/team`, `/glimpses`
- Registration handoff: `/register`
- Participant portal: `/signup`, `/login`, `/register/form`, `/account`, `/account/password`
- Participant data: `/problems`, `/contest`
- Admin: `/admin`, `/admin/dashboard`, `/admin/accounts`, `/admin/registrations`, `/admin/teams`, `/admin/problems`, `/admin/judging`, `/admin/content`, `/admin/users`, `/admin/audit`

## Run locally

1. Install Node.js 24 (see the repository-root `.nvmrc`).
2. Run `npm ci` from this directory.
3. Copy `.env.example` to `.env.local` and fill the Supabase URL and anon/publishable key.
4. Add `SUPABASE_SERVICE_ROLE_KEY` locally only if you need to test the Google Forms CSV import endpoint. It is server-only and must never use a `NEXT_PUBLIC_` prefix.
5. Run `npm run dev` and open `http://localhost:3000`.

## Supabase and admin setup

The current application uses the database-backed RBAC model, not the legacy `ADMIN_EMAILS` allowlist. Apply the three migration files in `supabase/migrations/` to the linked project. Confirm the migration list matches before testing the portal.

Organiser accounts need an active row in `public.admin_users` with the intended role. Super admins can invite a new organiser at `/admin/users`, or promote a confirmed existing account at `/admin/accounts`. If an invite email already has an Auth account, the invite action assigns the selected role instead of sending a duplicate invitation. The account directory also lists students who have not completed registration. Judges use `/admin/judging`; row-level security limits judges to their own scores. Do not expose the service-role key in browser code or preview deployments connected to production data.

The public site ships content defaults from `content/event.ts`. Organiser edits are optional overrides in `public.site_content`. Website registrations go through the database RPCs; students must not be given direct access to the full registrations table.

The registration form URL is set in `content/event.ts`. `NEXT_PUBLIC_REGISTRATION_URL` overrides it if the organiser-approved form changes.

## Before public deployment

- Confirm production migrations are applied and match local migration history.
- Verify email confirmation, password reset redirects, and the actual email delivery rate limits.
- Test signup, registration, CV access, admin role boundaries, CSV import, and audit logging using test accounts and test data.
- Keep `SUPABASE_SERVICE_ROLE_KEY` in the server environment only.

## Important

This is a runnable project scaffold, not a claim that registration records or event CMS data are already connected. It deliberately avoids inventing a live form URL, team data, sponsor data, or credentials. The sponsorship deck was used only for broad visual direction; sponsor packages and deck-only statistics are not included in site content.
