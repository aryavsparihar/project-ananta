'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { friendlyError } from '@/lib/portal';
import { SocialLinks } from '@/components/SocialLinks';
import styles from './ContestBoard.module.css';

type Member = {
  id: string;
  name: string;
  role: 'lead' | 'developer' | 'mentor';
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
  status: 'active' | 'qualified' | 'eliminated' | 'finalist' | 'winner';
  placement: number | null;
  repo_url: string | null;
  demo_url: string | null;
  problem_statements: { code: string; title: string } | null;
  contest_team_members: Member[];
};

const ROLE_ORDER = { lead: 0, developer: 1, mentor: 2 } as const;
const ROLE_LABEL = { lead: 'Lead', developer: 'Developer', mentor: 'Mentor' } as const;
const STATUS_LABEL: Record<Team['status'], string> = {
  active: 'In the build',
  qualified: 'Qualified',
  eliminated: 'Eliminated',
  finalist: 'Finalist',
  winner: 'Winner',
};
const PLACE = ['', '1st', '2nd', '3rd'];
const TILTS = [-1.4, 1.1, -0.8, 1.6, -1.9, 0.7];

export function ContestBoard({ emptyNote }: { emptyNote: string }) {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await createClient()
          .from('contest_teams')
          .select(
            'id, code, name, project_title, summary, status, placement, repo_url, demo_url, problem_statements(code, title), contest_team_members(id, name, role, year_of_study, github_url, linkedin_url, sort_order)',
          )
          .eq('is_published', true)
          .order('sort_order')
          .order('code');
        if (error) throw error;
        if (!cancelled) setTeams((data ?? []) as unknown as Team[]);
      } catch (err) {
        if (!cancelled) setError(friendlyError(err, 'Could not load the teams.'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className={styles.note}>{error}</p>;
  if (!teams) return <p className={styles.note}>Loading the teams…</p>;

  if (teams.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>The board is still blank.</p>
        <p className={styles.note}>{emptyNote}</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const shown = q
    ? teams.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.project_title ?? '').toLowerCase().includes(q) ||
          t.contest_team_members.some((m) => m.name.toLowerCase().includes(q)),
      )
    : teams;

  return (
    <>
      <div className={styles.toolbar}>
        <p className="meta">
          {teams.length} {teams.length === 1 ? 'team' : 'teams'}
        </p>
        <label className={styles.search}>
          <span className="visually-hidden">Find a team or a person</span>
          <input
            type="search"
            placeholder="Find a team or a person"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <ul className={styles.board}>
        {shown.map((team, i) => {
          const members = [...team.contest_team_members].sort(
            (a, b) =>
              ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.sort_order - b.sort_order,
          );
          return (
            <li
              key={team.id}
              className={`${styles.team} ${team.status === 'eliminated' ? styles.out : ''}`}
              style={
                { '--rotate': `${TILTS[i % TILTS.length]}deg` } as React.CSSProperties
              }
            >
              <span className={styles.tape} aria-hidden="true" />
              <header className={styles.head}>
                <span className={styles.code}>{team.code}</span>
                <span className={`${styles.status} ${styles[team.status]}`}>
                  {team.placement
                    ? `${PLACE[team.placement]} place`
                    : STATUS_LABEL[team.status]}
                </span>
              </header>
              <h2 className={styles.name}>{team.name}</h2>
              {team.project_title && (
                <p className={styles.project}>{team.project_title}</p>
              )}
              {team.problem_statements && (
                <p className={styles.ps}>
                  <span className="meta">{team.problem_statements.code}</span>{' '}
                  {team.problem_statements.title}
                </p>
              )}
              {team.summary && <p className={styles.summary}>{team.summary}</p>}

              <ul className={styles.members}>
                {members.map((m) => (
                  <li key={m.id} className={styles.member}>
                    <span className={styles.memberName}>{m.name}</span>
                    <span className={styles.memberRole}>
                      {ROLE_LABEL[m.role]}
                      {m.year_of_study ? ` · ${m.year_of_study} yr` : ''}
                    </span>
                    <SocialLinks
                      name={m.name}
                      links={{ github: m.github_url, linkedin: m.linkedin_url }}
                      className={styles.memberLinks}
                    />
                  </li>
                ))}
              </ul>

              {(team.repo_url || team.demo_url) && (
                <p className={styles.links}>
                  {team.demo_url && (
                    <a href={team.demo_url} target="_blank" rel="noopener noreferrer">
                      Live product
                    </a>
                  )}
                  {team.repo_url && (
                    <a href={team.repo_url} target="_blank" rel="noopener noreferrer">
                      Repository
                    </a>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && (
        <p className={styles.note}>No team or person matches that.</p>
      )}
    </>
  );
}
