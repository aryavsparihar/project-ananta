'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { formatDateTime, refreshPublicPages } from '@/lib/admin';
import {
  CONTENT_DEFAULTS,
  SECTIONS,
  validateSection,
  type Section,
  type SectionKey,
} from '@/lib/content-sections';
import styles from '@/components/admin/Admin.module.css';

type Row = { key: string; value: unknown; updated_at: string };
type Flat = Record<string, string | number | boolean | string[]>;

/** A section edits as a plain form when every value is a scalar or a list of strings. */
function isFlat(value: unknown): value is Flat {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (v) =>
        ['string', 'number', 'boolean'].includes(typeof v) ||
        (Array.isArray(v) && v.every((x) => typeof x === 'string')),
    )
  );
}

const LONG_TEXT = /note|text|blurb|tagline|association/i;

export default function ContentAdmin() {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<SectionKey | null>(null);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await createClient()
      .from('site_content')
      .select('key, value, updated_at');
    if (error) setNotice({ kind: 'error', text: error.message });
    setRows(Object.fromEntries((data ?? []).map((r) => [r.key, r as Row])));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function afterWrite(text: string) {
    const refreshed = await refreshPublicPages();
    setNotice({
      kind: 'success',
      text: refreshed
        ? `${text} The public pages are updated.`
        : `${text} The public pages pick it up within five minutes.`,
    });
    setOpen(null);
    await load();
  }

  return (
    <section className={styles.page}>
      <header className={styles.head}>
        <div>
          <p className={`meta ${styles.kicker}`}>ANANTA / Admin</p>
          <h1 className={styles.title}>
            Site <em>content.</em>
          </h1>
          <p className={styles.intro}>
            Every section starts from the version shipped with the site. Saving here
            overrides it on every page that uses it; resetting brings the shipped version
            back. A change is checked before it is saved, so a typo cannot break a page.
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

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        SECTIONS.map((section) => {
          const row = rows[section.key];
          return (
            <article key={section.key} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>{section.title}</h2>
                <span className={`${styles.badge} ${row ? styles.badgeLive : ''}`}>
                  {row
                    ? `Customised ${formatDateTime(row.updated_at)}`
                    : 'Shipped default'}
                </span>
              </div>
              <p className={styles.muted}>{section.description}</p>

              {open === section.key ? (
                <Editor
                  section={section}
                  initial={row ? row.value : CONTENT_DEFAULTS[section.key]}
                  customised={Boolean(row)}
                  onCancel={() => setOpen(null)}
                  onSaved={afterWrite}
                />
              ) : (
                <div className={styles.actions} style={{ marginTop: 'var(--s-3)' }}>
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => {
                      setNotice(null);
                      setOpen(section.key);
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}

function Editor({
  section,
  initial,
  customised,
  onCancel,
  onSaved,
}: {
  section: Section;
  initial: unknown;
  customised: boolean;
  onCancel: () => void;
  onSaved: (text: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<'form' | 'json'>(isFlat(initial) ? 'form' : 'json');
  const [flat, setFlat] = useState<Flat>(isFlat(initial) ? initial : {});
  const [json, setJson] = useState(JSON.stringify(initial, null, 2));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function current(): { value?: unknown; errors: string[] } {
    let value: unknown;
    if (mode === 'form') {
      value = flat;
    } else {
      try {
        value = JSON.parse(json);
      } catch (err) {
        return { errors: [`Not valid JSON: ${(err as Error).message}`] };
      }
    }
    return { value, errors: validateSection(section.key, value) };
  }

  function switchMode() {
    const { value, errors } = current();
    if (mode === 'form') {
      setJson(JSON.stringify(value, null, 2));
      setMode('json');
    } else if (errors.length === 0 && isFlat(value)) {
      setFlat(value);
      setMode('form');
    } else {
      setErrors(
        errors.length ? errors : ['This content has nested lists; edit it as JSON.'],
      );
    }
  }

  async function save() {
    const { value, errors } = current();
    setErrors(errors);
    if (errors.length) return;
    setBusy(true);
    const { error } = await createClient()
      .from('site_content')
      .upsert({ key: section.key, value });
    setBusy(false);
    if (error) {
      setErrors([error.message]);
      return;
    }
    await onSaved(`${section.title} saved.`);
  }

  async function reset() {
    if (!window.confirm(`Put ${section.title} back to the shipped version?`)) return;
    setBusy(true);
    const { error } = await createClient()
      .from('site_content')
      .delete()
      .eq('key', section.key);
    setBusy(false);
    if (error) {
      setErrors([error.message]);
      return;
    }
    await onSaved(`${section.title} reset to the shipped version.`);
  }

  const setField = (key: string, value: Flat[string]) =>
    setFlat((f) => ({ ...f, [key]: value }));

  return (
    <div className={styles.grid} style={{ marginTop: 'var(--s-4)' }}>
      {mode === 'form' ? (
        <div className={`${styles.grid} ${styles.grid2}`}>
          {Object.entries(flat).map(([key, value]) => {
            if (typeof value === 'boolean') {
              return (
                <label key={key} className={`${styles.check} ${styles.span2}`}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setField(key, e.target.checked)}
                  />
                  {key}
                </label>
              );
            }
            if (Array.isArray(value)) {
              return (
                <label key={key} className={styles.field}>
                  <span>{key} (comma-separated)</span>
                  <input
                    value={value.join(', ')}
                    onChange={(e) =>
                      setField(
                        key,
                        e.target.value
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
              );
            }
            if (typeof value === 'number') {
              return (
                <label key={key} className={styles.field}>
                  <span>{key}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setField(key, Number(e.target.value))}
                  />
                </label>
              );
            }
            const long = LONG_TEXT.test(key) || value.length > 70;
            return (
              <label key={key} className={`${styles.field} ${long ? styles.span2 : ''}`}>
                <span>{key}</span>
                {long ? (
                  <textarea
                    value={value}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                ) : (
                  <input value={value} onChange={(e) => setField(key, e.target.value)} />
                )}
              </label>
            );
          })}
        </div>
      ) : (
        <label className={styles.field}>
          <span>JSON</span>
          <textarea
            className={styles.code}
            value={json}
            spellCheck={false}
            onChange={(e) => setJson(e.target.value)}
          />
        </label>
      )}

      {errors.length > 0 && (
        <div className={styles.error} role="alert">
          Not saved. Fix these first:
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.button} disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className={styles.ghost} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={styles.ghost} onClick={switchMode}>
          {mode === 'form' ? 'Edit as JSON' : 'Edit as a form'}
        </button>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => {
            setJson(JSON.stringify(CONTENT_DEFAULTS[section.key], null, 2));
            setMode('json');
            setErrors([]);
          }}
        >
          Load shipped version
        </button>
        {customised && (
          <button type="button" className={styles.danger} disabled={busy} onClick={reset}>
            Reset to shipped
          </button>
        )}
      </div>
    </div>
  );
}
