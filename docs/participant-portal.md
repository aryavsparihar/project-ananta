# Participant portal: go-live checklist

The site now has student accounts, its own registration form, /problems,
/contest and an admin panel that edits every public section. The code is ready;
these steps happen once, on the Supabase project and on Vercel, by whoever has
access to them (Mayank).

## 1. Apply the migration

```sh
cd ananta-site
npx supabase link --project-ref <project ref>
npx supabase db push
```

This applies `supabase/migrations/20261027090000_participant_portal.sql`. It is
safe to run more than once. It adds `site_content`, `problem_statements`,
`contest_teams`, `contest_team_members`, `audit_log`, the website columns on
`registrations`, the private `cvs` storage bucket and the functions the pages
call. Until it is applied, the public pages simply show their shipped content
and the portal pages show a load error; nothing else breaks.

## 2. Email: custom SMTP (required before launch)

Supabase's built-in mailer sends only a handful of emails per hour for the whole
project. Every sign-up needs a confirmation email, so without custom SMTP most
students will never get theirs.

**Authentication > Emails > SMTP Settings**: turn on custom SMTP. Any provider
works (Resend, Brevo, SendGrid, or Google Workspace SMTP for
devgrowth@smvdu.ac.in with an app password). Then **Authentication > Rate
Limits**: raise "emails sent per hour" to match (300+ for launch day).

## 3. Email templates and redirect URLs

**Authentication > URL Configuration**

- Site URL: `https://project-ananta-zvut.vercel.app` (or the final domain)
- Redirect URLs: add `https://project-ananta-zvut.vercel.app/auth/confirm` and
  `http://localhost:3000/auth/confirm`

**Authentication > Emails > Templates**: so links work when opened on a
different device from the one that signed up (common: sign up on a laptop, open
mail on a phone), change the link in two templates:

- Confirm signup:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/register/form`
- Reset password:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/password`

The default links also work, but only in the browser that asked for them.

## 4. Optional: refuse non-university sign-ups at the source

Registration already refuses any address outside the allowed domains (set in
/admin/content > Participant portal). To stop such accounts being created at
all: **Authentication > Hooks > Before User Created**, choose the Postgres
function `public.hook_before_user_created`. While it is on, organiser accounts
on other domains need that domain added to the allowed list first.

## 5. Vercel

No new environment variables. `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are already set. Redeploy after the merge.

## How load is handled

- Every public page is static and served from Vercel's CDN. Content from
  `site_content` is fetched once per five minutes at most (and immediately after
  an organiser saves), not per visitor.
- Images are pre-built static files (`npm run images`), never resized per
  request, so there is no image-optimisation quota to run out of.
- Signed-in pages load their data straight from Supabase in the browser, so
  traffic to them does not queue on Vercel functions. The middleware only checks
  the session on /account, /register/form, /contest and /problems, and skips the
  Supabase call entirely when there is no session cookie.

## Day-to-day

| Task | Where |
| --- | --- |
| Review, note, export or delete entries; download CVs | /admin/registrations |
| Import Google Form responses | /admin/registrations > Import CSV |
| Form teams, publish them to /contest | /admin/teams |
| Write and release problem statements | /admin/problems |
| Dates, rounds, prizes, rules, team page, announcement bar, closing the form | /admin/content |
| Add or remove organisers | /admin/users (super admins) |
| Who changed what | /admin/audit (super admins) |
