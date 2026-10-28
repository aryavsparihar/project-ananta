'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import {
  CONSENT,
  CV_TYPES,
  validateCvUpload,
  EXPERIENCE,
  SKILLS,
  YEARS,
  friendlyError,
  normaliseUrl,
  type MyRegistration,
  type RegistrationForm as Form,
} from '@/lib/portal';
import styles from './Portal.module.css';

const CV_ACCEPT = ['.pdf', '.doc', '.docx', ...CV_TYPES].join(',');

const EMPTY: Form = {
  full_name: '',
  entry_number: '',
  year_of_study: '',
  phone: '',
  whatsapp: '',
  department: '',
  github_url: '',
  linkedin_url: '',
  skills: [],
  experience_level: '',
  project_idea: '',
  cv_path: null,
  consent: false,
};

function fromSaved(saved: MyRegistration): Form {
  return {
    full_name: saved.full_name ?? '',
    entry_number: saved.entry_number ?? '',
    year_of_study: saved.year_of_study ?? '',
    phone: saved.phone ?? '',
    whatsapp: saved.whatsapp ?? '',
    department: saved.department ?? '',
    github_url: saved.github_url ?? '',
    linkedin_url: saved.linkedin_url ?? '',
    skills: saved.skills ?? [],
    experience_level: saved.experience_level ?? '',
    project_idea: saved.project_idea ?? '',
    cv_path: saved.cv_path,
    consent: true,
  };
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );

type Props = {
  formOpen: boolean;
  closesAt: string;
  closesLabel: string;
  contactEmail: string;
};

export function RegistrationForm({
  formOpen,
  closesAt,
  closesLabel,
  contactEmail,
}: Props) {
  const top = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [saved, setSaved] = useState<MyRegistration | null>(null);
  const [editing, setEditing] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [open, setOpen] = useState(formOpen);

  // The clock is the visitor's, so check it after hydration, not during.
  useEffect(() => {
    setOpen(formOpen && Date.now() < Date.parse(closesAt));
  }, [formOpen, closesAt]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          window.location.replace('/login?next=/register/form');
          return;
        }
        const { data, error } = await supabase.rpc('my_registration');
        if (error) throw error;
        if (cancelled) return;
        setUserId(user.id);
        setEmail(user.email ?? '');
        if (data) {
          setSaved(data as MyRegistration);
          setForm(fromSaved(data as MyRegistration));
        }
      } catch (err) {
        if (!cancelled) setError(friendlyError(err, 'Could not load your registration.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleSkill = (skill: string) =>
    set(
      'skills',
      form.skills.includes(skill)
        ? form.skills.filter((s) => s !== skill)
        : [...form.skills, skill],
    );

  function pickCv(file: File | undefined) {
    setError('');
    if (!file) {
      setCvFile(null);
      return;
    }

    const validationError = validateCvUpload(file);
    if (validationError) {
      // Never keep an earlier selection after the user chose an invalid file.
      setCvFile(null);
      setError(validationError);
      return;
    }

    setCvFile(file);
  }

  async function viewCv() {
    if (!form.cv_path) return;
    try {
      const { data, error } = await createClient()
        .storage.from('cvs')
        .createSignedUrl(form.cv_path, 60);
      if (error || !data?.signedUrl) {
        throw error ?? new Error('Could not create a secure link for this CV.');
      }
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (err) {
      setError(friendlyError(err, 'Could not open the CV.'));
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (form.skills.length === 0) {
      setError('Choose at least one technical skill.');
      return;
    }
    if (!form.year_of_study || !form.experience_level) {
      setError('Choose your year of study and experience level.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const previousCv = saved?.cv_path ?? null;
    let cvPath = form.cv_path;
    let uploadedCvPath: string | null = null;

    try {
      if (cvFile) {
        const ext = (cvFile.name.split('.').pop() ?? 'pdf')
          .toLowerCase()
          .replace(/[^a-z]/g, '');
        cvPath = `${userId}/cv-${Date.now()}.${ext || 'pdf'}`;
        // Track the path before the request: an upload can commit even if the
        // browser loses the response.
        uploadedCvPath = cvPath;
        const { error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(cvPath, cvFile, { contentType: cvFile.type, upsert: false });
        if (uploadError) throw uploadError;
      }

      const { data, error } = await supabase.rpc('submit_registration', {
        form: {
          ...form,
          github_url: normaliseUrl(form.github_url),
          linkedin_url: normaliseUrl(form.linkedin_url),
          cv_path: cvPath,
        },
      });
      if (error) throw error;
      // The database now references the upload, so the failure cleanup must not
      // remove it even if deleting the previous CV subsequently fails.
      uploadedCvPath = null;

      // The old file is only removed once the new one is on record.
      if (cvFile && previousCv && previousCv !== cvPath) {
        try {
          const { error: removeError } = await supabase.storage
            .from('cvs')
            .remove([previousCv]);
          if (removeError) {
            console.error('Could not remove the previous CV:', removeError.message);
          }
        } catch (removeError) {
          console.error('Could not remove the previous CV after save:', removeError);
        }
      }

      const next = data as MyRegistration;
      setSaved(next);
      setForm(fromSaved(next));
      setCvFile(null);
      setEditing(false);
      setJustSaved(true);
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      let cleanupMessage = '';
      let registrationRecovered = false;

      if (uploadedCvPath) {
        // The request may time out after the database committed. Verify the
        // stored registration before deleting a file that might now be in use.
        try {
          const { data: currentRegistration, error: verifyError } =
            await supabase.rpc('my_registration');

          if (verifyError) {
            console.error(
              'Could not verify a CV upload after a failed save:',
              verifyError.message,
            );
            cleanupMessage =
              ' We could not verify whether the CV was saved, so its file was left ' +
              'in place to avoid breaking a saved entry. Reload before retrying.';
          } else if (
            (currentRegistration as MyRegistration | null)?.cv_path === uploadedCvPath
          ) {
            const recovered = currentRegistration as MyRegistration;
            setSaved(recovered);
            setForm(fromSaved(recovered));
            setCvFile(null);
            setEditing(false);
            setJustSaved(true);
            setError('');
            registrationRecovered = true;
          } else {
            const { error: cleanupError } = await supabase.storage
              .from('cvs')
              .remove([uploadedCvPath]);

            if (cleanupError) {
              console.error(
                'Could not remove an unreferenced CV upload:',
                cleanupError.message,
              );
              cleanupMessage =
                ' The uploaded CV could not be cleaned up automatically; ' +
                'contact the organisers if this repeats.';
            }
          }
        } catch (cleanupError) {
          console.error('Could not verify or clean up a CV upload:', cleanupError);
          cleanupMessage =
            ' We could not verify whether the CV was saved, so its file was left ' +
            'in place to avoid breaking a saved entry. Reload before retrying.';
        }
      }

      if (!registrationRecovered) {
        setError(
          `${friendlyError(err, 'Could not save your registration.')}${cleanupMessage}`,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={styles.message}>Loading your registration…</p>;
  }

  const showSummary = saved && !editing;

  return (
    <div ref={top}>
      {justSaved && (
        <p className={styles.success} role="status">
          Your registration is saved. Teams are formed by the organisers; you will see
          yours on your account page once it is announced.
        </p>
      )}

      {!open && (
        <p className={styles.message} role="status">
          Registration is closed{saved ? '. Your entry is on record.' : '.'} Write to{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a> if something needs
          changing.
        </p>
      )}

      {showSummary ? (
        <section className={styles.panels} aria-label="Your registration">
          <div className={styles.panel}>
            <span className={`${styles.status} ${styles.statusDone}`}>Registered</span>
            <h2>{saved.full_name}</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Entry no.</dt>
                <dd>{saved.entry_number}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{saved.year_of_study}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{saved.department}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{saved.email}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(saved.submitted_at)}</dd>
              </div>
              <div>
                <dt>Last edited</dt>
                <dd>{formatDate(saved.updated_at)}</dd>
              </div>
            </dl>
          </div>
          <div className={styles.panel}>
            <h2>Skills</h2>
            <p>{saved.skills.join(', ')}</p>
            <p className={styles.hint}>
              Experience:{' '}
              {EXPERIENCE.find((x) => x.value === saved.experience_level)?.label}
              {saved.cv_path ? ' · CV uploaded' : ''}
            </p>
            <div className={styles.actions}>
              {open && (
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setJustSaved(false);
                    setEditing(true);
                  }}
                >
                  Edit my entry
                </button>
              )}
              <Link href="/account" className={styles.ghost}>
                My account
              </Link>
            </div>
            {open && <p className={styles.hint}>You can edit until {closesLabel}.</p>}
          </div>
        </section>
      ) : open ? (
        <form onSubmit={submit} className={styles.form}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>About you</legend>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Full name <span className={styles.req}>*</span>
                </span>
                <input
                  value={form.full_name}
                  onChange={(e) => set('full_name', e.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  University entry number <span className={styles.req}>*</span>
                </span>
                <input
                  value={form.entry_number}
                  onChange={(e) => set('entry_number', e.target.value.toUpperCase())}
                  required
                  pattern="[A-Za-z0-9\/\-]{3,30}"
                  maxLength={30}
                  autoCapitalize="characters"
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Year of study <span className={styles.req}>*</span>
                </span>
                <select
                  value={form.year_of_study}
                  onChange={(e) => set('year_of_study', e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Choose
                  </option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y} year
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Department / School <span className={styles.req}>*</span>
                </span>
                <input
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="School of CSE"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <input value={email} readOnly aria-readonly="true" />
              <span className={styles.hint}>
                From your account. It cannot be changed here.
              </span>
            </label>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  Mobile number <span className={styles.req}>*</span>
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  required
                  pattern="[+0-9 \(\)\-]{10,20}"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>WhatsApp number (if different)</span>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => set('whatsapp', e.target.value)}
                  pattern="[+0-9 \(\)\-]{10,20}"
                  inputMode="tel"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Background and skills</legend>
            <p className={styles.groupNote}>
              Your academic background, technical skills and experience level help the
              organising committee understand participants&rsquo; strengths and interests
              while forming teams.
            </p>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  GitHub profile URL <span className={styles.req}>*</span>
                </span>
                <input
                  type="url"
                  value={form.github_url}
                  onChange={(e) => set('github_url', e.target.value)}
                  onBlur={(e) => set('github_url', normaliseUrl(e.target.value))}
                  required
                  placeholder="https://github.com/username"
                  inputMode="url"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>
                  LinkedIn profile URL <span className={styles.req}>*</span>
                </span>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => set('linkedin_url', e.target.value)}
                  onBlur={(e) => set('linkedin_url', normaliseUrl(e.target.value))}
                  required
                  placeholder="https://www.linkedin.com/in/name"
                  inputMode="url"
                />
              </label>
            </div>

            <div className={styles.field} role="group" aria-labelledby="skills-label">
              <span id="skills-label" className={styles.fieldLabel}>
                Technical skill to be opted <span className={styles.req}>*</span>
              </span>
              <ul className={styles.choices}>
                {SKILLS.map((skill) => (
                  <li key={skill}>
                    <label className={styles.chip}>
                      <input
                        type="checkbox"
                        checked={form.skills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                      />
                      {skill}
                    </label>
                  </li>
                ))}
              </ul>
              <span className={styles.hint}>Select all that apply.</span>
            </div>

            <div className={styles.field} role="radiogroup" aria-labelledby="level-label">
              <span id="level-label" className={styles.fieldLabel}>
                Experience level <span className={styles.req}>*</span>
              </span>
              <div className={styles.levels}>
                {EXPERIENCE.map((level) => (
                  <label key={level.value} className={styles.level}>
                    <input
                      type="radio"
                      name="experience_level"
                      value={level.value}
                      checked={form.experience_level === level.value}
                      onChange={() => set('experience_level', level.value)}
                      required
                    />
                    <strong>{level.label}</strong>
                    <span>{level.hint}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Project idea / area of interest</span>
              <textarea
                value={form.project_idea}
                onChange={(e) => set('project_idea', e.target.value)}
                maxLength={2000}
              />
            </label>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>
                Upload CV (PDF or Word, up to 5 MB)
              </span>
              <div className={styles.file}>
                <label className={styles.ghost}>
                  {form.cv_path || cvFile ? 'Replace CV' : 'Choose file'}
                  <input
                    className={styles.visuallyHiddenInput}
                    type="file"
                    accept={CV_ACCEPT}
                    onChange={(e) => pickCv(e.target.files?.[0])}
                  />
                </label>
                {cvFile ? (
                  <span className={styles.fileName}>{cvFile.name}</span>
                ) : form.cv_path ? (
                  <button type="button" className={styles.ghost} onClick={viewCv}>
                    View current CV
                  </button>
                ) : (
                  <span className={styles.hint}>Optional</span>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Consent</legend>
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set('consent', e.target.checked)}
                required
              />
              <span>{CONSENT}</span>
            </label>
          </fieldset>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button className={styles.submit} disabled={saving} type="submit">
            {saving ? 'Saving…' : saved ? 'Save changes' : 'Submit registration'}
          </button>

          {saved && (
            <button
              type="button"
              className={styles.ghost}
              onClick={() => {
                setForm(fromSaved(saved));
                setCvFile(null);
                setError('');
                setEditing(false);
              }}
            >
              Cancel
            </button>
          )}
        </form>
      ) : (
        <p className={styles.after}>
          <Link href="/account">Go to my account</Link>
        </p>
      )}

      {error && showSummary && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
