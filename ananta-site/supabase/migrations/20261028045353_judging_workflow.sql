-- ANANTA judging workflow.
-- Judges can read teams prepared for review and score one team per round.
-- A judge may edit a draft, but a submitted score is locked to that judge.
-- Super admins can inspect and correct any score.

create table if not exists public.judging_scores (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.contest_teams(id) on delete cascade,
  judge_user_id uuid not null references auth.users(id) on delete cascade,
  round_id text not null check (round_id in ('ideation', 'uiux', 'review', 'final')),
  problem_understanding smallint not null default 0 check (problem_understanding between 0 and 10),
  technical_execution smallint not null default 0 check (technical_execution between 0 and 10),
  usability smallint not null default 0 check (usability between 0 and 10),
  impact smallint not null default 0 check (impact between 0 and 10),
  presentation smallint not null default 0 check (presentation between 0 and 10),
  comments text not null default '' check (char_length(comments) <= 4000),
  is_submitted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint judging_scores_team_judge_round_unique unique (team_id, judge_user_id, round_id),
  constraint judging_scores_submission_timestamp check (
    (is_submitted and submitted_at is not null)
    or (not is_submitted and submitted_at is null)
  )
);

create index if not exists judging_scores_round_team_idx
  on public.judging_scores (round_id, team_id);
create index if not exists judging_scores_judge_round_idx
  on public.judging_scores (judge_user_id, round_id);

alter table public.judging_scores enable row level security;
revoke all on table public.judging_scores from public, anon, authenticated;
grant select, insert, update, delete on table public.judging_scores to authenticated;

drop policy if exists judging_scores_read on public.judging_scores;
create policy judging_scores_read
on public.judging_scores
for select
to authenticated
using (
  (select public.current_admin_role()) = 'super_admin'
  or (
    judge_user_id = (select auth.uid())
    and (select public.current_admin_role()) = 'judge'
  )
);

drop policy if exists judging_scores_insert on public.judging_scores;
create policy judging_scores_insert
on public.judging_scores
for insert
to authenticated
with check (
  (select public.current_admin_role()) = 'super_admin'
  or (
    judge_user_id = (select auth.uid())
    and (select public.current_admin_role()) = 'judge'
  )
);

drop policy if exists judging_scores_update on public.judging_scores;
create policy judging_scores_update
on public.judging_scores
for update
to authenticated
using (
  (select public.current_admin_role()) = 'super_admin'
  or (
    judge_user_id = (select auth.uid())
    and (select public.current_admin_role()) = 'judge'
    and not is_submitted
  )
)
with check (
  (select public.current_admin_role()) = 'super_admin'
  or (
    judge_user_id = (select auth.uid())
    and (select public.current_admin_role()) = 'judge'
    and (not is_submitted or submitted_at is not null)
  )
);

drop policy if exists judging_scores_delete on public.judging_scores;
create policy judging_scores_delete
on public.judging_scores
for delete
to authenticated
using ((select public.current_admin_role()) = 'super_admin');

-- Judges need to inspect unpublished teams while scoring. Public visitors still
-- see only published teams; other organiser access continues through is_organiser().
drop policy if exists contest_teams_read on public.contest_teams;
create policy contest_teams_read
on public.contest_teams
for select
to authenticated
using (
  is_published
  or (select public.is_organiser())
  or (select public.current_admin_role()) = 'judge'
);

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
  or (select public.current_admin_role()) = 'judge'
);

comment on table public.judging_scores is
  'Private per-judge ANANTA rubric scores. Judges read their own records; super admins can inspect all scores.';
