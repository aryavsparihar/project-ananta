# ANANTA — event website starter

A multi-page Next.js website for the six-week ANANTA project hackathon. Design direction: editorial cream/ink/red, poster-inspired type, restrained paper texture, and an interactive Three.js sculptural loop. References inform layout and usability, not copied assets or copy.

## Pages

- `/` Home / interactive 3D hero / event highlights
- `/about` About ANANTA
- `/journey` Four-round timeline and evaluation criteria
- `/rules` Team requirements and event rules
- `/register` Registration handoff to the organiser-approved form
- `/admin` Supabase sign-in
- `/admin/dashboard` Protected admin landing area

## Run locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the real values.
4. Run `npm run dev` and open `http://localhost:3000`.

## Admin setup (required before launch)

1. Create a Supabase project and add URL + anon key to `.env.local`.
2. Set `ADMIN_EMAILS` to the organiser emails allowed to administer the site, comma-separated.
3. In Supabase Authentication, create/invite that email as a user and set its password securely. Disable public signups if they are not needed.
4. The middleware checks the authenticated user's email against `ADMIN_EMAILS` for `/admin/*`. Do not expose service-role keys in browser code.
5. The dashboard intentionally indicates where database-backed features belong. Before enabling registration management, create the required tables and strict Row Level Security policies. Do not collect student data in an unprotected public table.
6. The registration form is set in `content/event.ts`. `NEXT_PUBLIC_REGISTRATION_URL` overrides it if the form ever changes.

## Before public deployment

- Registration closes 4 November 2026, 23:59 IST (confirmed); the countdown runs to it.
- Test admin auth once the Supabase project and `ADMIN_EMAILS` are set in the host.
- Add a proper database schema and admin CRUD actions before calling the admin panel complete.

## Important

This is a runnable project scaffold, not a claim that registration records or event CMS data are already connected. It deliberately avoids inventing a live form URL, team data, sponsor data, or credentials. The sponsorship deck was used only for broad visual direction; sponsor packages and deck-only statistics are not included in site content.
