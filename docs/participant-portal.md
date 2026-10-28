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

- Site URL: `https://project-ananta-zvut.vercel.app` (or the final custom domain)
- Redirect URLs: add `https://project-ananta-zvut.vercel.app/auth/confirm` and
  `http://localhost:3000/auth/confirm`. Add the callback for any other exact
  domain you actually use; do not allow arbitrary preview domains for production
  authentication.

**Authentication > Emails > Templates**: set each link to use Supabase's
`{{ .RedirectTo }}` variable. The app passes a callback URL that already
contains the safe `next` path, so append the token hash and email type using
`&amp;` separators in the HTML link.

- Confirm signup:
  `<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Confirm email address</a>`
- Reset password:
  `<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>`
- Invite user:
  `<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=invite">Accept invitation</a>`

For these templates, replace the link that uses `{{ .ConfirmationURL }}` with
the matching link above. `/auth/confirm` verifies `token_hash` and `type`
server-side, then redirects only to a safe relative `next` path. For invitations,
the API sets `next=/account/password`; for signup it uses the intended next path,
normally `/register/form`.

Save each template and keep its existing subject/body copy as appropriate.
Test with a controlled email address before sending invitations to organisers
or announcing registration. Supabase documents the `RedirectTo` template variable
and token-hash flow in its [email template guide](https://supabase.com/docs/guides/auth/auth-email-templates)
and [redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).

Make sure the production callback and local callback are in Supabase's redirect
allow-list. Default PKCE links may only complete in the browser that started the flow.

**Password security:** in **Authentication > Password Security**, enable leaked-password
protection so compromised passwords are rejected. Test signup, a controlled organiser
invitation and password reset after changing Auth settings.

## 4. Optional: refuse non-university sign-ups at the source

Registration already refuses any address outside the allowed domains (set in
/admin/content > Participant portal). To stop such accounts being created at
all: **Authentication > Hooks > Before User Created**, choose the Postgres
function `public.hook_before_user_created`. While it is on, organiser accounts
on other domains need that domain added to the allowed list first.

## 5. Vercel

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required in
  production and preview.
- `SUPABASE_SERVICE_ROLE_KEY` (or the server-only `SUPABASE_SECRET_KEY`) is used by protected server routes that need Auth Admin API access. Never prefix it with `NEXT_PUBLIC_`, read it in a client component or print it in logs. Keep the key server-side only.
- `NEXT_PUBLIC_SITE_URL` should be `https://project-ananta.vercel.app` for production and organiser invitation callbacks; the matching `/auth/confirm` callback must be allow-listed in Supabase.
- `ADMIN_EMAILS` is a legacy setting and is not used by the current RBAC
  middleware. Access comes from active rows in `public.admin_users`.
- Set the final public origin consistently in Supabase Auth URL Configuration.
  Redirect URLs must allow the production `/auth/confirm` route and the local
  development route used for testing.

Redeploy after configuration or code changes.

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
| Find students who signed in but have not registered | /admin/accounts (organisers) |\n| Grant organiser roles to confirmed accounts | /admin/accounts (super admins) or /admin/users |\n| Invite new organisers | /admin/users (super admins); requires the invite email template |\n| Score teams by round | /admin/judging (judges and super admins) |\n| Add or remove organisers | /admin/users (super admins) |
| Who changed what | /admin/audit (super admins) |
