'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { createClient } from '@/lib/supabase';
import { downloadCsv } from '@/lib/admin';
import { EXPERIENCE, SKILLS, YEARS } from '@/lib/portal';
import styles from './registrations.module.css';

const STATUSES = ['new', 'reviewing', 'accepted', 'waitlisted', 'rejected'] as const;

type RegistrationStatus = (typeof STATUSES)[number];

type Registration = {
  id: string;
  source: 'google_forms' | 'website';
  participant_name: string | null;
  participant_email: string | null;
  submitted_at: string | null;
  imported_at: string;
  status: RegistrationStatus;
  admin_notes: string | null;
  form_response: Record<string, unknown>;
  entry_number: string | null;
  year_of_study: string | null;
  department: string | null;
  phone: string | null;
  whatsapp: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  skills: string[] | null;
  experience_level: string | null;
  project_idea: string | null;
  cv_path: string | null;
};

const SOURCE_LABEL = { website: 'Site form', google_forms: 'Google Form' } as const;

type Draft = {
  status: RegistrationStatus;
  admin_notes: string;
};

type Notice = {
  kind: 'success' | 'error';
  text: string;
};

function formatDate(value: string | null) {
  if (!value) return 'Not available';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function RegistrationsPage() {
  const fileInput = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<Registration[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('registrations')
        .select(
          'id, source, participant_name, participant_email, submitted_at, imported_at, status, admin_notes, form_response, entry_number, year_of_study, department, phone, whatsapp, github_url, linkedin_url, skills, experience_level, project_idea, cv_path',
        )
        .order('submitted_at', {
          ascending: false,
          nullsFirst: false,
        })
        .order('imported_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const loaded = (data ?? []) as Registration[];

      setRows(loaded);
      setDrafts(
        Object.fromEntries(
          loaded.map((row) => [
            row.id,
            {
              status: row.status,
              admin_notes: row.admin_notes ?? '',
            },
          ]),
        ),
      );
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Unable to load registrations.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const draft = drafts[row.id];
      const status = draft?.status ?? row.status;

      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesSource = sourceFilter === 'all' || row.source === sourceFilter;
      const matchesYear = yearFilter === 'all' || row.year_of_study === yearFilter;
      const matchesSkill =
        skillFilter === 'all' || (row.skills ?? []).includes(skillFilter);

      const matchesSearch =
        !query ||
        (row.participant_name ?? '').toLowerCase().includes(query) ||
        (row.participant_email ?? '').toLowerCase().includes(query) ||
        (row.entry_number ?? '').toLowerCase().includes(query);

      return (
        matchesStatus && matchesSource && matchesYear && matchesSkill && matchesSearch
      );
    });
  }, [rows, drafts, search, statusFilter, sourceFilter, yearFilter, skillFilter]);

  // Someone who used both the site form and the Google Form shows up twice.
  const duplicateEmails = useMemo(() => {
    const seen = new Map<string, number>();
    for (const row of rows) {
      const email = (row.participant_email ?? '').toLowerCase();
      if (email) seen.set(email, (seen.get(email) ?? 0) + 1);
    }
    return new Set([...seen].filter(([, n]) => n > 1).map(([email]) => email));
  }, [rows]);

  async function openCv(path: string) {
    const { data, error } = await createClient()
      .storage.from('cvs')
      .createSignedUrl(path, 120);
    if (error || !data?.signedUrl) {
      setNotice({ kind: 'error', text: error?.message ?? 'Could not open the CV.' });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  async function deleteRegistration(row: Registration) {
    if (
      !window.confirm(
        `Delete the registration for ${row.participant_name ?? 'this participant'}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setSavingId(row.id);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.from('registrations').delete().eq('id', row.id);
    if (!error && row.cv_path) await supabase.storage.from('cvs').remove([row.cv_path]);
    setSavingId(null);
    if (error) {
      setNotice({ kind: 'error', text: error.message });
      return;
    }
    setRows((current) => current.filter((r) => r.id !== row.id));
    setNotice({ kind: 'success', text: 'Registration deleted.' });
  }

  function exportCsv() {
    const experience = (value: string | null) =>
      EXPERIENCE.find((x) => x.value === value)?.label ?? '';
    downloadCsv(`ananta-registrations-${new Date().toISOString().slice(0, 10)}.csv`, [
      [
        'Source',
        'Submitted',
        'Status',
        'Full name',
        'Email',
        'Entry number',
        'Year',
        'Department',
        'Mobile',
        'WhatsApp',
        'GitHub',
        'LinkedIn',
        'Skills',
        'Experience',
        'Project idea',
        'CV',
        'Internal notes',
      ],
      ...filteredRows.map((row) => [
        SOURCE_LABEL[row.source],
        row.submitted_at,
        drafts[row.id]?.status ?? row.status,
        row.participant_name,
        row.participant_email,
        row.entry_number,
        row.year_of_study,
        row.department,
        row.phone,
        row.whatsapp,
        row.github_url,
        row.linkedin_url,
        (row.skills ?? []).join('; '),
        experience(row.experience_level),
        row.project_idea,
        row.cv_path ? 'Uploaded' : '',
        row.admin_notes,
      ]),
    ]);
  }

  function updateDraft(id: string, field: keyof Draft, value: string) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        status: current[id]?.status ?? 'new',
        admin_notes: current[id]?.admin_notes ?? '',
        [field]: value,
      },
    }));
  }

  async function saveRegistration(id: string) {
    const draft = drafts[id];

    if (!draft) return;

    setSavingId(id);
    setNotice(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('registrations')
        .update({
          status: draft.status,
          admin_notes: draft.admin_notes.trim() || null,
        })
        .eq('id', id);

      if (error) throw error;

      setRows((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                status: draft.status,
                admin_notes: draft.admin_notes.trim() || null,
              }
            : row,
        ),
      );

      setNotice({
        kind: 'success',
        text: 'Registration changes saved.',
      });
    } catch (error) {
      setNotice({
        kind: 'error',
        text:
          error instanceof Error ? error.message : 'Could not save registration changes.',
      });
    } finally {
      setSavingId(null);
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    // Let the same file be selected again after an unsuccessful import.
    event.target.value = '';

    if (!file) return;

    setImporting(true);
    setNotice(null);

    try {
      const body = new FormData();
      body.set('file', file);

      const response = await fetch('/api/admin/registrations/import', {
        method: 'POST',
        body,
      });

      const result = (await response.json()) as {
        error?: string;
        imported?: number;
        duplicates?: number;
      };

      if (!response.ok) {
        throw new Error(result.error ?? 'Registration import failed.');
      }

      setNotice({
        kind: 'success',
        text: `Import complete: ${result.imported ?? 0} new rows added; ${
          result.duplicates ?? 0
        } duplicate rows skipped.`,
      });

      await loadRegistrations();
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Registration import failed.',
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>ANANTA / Admin</p>
            <h1>
              Registrations<span>.</span>
            </h1>
            <p className={styles.intro}>
              Entries from the site&rsquo;s own form arrive here as they are submitted.
              Google Form responses still come in through a CSV import. Review, keep
              internal notes, and export what you filter.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={exportCsv}
              disabled={loading || filteredRows.length === 0}
            >
              Export CSV ({filteredRows.length})
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void loadRegistrations()}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </header>

        <section className={styles.summary}>
          <div>
            <span>Total loaded</span>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <span>New</span>
            <strong>{rows.filter((row) => row.status === 'new').length}</strong>
          </div>
          <div>
            <span>Accepted</span>
            <strong>{rows.filter((row) => row.status === 'accepted').length}</strong>
          </div>
          <div>
            <span>Site form</span>
            <strong>{rows.filter((row) => row.source === 'website').length}</strong>
          </div>
          <div>
            <span>Google Form</span>
            <strong>{rows.filter((row) => row.source === 'google_forms').length}</strong>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <span>Search participants</span>
              <input
                type="search"
                placeholder="Name, email or entry number"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className={styles.filter}>
              <span>Application status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filter}>
              <span>Source</span>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="all">Both</option>
                <option value="website">Site form</option>
                <option value="google_forms">Google Form</option>
              </select>
            </label>

            <label className={styles.filter}>
              <span>Year</span>
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
              >
                <option value="all">All years</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filter}>
              <span>Skill</span>
              <select
                value={skillFilter}
                onChange={(event) => setSkillFilter(event.target.value)}
              >
                <option value="all">Any skill</option>
                {SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.importControl}>
              <input
                ref={fileInput}
                className={styles.fileInput}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void importCsv(event)}
                disabled={importing}
                aria-label="Select Google Forms CSV"
              />
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={importing}
              >
                {importing ? 'Importing…' : 'Import CSV'}
              </button>
            </div>
          </div>

          {notice && (
            <p
              className={
                notice.kind === 'error' ? styles.errorNotice : styles.successNotice
              }
              role="status"
            >
              {notice.text}
            </p>
          )}

          {loading ? (
            <p className={styles.empty}>Loading registrations…</p>
          ) : filteredRows.length === 0 ? (
            <div className={styles.empty}>
              <strong>No registrations found.</strong>
              <p>
                Entries from the site form appear here automatically. Import a CSV export
                from Google Forms, or adjust your search and filters.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Internal notes</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const draft = drafts[row.id] ?? {
                      status: row.status,
                      admin_notes: row.admin_notes ?? '',
                    };

                    return (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.participant_name || 'Unnamed'}</strong>
                          <span className={styles.email}>
                            {row.participant_email || 'No email'}
                          </span>
                          <span className={styles.badges}>
                            <span className={styles.badge}>
                              {SOURCE_LABEL[row.source]}
                            </span>
                            {duplicateEmails.has(
                              (row.participant_email ?? '').toLowerCase(),
                            ) && (
                              <span className={`${styles.badge} ${styles.badgeWarn}`}>
                                Registered twice
                              </span>
                            )}
                          </span>
                          {row.source === 'website' && (
                            <span className={styles.facts}>
                              {[
                                row.entry_number,
                                row.year_of_study && `${row.year_of_study} yr`,
                                row.department,
                                row.phone,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                              {(row.skills ?? []).length > 0 && (
                                <span className={styles.skills}>
                                  {(row.skills ?? []).join(', ')}
                                </span>
                              )}
                              <span className={styles.links}>
                                {row.github_url && (
                                  <a
                                    href={row.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    GitHub
                                  </a>
                                )}
                                {row.linkedin_url && (
                                  <a
                                    href={row.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    LinkedIn
                                  </a>
                                )}
                                {row.cv_path && (
                                  <button
                                    type="button"
                                    className={styles.linkButton}
                                    onClick={() => void openCv(row.cv_path!)}
                                  >
                                    CV
                                  </button>
                                )}
                              </span>
                            </span>
                          )}

                          <details className={styles.details}>
                            <summary>Original form answers</summary>
                            <dl>
                              {Object.entries(row.form_response ?? {}).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <dt>{key}</dt>
                                    <dd>{String(value ?? '') || 'Not answered'}</dd>
                                  </div>
                                ),
                              )}
                            </dl>
                          </details>
                        </td>

                        <td className={styles.date}>{formatDate(row.submitted_at)}</td>

                        <td>
                          <select
                            className={styles.statusSelect}
                            value={draft.status}
                            onChange={(event) =>
                              updateDraft(row.id, 'status', event.target.value)
                            }
                            aria-label={`Status for ${row.participant_name ?? 'participant'}`}
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <textarea
                            className={styles.notes}
                            value={draft.admin_notes}
                            maxLength={5000}
                            rows={2}
                            placeholder="Internal note…"
                            onChange={(event) =>
                              updateDraft(row.id, 'admin_notes', event.target.value)
                            }
                            aria-label={`Internal notes for ${row.participant_name ?? 'participant'}`}
                          />
                        </td>

                        <td>
                          <div className={styles.rowActions}>
                            <button
                              type="button"
                              className={styles.saveButton}
                              onClick={() => void saveRegistration(row.id)}
                              disabled={savingId === row.id}
                            >
                              {savingId === row.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className={styles.deleteButton}
                              onClick={() => void deleteRegistration(row)}
                              disabled={savingId === row.id}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className={styles.footerNote}>
            Showing up to 2,000 records. Only active super admins and event admins can
            view or update this data; the database enforces it.
          </p>
        </section>
      </div>
    </main>
  );
}
