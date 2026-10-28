import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  findHeader,
  makeSourceId,
  normaliseHeader,
  parseGoogleTimestamp,
  summariseImportProgress,
  type CsvRow,
} from '@/lib/registration-import';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Keep this below common serverless request-body limits after multipart overhead.
const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_ROWS = 2000;
const BATCH_SIZE = 100;

const IMPORT_ROLES = ['super_admin', 'event_admin'] as const;

type RegistrationInsert = {
  source: 'google_forms';
  source_response_id: string;
  submitted_at: string | null;
  participant_name: string;
  participant_email: string;
  status: 'new';
  admin_notes: null;
  form_response: CsvRow;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type ImportAuditSummary = {
  outcome: 'complete' | 'partial_failure';
  rows_received: number;
  unique_rows: number;
  imported: number;
  duplicates_skipped: number;
  rows_not_imported: number;
  error_code?: string;
};

type AuditLogInsert = {
  actor_id: string;
  actor_email: string | null;
  table_name: 'registration_imports';
  row_key: string;
  action: 'INSERT';
  old_data: null;
  new_data: Record<string, unknown>;
};

type AuditLogWriter = {
  from: (table: 'audit_log') => {
    insert: (
      values: AuditLogInsert,
    ) => PromiseLike<{ error: { message: string } | null }>;
  };
};

/**
 * Record aggregate import activity without copying participant data into the
 * audit log. The privileged client is created only after the caller's role
 * has been verified by the route.
 */
async function writeImportAudit(
  adminClient: unknown,
  actor: { id: string; email?: string },
  summary: ImportAuditSummary,
): Promise<boolean> {
  // Supabase's client has no generated database schema types in this repo.
  // Narrow only this insert to the columns we intentionally write.
  const auditClient = adminClient as unknown as AuditLogWriter;
  const { error } = await auditClient.from('audit_log').insert({
    actor_id: actor.id,
    actor_email: actor.email ?? null,
    table_name: 'registration_imports',
    row_key: new Date().toISOString(),
    action: 'INSERT',
    old_data: null,
    new_data: {
      source: 'google_forms_csv',
      ...summary,
    },
  });

  if (error) {
    console.error('Could not write registration import audit entry:', error.message);
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Prefer the newer Supabase secret key; the legacy service-role key is
  // supported too. Either key must remain server-only.
  const privilegedKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !privilegedKey) {
    return jsonError('The registration import service is not configured.', 503);
  }

  // Mitigate cross-site form submissions. Browser requests to this endpoint
  // should provide Origin. Requests without Origin still require a valid
  // authenticated Supabase session below.
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return jsonError('Cross-origin requests are not allowed.', 403);
      }
    } catch {
      return jsonError('Invalid request origin.', 403);
    }
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_FILE_SIZE + 256 * 1024) {
    return jsonError('The uploaded request is too large.', 413);
  }

  // Authenticate with the caller's cookie-backed session before using any
  // privileged database key.
  const cookieStore = await cookies();
  const sessionClient = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // A cookie write can fail in a read-only context. Authentication is
          // still verified separately through getUser below.
        }
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return jsonError('Please sign in with an authorised organiser account.', 401);
  }

  const { data: role, error: roleError } = await sessionClient.rpc('current_admin_role');

  if (
    roleError ||
    typeof role !== 'string' ||
    !IMPORT_ROLES.includes(role as (typeof IMPORT_ROLES)[number])
  ) {
    return jsonError('You do not have permission to import registrations.', 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('Could not read the uploaded form data.', 400);
  }

  const file = form.get('file');
  if (!file || typeof file === 'string' || !file.name.toLowerCase().endsWith('.csv')) {
    return jsonError('Choose a CSV export from Google Forms.', 400);
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return jsonError('The CSV must be between 1 byte and 3 MB.', 400);
  }

  let grid: string[][];
  try {
    grid = parse(await file.text(), {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      max_record_size: 100_000,
      relax_column_count: false,
    }) as string[][];
  } catch {
    return jsonError(
      'The CSV could not be parsed. Re-export it from Google Sheets.',
      400,
    );
  }

  if (grid.length < 2) {
    return jsonError('The CSV must contain a header and at least one response row.', 400);
  }

  const headers = grid[0].map((header) => String(header ?? '').trim());
  if (headers.some((header) => !header)) {
    return jsonError('The CSV contains an empty column heading.', 400);
  }

  const normalisedHeaders = headers.map(normaliseHeader);
  if (
    normalisedHeaders.some((header) => !header) ||
    new Set(normalisedHeaders).size !== normalisedHeaders.length
  ) {
    return jsonError(
      'The CSV has missing or duplicate column headings. Rename the headings and export again.',
      400,
    );
  }

  const rawRows = grid.slice(1);
  if (rawRows.length > MAX_ROWS) {
    return jsonError(`Import at most ${MAX_ROWS} rows in one file.`, 400);
  }

  const records: CsvRow[] = [];
  for (let index = 0; index < rawRows.length; index += 1) {
    const values = rawRows[index];
    if (values.length !== headers.length) {
      return jsonError(
        `Row ${index + 2} has ${values.length} fields; expected ${headers.length}. Check commas and quotation marks in the CSV.`,
        400,
      );
    }

    const row: CsvRow = {};
    headers.forEach((header, columnIndex) => {
      row[header] = String(values[columnIndex] ?? '').trim();
    });
    records.push(row);
  }

  const nameHeader = findHeader(headers, [
    'participant name',
    'full name',
    'student name',
    'applicant name',
    'name of participant',
    'your name',
    'name',
  ]);

  const emailHeader = findHeader(headers, [
    'participant email',
    'email address',
    'student email',
    'college email',
    'email id',
    'your email',
    'email',
  ]);

  const timestampHeader = findHeader(headers, [
    'timestamp',
    'submitted at',
    'submission time',
    'submission timestamp',
  ]);

  if (!nameHeader || !emailHeader) {
    return NextResponse.json(
      {
        error:
          'Could not identify participant name and email columns. ' +
          'Use headings such as "Full Name" and "Email Address".',
        detectedHeaders: headers,
      },
      { status: 400 },
    );
  }

  // Validate every row before writing any records, so malformed CSV input
  // cannot leave a partially imported file just because a later row is bad.
  const validationErrors: string[] = [];
  const mapped: RegistrationInsert[] = [];

  records.forEach((row, index) => {
    const participantName = row[nameHeader]?.trim() ?? '';
    const participantEmail = row[emailHeader]?.trim().toLowerCase() ?? '';
    const timestampValue = timestampHeader ? row[timestampHeader] : undefined;
    const submittedAt = parseGoogleTimestamp(timestampValue);

    if (!participantName) {
      validationErrors.push(`Row ${index + 2} has no participant name.`);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participantEmail)) {
      validationErrors.push(`Row ${index + 2} has an invalid email address.`);
      return;
    }

    if (timestampValue?.trim() && !submittedAt) {
      validationErrors.push(`Row ${index + 2} has a timestamp that could not be parsed.`);
      return;
    }

    mapped.push({
      source: 'google_forms',
      source_response_id: makeSourceId(row),
      submitted_at: submittedAt,
      participant_name: participantName,
      participant_email: participantEmail,
      status: 'new',
      admin_notes: null,
      form_response: row,
    });
  });

  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        error: 'The CSV contains invalid rows. Nothing was imported.',
        details: validationErrors.slice(0, 20),
        totalErrors: validationErrors.length,
      },
      { status: 400 },
    );
  }

  // Collapse exact duplicate response rows in this file.
  const uniqueBySourceId = new Map<string, RegistrationInsert>();
  for (const record of mapped) {
    uniqueBySourceId.set(record.source_response_id, record);
  }

  const uniqueRows = [...uniqueBySourceId.values()];
  const sourceIds = uniqueRows.map((row) => row.source_response_id);

  // Only construct the privileged client after validating the signed-in
  // user's role. Never expose this key to browser code.
  const adminClient = createSupabaseClient(url, privilegedKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const existingIds = new Set<string>();
  for (let index = 0; index < sourceIds.length; index += BATCH_SIZE) {
    const batch = sourceIds.slice(index, index + BATCH_SIZE);
    const { data, error } = await adminClient
      .from('registrations')
      .select('source_response_id')
      .eq('source', 'google_forms')
      .in('source_response_id', batch);

    if (error) {
      console.error('Could not check existing registrations:', error.message);
      return jsonError('Could not check existing registrations before import.', 500);
    }

    for (const record of data ?? []) {
      if (record.source_response_id) existingIds.add(record.source_response_id);
    }
  }

  const newRows = uniqueRows.filter((row) => !existingIds.has(row.source_response_id));

  let imported = 0;
  for (let index = 0; index < newRows.length; index += BATCH_SIZE) {
    const batch = newRows.slice(index, index + BATCH_SIZE);
    const { error } = await adminClient.from('registrations').insert(batch);

    if (error) {
      // This can also occur if two imports race between the existence check
      // and insert. A retry is safe: the next request will detect prior rows.
      console.error('Registration import batch failed:', {
        code: error.code,
        imported,
      });

      const progress = summariseImportProgress(
        records.length,
        uniqueRows.length,
        existingIds.size,
        imported,
        newRows.length,
      );
      const auditLogged = await writeImportAudit(adminClient, user, {
        outcome: 'partial_failure',
        rows_received: records.length,
        unique_rows: uniqueRows.length,
        imported,
        duplicates_skipped: progress.duplicatesSkipped,
        rows_not_imported: progress.rowsNotImported,
        error_code: error.code,
      });

      return NextResponse.json(
        {
          error:
            `Import stopped after ${imported} rows. ` +
            'Review the database error in server logs, then retry the same CSV.',
          imported,
          rowsReceived: records.length,
          uniqueRows: uniqueRows.length,
          duplicatesSkipped: progress.duplicatesSkipped,
          rowsNotImported: progress.rowsNotImported,
          auditLogged,
        },
        { status: 500 },
      );
    }

    imported += batch.length;
  }

  const progress = summariseImportProgress(
    records.length,
    uniqueRows.length,
    existingIds.size,
    imported,
    newRows.length,
  );
  const result = {
    rowsReceived: records.length,
    uniqueRows: uniqueRows.length,
    imported,
    duplicatesSkipped: progress.duplicatesSkipped,
    rowsNotImported: progress.rowsNotImported,
  };

  const auditLogged = await writeImportAudit(adminClient, user, {
    outcome: 'complete',
    rows_received: result.rowsReceived,
    unique_rows: result.uniqueRows,
    imported: result.imported,
    duplicates_skipped: result.duplicatesSkipped,
    rows_not_imported: result.rowsNotImported,
  });

  return NextResponse.json({
    ...result,
    auditLogged,
    ...(auditLogged
      ? {}
      : {
          warning:
            'The import succeeded, but its audit entry could not be recorded. Contact a super admin and do not re-import solely to address this warning.',
        }),
  });
}
