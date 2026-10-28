'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { friendlyError } from '@/lib/portal';
import styles from '@/components/admin/Admin.module.css';

const STATUSES = ['active', 'qualified', 'eliminated', 'finalist', 'winner'] as const;
const ROLES = ['lead', 'developer', 'mentor'] as const;
const YEARS = ['1st', '2nd', '3rd', '4th'] as const;

type Member = {
  id: string;
  team_id: string;
  registration_id: string | null;
  name: string;
  role: (typeof ROLES)[number];
  year_of_study: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  sort_order: number;
};

type Team = {
  id: string;
  code: string;
  name: string;
  project_title: string | null;
  summary: string | null;
  problem_statement_id: string | null;
  status: (typeof STATUSES)[number];
  placement: number | null;
  repo_url: string | null;
  demo_url: string | null;
  sort_order: number;
  is_published: boolean;
  contest_team_members: Member[];
};

type Registration = {
  id: string;
  participant_name: string | null;
  participant_email: string | null;
  year_of_study: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  status: string;
};

type TeamDraft = Omit<Team, 'id' | 'contest_team_members'>;

const blankTeam = (n: number): TeamDraft => ({
  code: `T-${String(n).padStart(2, '0')}`,
  name: '',
  project_title: '',
  summary: '',
  problem_statement_id: null,
  status: 'active',
  placement: null,
  repo_url: '',
  demo_url: '',
  sort_order: n,
  is_published: false,
});

const cleanTeam = (d: TeamDraft) => ({
  ...d,
  code: d.code.trim(),
  name: d.name.trim(),
  project_title: d.project_title?.trim() || null,
  summary: d.summary?.trim() || null,
  repo_url: d.repo_url?.trim() || null,
  demo_url: d.demo_url?.trim() || null,
  placement: d.placement || null,
  sort_order: Number(d.sort_order) || 0,
});

const ROLE_LABEL = { lead: 'Lead', developer: 'Developer', mentor: 'Mentor' } as const;

export default function TeamsAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [problems, setProblems] = useState<{ id: string; code: string; title: string }[]>(
    [],
  );
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<TeamDraft>(blankTeam(1));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [t, p, r] = await Promise.all([
      supabase
        .from('contest_teams')
        .select('*, contest_team_members(*)')
        .order('sort_order')
        .order('code'),
      supabase.from('problem_statements').select('id, code, title').order('sort_order'),
      supabase
        .from('registrations')
        .select(
          'id, participant_name, participant_email, year_of_study, github_url, linkedin_url, status',
        )
        .neq('status', 'rejected')
        .order('participant_name')
        .limit(2000),
    ]);
    const error = t.error ?? p.error ?? r.error;
    if (error) setNotice({ kind: 'error', text: error.message });
    setTeams((t.data ?? []) as Team[]);
    setProblems(p.data ?? []);
    setRegistrations((r.data ?? []) as Registration[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const assigned = useMemo(
    () =>
      new Set(
        teams.flatMap((t) =>
          t.contest_team_members.map((m) => m.registration_id).filter(Boolean),
        ),
      ),
    [teams],
  );
  const unassigned = registrations.filter((r) => !assigned.has(r.id));

  const run = async (
    action: () => PromiseLike<{ error: { message: string } | null }>,
    ok?: string,
  ) => {
    setBusy(true);
    setNotice(null);
    const { error } = await action();
    setBusy(false);
    if (error) {
      setNotice({ kind: 'error', text: friendlyError(error) });
      return false;
    }
    if (ok) setNotice({ kind: 'success', text: ok });
    await load();
    return true;
  };

  function startEdit(team: Team | 'new') {
    setNotice(null);
    if (team === 'new') {
      setEditing('new');
      setDraft(blankTeam(teams.length + 1));
    } else {
      setEditing(team.id);
      const { id: _id, contest_team_members: _m, ...rest } = team;
      setDraft({ ...rest });
    }
  }

  async function saveTeam(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const row = cleanTeam(draft);
    const supabase = createClient();
    const ok = await run(
      () =>
        editing === 'new'
          ? supabase.from('contest_teams').insert(row)
          : supabase.from('contest_teams').update(row).eq('id', editing!),
      `${row.code} saved.`,
    );
    if (ok) setEditing(null);
  }

  const setD = <K extends keyof TeamDraft>(key: K, value: TeamDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const published = teams.filter((t) => t.is_published).length;

  const teamForm = (
    <form onSubmit={saveTeam} className={`${styles.card} ${styles.grid}`}>
      <div className={`${styles.grid} ${styles.grid4}`}>
        <label className={styles.field}>
          <span>Code</span>
          <input
            value={draft.code}
            onChange={(e) => setD('code', e.target.value)}
            required
            maxLength={16}
          />
        </label>
        <label className={`${styles.field}`}>
          <span>Team name</span>
          <input
            value={draft.name}
            onChange={(e) => setD('name', e.target.value)}
            required
            maxLength={80}
          />
        </label>
        <label className={styles.field}>
          <span>Status</span>
          <select
            value={draft.status}
            onChange={(e) => setD('status', e.target.value as TeamDraft['status'])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Placement</span>
          <select
            value={draft.placement ?? ''}
            onChange={(e) =>
              setD('placement', e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">None</option>
            <option value="1">1st</option>
            <option value="2">2nd</option>
            <option value="3">3rd</option>
          </select>
        </label>
      </div>
      <div className={`${styles.grid} ${styles.grid2}`}>
        <label className={styles.field}>
          <span>Project title</span>
          <input
            value={draft.project_title ?? ''}
            onChange={(e) => setD('project_title', e.target.value)}
            maxLength={160}
          />
        </label>
        <label className={styles.field}>
          <span>Problem statement</span>
          <select
            value={draft.problem_statement_id ?? ''}
            onChange={(e) => setD('problem_statement_id', e.target.value || null)}
          >
            <option value="">Not chosen yet</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Live product URL</span>
          <input
            type="url"
            value={draft.demo_url ?? ''}
            onChange={(e) => setD('demo_url', e.target.value)}
            pattern="https://.*"
          />
        </label>
        <label className={styles.field}>
          <span>Repository URL</span>
          <input
            type="url"
            value={draft.repo_url ?? ''}
            onChange={(e) => setD('repo_url', e.target.value)}
            pattern="https://.*"
          />
        </label>
      </div>
      <label className={styles.field}>
        <span>Summary</span>
        <textarea
          value={draft.summary ?? ''}
          onChange={(e) => setD('summary', e.target.value)}
          maxLength={1000}
        />
      </label>
      <div className={styles.actions}>
        <label className={styles.field}>
          <span>Order</span>
          <input
            type="number"
            value={draft.sort_order}
            onChange={(e) => setD('sort_order', Number(e.target.value))}
            style={{ width: '6rem' }}
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.is_published}
            onChange={(e) => setD('is_published', e.target.checked)}
          />
          Published on /contest
        </label>
      </div>
      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={busy}>
          {busy ? 'Saving…' : 'Save team'}
        </button>
        <button type="button" className={styles.ghost} onClick={() => setEditing(null)}>
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Teams<em>.</em>
          </h1>
          <p className={styles.intro}>
            {teams.length} teams, {published} published on /contest. {unassigned.length}{' '}
            registrations are not on a team yet (rejected entries are left out). Each team
            needs a 3rd-year lead, 1st and 2nd-year developers, a 4th-year mentor and at
            least one woman.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.ghost}
            disabled={busy || teams.length === 0}
            onClick={() =>
              void run(
                () =>
                  createClient()
                    .from('contest_teams')
                    .update({ is_published: published < teams.length })
                    .not('id', 'is', null),
                published < teams.length
                  ? 'Every team is published.'
                  : 'Every team is hidden.',
              )
            }
          >
            {published < teams.length ? 'Publish all' : 'Unpublish all'}
          </button>
          {editing === null && (
            <button
              type="button"
              className={styles.button}
              onClick={() => startEdit('new')}
            >
              New team
            </button>
          )}
        </div>
      </header>

      {notice && (
        <p
          className={notice.kind === 'error' ? styles.error : styles.success}
          role="status"
        >
          {notice.text}
        </p>
      )}

      {editing === 'new' && teamForm}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : teams.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>No teams yet. Create the first one.</p>
      ) : (
        teams.map((team) =>
          editing === team.id ? (
            <div key={team.id}>{teamForm}</div>
          ) : (
            <TeamCard
              key={team.id}
              team={team}
              problems={problems}
              unassigned={unassigned}
              busy={busy}
              onEdit={() => startEdit(team)}
              run={run}
            />
          ),
        )
      )}
    </section>
  );
}

function TeamCard({
  team,
  problems,
  unassigned,
  busy,
  onEdit,
  run,
}: {
  team: Team;
  problems: { id: string; code: string; title: string }[];
  unassigned: Registration[];
  busy: boolean;
  onEdit: () => void;
  run: (
    action: () => PromiseLike<{ error: { message: string } | null }>,
    ok?: string,
  ) => Promise<boolean>;
}) {
  const [search, setSearch] = useState('');
  const [pick, setPick] = useState('');
  const [role, setRole] = useState<Member['role']>('developer');
  const [manualName, setManualName] = useState('');
  const [manualYear, setManualYear] = useState('');

  const members = [...team.contest_team_members].sort(
    (a, b) =>
      ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.sort_order - b.sort_order,
  );
  const ps = problems.find((p) => p.id === team.problem_statement_id);
  const warnings = [
    !members.some((m) => m.role === 'lead') && 'no lead',
    !members.some((m) => m.role === 'mentor') && 'no mentor',
  ].filter(Boolean);

  const q = search.trim().toLowerCase();
  const options = unassigned
    .filter(
      (r) =>
        !q ||
        (r.participant_name ?? '').toLowerCase().includes(q) ||
        (r.participant_email ?? '').toLowerCase().includes(q),
    )
    .slice(0, 200);

  async function addMember() {
    const supabase = createClient();
    const reg = unassigned.find((r) => r.id === pick);
    const name = reg?.participant_name?.trim() || manualName.trim();
    if (!name) return;
    const row = {
      team_id: team.id,
      registration_id: reg?.id ?? null,
      name,
      role,
      year_of_study: (reg?.year_of_study ?? manualYear) || null,
      github_url: reg?.github_url ?? null,
      linkedin_url: reg?.linkedin_url ?? null,
      sort_order: members.length + 1,
    };
    const ok = await run(() => supabase.from('contest_team_members').insert(row));
    if (ok) {
      setPick('');
      setManualName('');
      setManualYear('');
      setSearch('');
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>
          {team.code} · {team.name}
        </h2>
        <span className={styles.actions}>
          {warnings.length > 0 && (
            <span className={`${styles.badge} ${styles.badgeWarn}`}>
              {warnings.join(', ')}
            </span>
          )}
          <span className={styles.badge}>{team.status}</span>
          <span
            className={`${styles.badge} ${team.is_published ? styles.badgeLive : ''}`}
          >
            {team.is_published ? 'Published' : 'Hidden'}
          </span>
        </span>
      </div>
      <p className={styles.muted}>
        {team.project_title || 'No project title yet'}
        {ps ? ` · ${ps.code} ${ps.title}` : ''}
      </p>

      <ul className={styles.members}>
        {members.map((m) => (
          <li key={m.id} className={styles.member}>
            <span>
              <strong>{m.name}</strong>{' '}
              <span className={styles.muted}>
                {m.year_of_study ? `${m.year_of_study} yr` : ''}
                {m.registration_id ? '' : ' · added by hand'}
              </span>
            </span>
            <span className={styles.actions}>
              <select
                className={styles.input}
                value={m.role}
                aria-label={`Role for ${m.name}`}
                disabled={busy}
                onChange={(e) =>
                  void run(() =>
                    createClient()
                      .from('contest_team_members')
                      .update({ role: e.target.value })
                      .eq('id', m.id),
                  )
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.danger}
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    createClient().from('contest_team_members').delete().eq('id', m.id),
                  )
                }
              >
                Remove
              </button>
            </span>
          </li>
        ))}
        {members.length === 0 && <li className={styles.muted}>No members yet.</li>}
      </ul>

      <details className={styles.section}>
        <summary className="meta">Add a member</summary>
        <div
          className={`${styles.grid} ${styles.grid4}`}
          style={{ marginTop: 'var(--s-3)' }}
        >
          <label className={styles.field}>
            <span>Find a registration</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
            />
          </label>
          <label className={styles.field}>
            <span>Registration ({options.length})</span>
            <select value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Add by hand instead</option>
              {options.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.participant_name} · {r.year_of_study ?? '?'} · {r.status}
                </option>
              ))}
            </select>
          </label>
          {!pick && (
            <>
              <label className={styles.field}>
                <span>Name (by hand)</span>
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span>Year</span>
                <select
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value)}
                >
                  <option value="">Unknown</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className={styles.field}>
            <span>Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Member['role'])}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.actions} style={{ marginTop: 'var(--s-3)' }}>
          <button
            type="button"
            className={styles.button}
            disabled={busy || (!pick && !manualName.trim())}
            onClick={() => void addMember()}
          >
            Add to {team.code}
          </button>
        </div>
      </details>

      <div className={styles.actions} style={{ marginTop: 'var(--s-4)' }}>
        <button type="button" className={styles.ghost} onClick={onEdit}>
          Edit team
        </button>
        <button
          type="button"
          className={styles.ghost}
          disabled={busy}
          onClick={() =>
            void run(() =>
              createClient()
                .from('contest_teams')
                .update({ is_published: !team.is_published })
                .eq('id', team.id),
            )
          }
        >
          {team.is_published ? 'Unpublish' : 'Publish'}
        </button>
        <button
          type="button"
          className={styles.danger}
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Delete ${team.code} and its member list?`)) {
              void run(
                () => createClient().from('contest_teams').delete().eq('id', team.id),
                `${team.code} deleted.`,
              );
            }
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
