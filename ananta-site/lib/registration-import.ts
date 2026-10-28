import { createHash } from 'node:crypto';

export type CsvRow = Record<string, string>;

export function normaliseHeader(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function findHeader(headers: string[], aliases: string[]): string | undefined {
  const lookup = new Map(
    headers.map((header) => [normaliseHeader(header), header] as const),
  );

  return aliases
    .map(normaliseHeader)
    .map((alias) => lookup.get(alias))
    .find((header): header is string => Boolean(header));
}

/**
 * Parse ISO timestamps as supplied. Parse slash/dash dates using India's
 * day-first convention when ambiguous and IST when no timezone is present.
 */
export function parseGoogleTimestamp(value?: string): string | null {
  const text = value?.trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text)) {
    const milliseconds = Date.parse(text);
    return Number.isNaN(milliseconds) ? null : new Date(milliseconds).toISOString();
  }

  const match = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i,
  );
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3]);
  let day = first;
  let month = second;

  // If only one field can be a month, use that to disambiguate.
  if (first > 12 && second <= 12) {
    day = first;
    month = second;
  } else if (second > 12 && first <= 12) {
    month = first;
    day = second;
  } else if (first > 12 || second > 12) {
    return null;
  }
  // Otherwise interpret ambiguous dates as DD/MM/YYYY for India.

  let hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const secondPart = Number(match[6] ?? 0);
  const meridiem = match[7]?.toUpperCase();

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
  } else if (hour > 23) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31 || minute > 59 || secondPart > 59) {
    return null;
  }

  // Create a UTC wall-clock representation first, then validate every part
  // so dates like 31/02/2026 cannot silently roll into March.
  const wallClock = new Date(Date.UTC(year, month - 1, day, hour, minute, secondPart));

  if (
    wallClock.getUTCFullYear() !== year ||
    wallClock.getUTCMonth() !== month - 1 ||
    wallClock.getUTCDate() !== day ||
    wallClock.getUTCHours() !== hour ||
    wallClock.getUTCMinutes() !== minute ||
    wallClock.getUTCSeconds() !== secondPart
  ) {
    return null;
  }

  // Google Forms timestamps are interpreted as Indian Standard Time when
  // the exported value has no explicit timezone.
  const indiaOffsetMinutes = 330;
  return new Date(wallClock.getTime() - indiaOffsetMinutes * 60_000).toISOString();
}

/**
 * Split import progress into true duplicates and new rows still awaiting import.
 * Duplicate counts include repeated rows in this CSV and responses already in DB.
 */
export function summariseImportProgress(
  rowsReceived: number,
  uniqueRows: number,
  existingRows: number,
  imported: number,
  newRows: number,
): { duplicatesSkipped: number; rowsNotImported: number } {
  const values = [rowsReceived, uniqueRows, existingRows, imported, newRows];
  if (
    values.some((value) => !Number.isSafeInteger(value) || value < 0) ||
    uniqueRows > rowsReceived ||
    existingRows > uniqueRows ||
    newRows !== uniqueRows - existingRows ||
    imported > newRows
  ) {
    throw new RangeError('Invalid CSV import progress counts.');
  }

  return {
    duplicatesSkipped: rowsReceived - uniqueRows + existingRows,
    rowsNotImported: newRows - imported,
  };
}

/** Stable across CSV column ordering and repeat exports with the same values. */
export function makeSourceId(row: CsvRow): string {
  const canonical = Object.entries(row)
    .map(([key, value]) => [normaliseHeader(key), value.trim()] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
