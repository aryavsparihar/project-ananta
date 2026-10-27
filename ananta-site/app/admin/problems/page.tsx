'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { formatDateTime } from '@/lib/admin';
import { friendlyError } from '@/lib/portal';
import styles from '@/components/admin/Admin.module.css';

type Statement = {
  id: string;
  code: string;
  title: string;
  domain: string | null;
  summary: string | null;
  body: string | null;
  resource_url: string | null;
  sort_order: number;
  is_published: boolean;
  updated_at: string;
};

type Draft = Omit<Statement, 'id' | 'updated_at'>;

const BLANK: Draft = {
  code: '',
  title: '',
  domain: '',
  summary: '',
  body: '',
  resource_url: '',
  sort_order: 0,
  is_published: false,
};

const toDraft = (s: Statement): Draft => ({
  code: s.code,
  title: s.title,
  domain: s.domain ?? '',
  summary: s.summary ?? '',
  body: s.body ?? '',
  resource_url: s.resource_url ?? '',
  sort_order: s.sort_order,
  is_published: s.is_published,
});

/** Empty strings become nulls, so the database stores "not set". */
const clean = (d: Draft) => ({
  code: d.code.trim(),
  title: d.title.trim(),
  domain: d.domain?.trim() || null,
  summary: d.summary?.trim() || null,
  body: d.body?.trim() || null,
  resource_url: d.resource_url?.trim() || null,
  sort_order: Number(d.sort_order) || 0,
  is_published: d.is_published,
});

export default function ProblemsAdmin() {
  const [items, setItems] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await createClient()
      .from('problem_statements')
      .select('*')
      .order('sort_order')
      .order('code');
    if (error) setNotice({ kind: 'error', text: error.message });
    setItems((data ?? []) as Statement[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(item: Statement | 'new') {
    setNotice(null);
    if (item === 'new') {
      setEditing('new');
      setDraft({ ...BLANK, sort_order: items.length + 1 });
    } else {
      setEditing(item.id);
      setDraft(toDraft(item));
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    const row = clean(draft);
    const { error } =
      editing === 'new'
        ? await supabase.from('problem_statements').insert(row)
        : await supabase.from('problem_statements').update(row).eq('id', editing!);
    setBusy(false);
    if (error) {
      setNotice({ kind: 'error', text: friendlyError(error) });
      return;
    }
    setEditing(null);
    setNotice({
      kind: 'success',
      text: row.is_published
        ? `${row.code} saved and live on /problems.`
        : `${row.code} saved as a draft. Participants cannot see it yet.`,
    });
    await load();
  }

  async function togglePublished(item: Statement) {
    setNotice(null);
    const { error } = await createClient()
      .from('problem_statements')
      .update({ is_published: !item.is_published })
      .eq('id', item.id);
    if (error) setNotice({ kind: 'error', text: error.message });
    await load();
  }

  async function remove(item: Statement) {
    if (!window.confirm(`Delete ${item.code}, "${item.title}"? This cannot be undone.`))
      return;
    const { error } = await createClient()
      .from('problem_statements')
      .delete()
      .eq('id', item.id);
    if (error) setNotice({ kind: 'error', text: error.message });
    await load();
  }

  const live = items.filter((i) => i.is_published).length;
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const form = (
    <form onSubmit={save} className={`${styles.card} ${styles.grid}`}>
      <div className={`${styles.grid} ${styles.grid3}`}>
        <label className={styles.field}>
          <span>Code</span>
          <input
            value={draft.code}
            onChange={(e) => set('code', e.target.value)}
            required
            maxLength={16}
            placeholder="PS-01"
          />
        </label>
        <label className={styles.field}>
          <span>Domain</span>
          <input
            value={draft.domain ?? ''}
            onChange={(e) => set('domain', e.target.value)}
            maxLength={80}
            placeholder="Campus life"
          />
        </label>
        <label className={styles.field}>
          <span>Order</span>
          <input
            type="number"
            value={draft.sort_order}
            onChange={(e) => set('sort_order', Number(e.target.value))}
          />
        </label>
      </div>
      <label className={styles.field}>
        <span>Title</span>
        <input
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          required
          maxLength={200}
        />
      </label>
      <label className={styles.field}>
        <span>Summary (one or two lines)</span>
        <textarea
          value={draft.summary ?? ''}
          onChange={(e) => set('summary', e.target.value)}
          maxLength={600}
        />
      </label>
      <label className={styles.field}>
        <span>Full statement</span>
        <textarea
          value={draft.body ?? ''}
          onChange={(e) => set('body', e.target.value)}
          maxLength={20000}
          rows={10}
        />
      </label>
      <label className={styles.field}>
        <span>Link to a full brief (optional, https://)</span>
        <input
          type="url"
          value={draft.resource_url ?? ''}
          onChange={(e) => set('resource_url', e.target.value)}
          pattern="https://.*"
        />
      </label>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={draft.is_published}
          onChange={(e) => set('is_published', e.target.checked)}
        />
        Published: visible to signed-in participants on /problems
      </label>
      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
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
          <p className={`meta ${styles.kicker}`}>ANANTA / Admin</p>
          <h1 className={styles.title}>
            Problem <em>statements.</em>
          </h1>
          <p className={styles.intro}>
            {live === 0
              ? 'Nothing is published, so /problems shows the sealed "to be released soon" brief.'
              : `${live} of ${items.length} published on /problems.`}{' '}
            Drafts are visible only here.
          </p>
        </div>
        {editing === null && (
          <button type="button" className={styles.button} onClick={() => edit('new')}>
            New statement
          </button>
        )}
      </header>

      {notice && (
        <p
          className={notice.kind === 'error' ? styles.error : styles.success}
          role="status"
        >
          {notice.text}
        </p>
      )}

      {editing === 'new' && form}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : items.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>No problem statements yet.</p>
      ) : (
        items.map((item) =>
          editing === item.id ? (
            <div key={item.id}>{form}</div>
          ) : (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>
                  {item.code} · {item.title}
                </h2>
                <span
                  className={`${styles.badge} ${item.is_published ? styles.badgeLive : ''}`}
                >
                  {item.is_published ? 'Live' : 'Draft'}
                </span>
              </div>
              {item.summary && <p>{item.summary}</p>}
              <p className={styles.muted}>
                {item.domain ? `${item.domain} · ` : ''}Updated{' '}
                {formatDateTime(item.updated_at)}
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.ghost} onClick={() => edit(item)}>
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => void togglePublished(item)}
                >
                  {item.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => void remove(item)}
                >
                  Delete
                </button>
              </div>
            </article>
          ),
        )
      )}
    </section>
  );
}
