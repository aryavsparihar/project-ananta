'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { formatDateTime } from '@/lib/admin';
import { friendlyError } from '@/lib/portal';
import { useAdmin } from '@/components/admin/AdminFrame';
import styles from '@/components/admin/Admin.module.css';

const ROUNDS = [
  {
    id: 'ideation',
    label: 'Ideation',
    description: 'Problem definition, originality and a feasible plan.',
  },
  {
    id: 'uiux',
    label: 'UI / UX',
    description: 'Usability, completeness of the user flow and prototype quality.',
  },
  {
    id: 'review',
    label: 'Hands-on review',
    description: 'Working functionality, code integration, deployment and documentation.',
  },
  {
    id: 'final',
    label: 'The final',
    description: 'Live demo, impact, product quality and answers to questions.',
  },
] as const;

const CRITERIA = [
  {
    key: 'problem_understanding',
    label: 'Problem understanding',
    help: 'How clearly the team understands the target problem.',
  },
  {
    key: 'technical_execution',
    label: 'Technical execution',
    help: 'Architecture, implementation and engineering quality.',
  },
  {
    key: 'usability',
    label: 'Usability',
    help: 'Clarity, accessibility and the end-to-end user experience.',
  },
  {
    key: 'impact',
    label: 'Impact',
    help: 'Usefulness, originality and practical value.',
  },
  {
    key: 'presentation',
    label: 'Presentation',
    help: 'Demonstration quality and ability to explain decisions.',
  },
] as const;

type CriterionKey = (typeof CRITERIA)[number]['key'];
type RoundId = (typeof ROUNDS)[number]['id'];
type Team = {
  id: string;
  code: string;
  name: string;
  project_title: string | null;
  status: string;
  is_published: boolean;
};
type Score = {
  id?: string;
  team_id: string;
  judge_user_id: string;
  round_id: RoundId;
  problem_understanding: number;
  technical_execution: number;
  usability: number;
  impact: number;
  presentation: number;
  comments: string;
  is_submitted: boolean;
  submitted_at: string | null;
  updated_at?: string;
};

function blankScore(teamId: string, userId: string, round: RoundId): Score {
  return {
    team_id: teamId,
    judge_user_id: userId,
    round_id: round,
    problem_understanding: 0,
    technical_execution: 0,
    usability: 0,
    impact: 0,
    presentation: 0,
    comments: '',
    is_submitted: false,
    submitted_at: null,
  };
}

export default function JudgingAdmin() {
  const { role } = useAdmin();
  const isSuperAdmin = role === 'super_admin';
  const [round, setRound] = useState<RoundId>('ideation');
  const [teams, setTeams] = useState<Team[]>([]);
  const [userId, setUserId] = useState('');
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [loading, setLoading] = useState(true);
  const [busyTeam, setBusyTeam] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    const supabase = createClient();
    try {
      const [{ data: authData, error: authError }, teamResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('contest_teams')
          .select('id, code, name, project_title, status, is_published')
          .order('sort_order')
          .order('code'),
      ]);

      if (authError || !authData.user)
        throw new Error('Your session expired. Sign in again.');
      if (teamResult.error) throw teamResult.error;
      const activeUserId = authData.user.id;

      const { data: scoreData, error: scoreError } = await supabase
        .from('judging_scores')
        .select('*')
        .eq('round_id', round)
        .eq('judge_user_id', activeUserId);
      if (scoreError) throw scoreError;

      const nextTeams = (teamResult.data ?? []) as Team[];
      const nextScores: Record<string, Score> = {};
      for (const team of nextTeams) {
        nextScores[team.id] = blankScore(team.id, activeUserId, round);
      }
      for (const row of (scoreData ?? []) as Score[]) {
        nextScores[row.team_id] = row;
      }

      setUserId(activeUserId);
      setTeams(nextTeams);
      setScores(nextScores);
    } catch (error) {
      setNotice({
        kind: 'error',
        text: friendlyError(
          error,
          'Could not load judging data. Check that the judging migration has been applied.',
        ),
      });
    } finally {
      setLoading(false);
    }
  }, [round]);

  useEffect(() => {
    void load();
  }, [load]);

  const roundInfo = ROUNDS.find((item) => item.id === round) ?? ROUNDS[0];
  const submittedCount = useMemo(
    () => teams.filter((team) => scores[team.id]?.is_submitted).length,
    [teams, scores],
  );

  function updateScore(teamId: string, key: CriterionKey, value: number) {
    const safe = Number.isFinite(value)
      ? Math.max(0, Math.min(10, Math.round(value)))
      : 0;
    setScores((current) => ({
      ...current,
      [teamId]: { ...current[teamId], [key]: safe },
    }));
  }

  async function saveScore(team: Team, submit: boolean) {
    const score = scores[team.id] ?? blankScore(team.id, userId, round);
    if (!userId) return;

    setBusyTeam(team.id);
    setNotice(null);
    const payload = {
      ...score,
      team_id: team.id,
      judge_user_id: userId,
      round_id: round,
      is_submitted: submit,
      submitted_at: submit ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await createClient()
        .from('judging_scores')
        .upsert(payload, { onConflict: 'team_id,judge_user_id,round_id' })
        .select('*')
        .single();
      if (error) throw error;
      setScores((current) => ({ ...current, [team.id]: data as Score }));
      setNotice({
        kind: 'success',
        text: submit
          ? `Score submitted for ${team.code} · ${roundInfo.label}.`
          : `Draft saved for ${team.code} · ${roundInfo.label}.`,
      });
    } catch (error) {
      setNotice({
        kind: 'error',
        text: friendlyError(
          error,
          'Could not save this score. A submitted judge score is locked; ask a super admin if it needs reopening.',
        ),
      });
    } finally {
      setBusyTeam(null);
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>
            Judging <em>desk.</em>
          </h1>
          <p className={styles.intro}>
            Score each team for the selected round using the same five criteria. Drafts
            remain editable; submitted scores are locked for judges and can only be
            reopened by a super admin.
          </p>
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

      <div className={styles.card}>
        <label className={styles.field}>
          <span>Round</span>
          <select
            value={round}
            onChange={(event) => setRound(event.target.value as RoundId)}
          >
            {ROUNDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.muted}>{roundInfo.description}</p>
        <p className={styles.muted}>
          {loading
            ? 'Loading scores…'
            : `${submittedCount} of ${teams.length} teams submitted for this round.`}
        </p>
      </div>

      {!loading && teams.length === 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>No teams to score yet</h2>
          <p className={styles.muted}>
            Add teams and their members after the registration review, then return here to
            score them.
          </p>
          {role !== 'judge' && (
            <Link href="/admin/teams" className={styles.button}>
              Open team manager
            </Link>
          )}
        </div>
      )}

      <div className={styles.section}>
        {teams.map((team) => {
          const score = scores[team.id] ?? blankScore(team.id, userId, round);
          const total = CRITERIA.reduce(
            (sum, criterion) => sum + score[criterion.key],
            0,
          );
          const locked = score.is_submitted && !isSuperAdmin;
          return (
            <article key={team.id} className={styles.card}>
              <div className={styles.head}>
                <div>
                  <p className={`meta ${styles.kicker}`}>
                    {team.code} · {team.is_published ? 'Published' : 'Not public'}
                  </p>
                  <h2 className={styles.cardTitle}>{team.name}</h2>
                  {team.project_title && (
                    <p className={styles.muted}>{team.project_title}</p>
                  )}
                </div>
                <div>
                  <span className={`meta ${styles.kicker}`}>Total</span>
                  <strong>{total} / 50</strong>
                </div>
              </div>

              {score.is_submitted && (
                <p className={styles.success} role="status">
                  Submitted {score.submitted_at ? formatDateTime(score.submitted_at) : ''}
                  .{' '}
                  {locked
                    ? 'This score is locked.'
                    : 'Super admins can adjust or reopen it.'}
                </p>
              )}

              <div className={styles.grid}>
                {CRITERIA.map((criterion) => (
                  <label key={criterion.key} className={styles.field}>
                    <span>{criterion.label} (0–10)</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      required
                      value={score[criterion.key]}
                      disabled={locked || busyTeam !== null}
                      onChange={(event) =>
                        updateScore(team.id, criterion.key, Number(event.target.value))
                      }
                    />
                    <small className={styles.muted}>{criterion.help}</small>
                  </label>
                ))}
              </div>

              <label className={styles.field}>
                <span>Judge comments (optional)</span>
                <textarea
                  rows={3}
                  maxLength={4000}
                  value={score.comments}
                  disabled={locked || busyTeam !== null}
                  onChange={(event) =>
                    setScores((current) => ({
                      ...current,
                      [team.id]: { ...current[team.id], comments: event.target.value },
                    }))
                  }
                />
              </label>

              <div className={styles.actions}>
                {!locked && (
                  <>
                    <button
                      type="button"
                      className={styles.ghost}
                      disabled={busyTeam !== null}
                      onClick={() => void saveScore(team, false)}
                    >
                      {busyTeam === team.id ? 'Saving…' : 'Save draft'}
                    </button>
                    <button
                      type="button"
                      className={styles.button}
                      disabled={busyTeam !== null}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Submit the ${roundInfo.label} score for ${team.code}? Judges cannot edit it afterward.`,
                          )
                        ) {
                          void saveScore(team, true);
                        }
                      }}
                    >
                      Submit score
                    </button>
                  </>
                )}
                {locked && <span className={styles.muted}>Submitted and locked</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
