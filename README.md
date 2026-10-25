# project-ananta

Website for **ANANTA** (अनन्त, "endless") — a six-week, project-based hackathon at the
School of CSE, SMVDU Katra, where every team ships one live product.

Presented by **SANGAM × DevGrowth × Code Club**, School of CSE, SMVDU Katra,
in association with the Board of Professional Activities.

**23 October – 4 December 2026.** Registration 23 Oct – 4 Nov; teams announced by 5 Nov.

The site is a Next.js app in [`ananta-site/`](ananta-site). Design direction comes from
the approved wall poster: newsprint paper, heavy condensed type, photocopied and taped
event photos, mono metadata.

---

## Setup

Node is pinned in [`.nvmrc`](.nvmrc).

```bash
nvm use                 # or install Node 24
cd ananta-site
npm install
cp .env.example .env.local
npm run dev             # http://localhost:3000
```

The public site needs nothing from `.env.local`: the registration form and every
event fact are in `content/event.ts`. Only `/admin` needs the Supabase values.

Once per clone, so `git blame` skips the reformat commit:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Recommended, to stop a secret before it is committed:

```bash
brew install gitleaks
```

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (runs the env safety check first) |
| `npm run lint` | ESLint, flat config |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier, write |
| `npm run format:check` | Prettier, check only — what CI runs |

CI runs `format:check`, `lint`, `typecheck` and `build` on every PR, plus a
gitleaks scan of the full history.

---

## Who owns what

Binding through [`.github/CODEOWNERS`](.github/CODEOWNERS); a PR needs the owner's
approval on the files it touches.

| Area | Owner |
|---|---|
| `lib/supabase.ts`, `middleware.ts`, `app/admin/**`, `supabase/**`, `.env.example` | **Mayank** — Supabase, auth, database, admin |
| Everything else — pages, design system, content, tooling, CI | **Aryaveer** — frontend, repo |

**The boundary is real.** Frontend work does not change Supabase logic, auth flow,
middleware behaviour or env handling. The admin pages can be restyled — markup and CSS
only. If a frontend change needs something from the backend, it goes in the PR
description as a note rather than being made across the boundary. Same the other way.

---

## Branches

`main` is protected: no direct pushes, no force pushes, PR plus one approval plus
green CI.

| Branch | For |
|---|---|
| `main` | Protected. Always deployable. |
| `design/site-redesign` | Aryaveer — site design and frontend |
| `feat/supabase-*` | Mayank — e.g. `feat/supabase-registrations` |

Work:

```bash
git switch main && git pull
git switch -c feat/supabase-registrations
# ... commit ...
git push -u origin feat/supabase-registrations
gh pr create            # fills in the PR template
```

Squash-merge; the branch is deleted on merge.

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org): `type(scope): subject`,
imperative, lower case, no trailing full stop.

`feat` · `fix` · `refactor` · `style` · `docs` · `test` · `build` · `ci` · `chore` · `perf`

```
feat(journey): render the four rounds as a build log
fix(nav): give the mobile toggle aria-expanded
chore: format
```

Say *why* in the body when it is not obvious from the subject.

---

## Content rules

The event facts — dates, marks, the prize split, attribution — live in
[`ananta-site/content/event.ts`](ananta-site/content/event.ts) and are imported by the
pages. Change a date there, not in a page. Never invent facts, numbers, sponsors or
testimonials.

### Changing the registration form

The form URL is `REGISTRATION_URL` in `content/event.ts`
(`NEXT_PUBLIC_REGISTRATION_URL` overrides it). `/register` also shows a QR code,
`public/register-qr.svg`, which encodes that URL. If the form changes, regenerate
the QR from the new URL with any QR tool (`npx qrcode -t svg -q 0 -o
ananta-site/public/register-qr.svg "<url>"`) and check it scans before merging.

### Adding a team member

The team page reads [`ananta-site/content/team.ts`](ananta-site/content/team.ts).
Nothing is in a database; editing that file is the whole job.

1. Drop the photo at `ananta-site/public/team/raw/<slug>.jpg`. Any size, any
   lighting — a phone photo is fine. Use the person's slug, e.g. `mukti-porwal.jpg`.
2. Add the entry to `team.ts` in the right group:

   ```ts
   {
     name: 'Mukti Porwal',
     role: 'PR Lead',
     group: 'organising-core',
     club: 'devgrowth',            // the person's own club; SANGAM only if none
     year: '3rd year',
     photo: 'mukti-porwal',        // the slug, no extension; omit for initials card
     linkedin: 'https://linkedin.com/in/…',
   }
   ```

3. Run `npm run team:photos`. It crops every raw photo to 4:5, applies the same
   paper treatment so mismatched phone photos read as one set, and writes AVIF and
   WebP at two sizes into `public/team/`.
4. `npm run dev` and check the board at `/team`.

Entries named `TODO Name` are placeholders so the layout can be judged; they
show as `TBC` cards on the board. **A production build fails while any remain**
(`VERCEL_ENV=production` or `ANANTA_ENV=production`); local and CI builds only
warn, so the branch stays green while you collect the real names.

No photo is fine: leave `photo` out and the person gets an initials card in their
club's colour.

---

## Repo maintenance

[`docs/history-cleanup.md`](docs/history-cleanup.md) has the `git filter-repo`
runbook for purging the committed `.next/` build output, the branch-protection
settings and where to switch on secret scanning. **It has not been run yet** — it
rewrites every commit SHA and needs both of us at our keyboards.
