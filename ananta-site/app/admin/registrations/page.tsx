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
import styles from './registrations.module.css';

const STATUSES = ['new', 'reviewing', 'accepted', 'waitlisted', 'rejected'] as const;

type RegistrationStatus = (typeof STATUSES)[number];

type Registration = {
  id: string;
  participant_name: string | null;
  participant_email: string | null;
  submitted_at: string | null;
  imported_at: string;
  status: RegistrationStatus;
  admin_notes: string | null;
  form_response: Record<string, unknown>;
};

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
          'id, participant_name, participant_email, submitted_at, imported_at, status, admin_notes, form_response',
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

      const matchesSearch =
        !query ||
        (row.participant_name ?? '').toLowerCase().includes(query) ||
        (row.participant_email ?? '').toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [rows, drafts, search, statusFilter]);

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
              Review imported applications and keep internal notes. Google Forms remains
              the registration intake.
            </p>
          </div>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void loadRegistrations()}
            disabled={loading}
          >
            Refresh
          </button>
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
        </section>

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <span>Search participants</span>
              <input
                type="search"
                placeholder="Name or email"
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
                Import a CSV export from Google Forms, or adjust your search and status
                filters.
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

                          <details className={styles.details}>
                            <summary>Original form answers</summary>
                            <dl>
                              {Object.entries(row.form_response ?? {}).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <dt>{key}</dt>
                                    <dd>{String(value ?? '—')}</dd>
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
                          <button
                            type="button"
                            className={styles.saveButton}
                            onClick={() => void saveRegistration(row.id)}
                            disabled={savingId === row.id}
                          >
                            {savingId === row.id ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className={styles.footerNote}>
            Showing up to 2,000 imported records. Only active super admins and event
            admins should be able to view or update this data.
          </p>
        </section>
      </div>
    </main>
  );
}
