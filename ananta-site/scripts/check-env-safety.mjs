/**
 * Pre-build guard against the two ways a Supabase key escapes into the browser.
 *
 * 1. A server-only secret pasted into a NEXT_PUBLIC_* variable. Anything
 *    NEXT_PUBLIC_* is inlined into the client bundle at build time, so this
 *    would publish it to every visitor.
 * 2. A server-only env var read from a file that runs on the client.
 *
 * Fails the build. Checks only; it does not read, change or load any value
 * beyond the names and a substring test, and never prints a value.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Markers that mean "this is a server-side secret, not a publishable key". */
const SECRET_MARKERS = ['service_role', 'sb_secret', 'sbp_', 'SUPABASE_SERVICE_ROLE'];

/** Env vars that must never be referenced from a client component. */
const SERVER_ONLY_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_EMAILS',
];

const errors = [];

// 1. No NEXT_PUBLIC_* value may contain a server-secret marker.
for (const [name, value] of Object.entries(process.env)) {
  if (!name.startsWith('NEXT_PUBLIC_') || typeof value !== 'string') continue;
  const hit = SECRET_MARKERS.find((m) => value.toLowerCase().includes(m.toLowerCase()));
  if (hit) {
    errors.push(
      `${name} looks like a server-side secret (contains "${hit}").\n` +
        `    NEXT_PUBLIC_* is inlined into the client bundle and served to every visitor.\n` +
        `    Use the anon/publishable key here and keep the service-role key server-side.`,
    );
  }
}

// 2. No 'use client' file may read a server-only env var.
const SKIP = new Set(['node_modules', '.next', '.git', 'out', 'public', 'scripts']);

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* sourceFiles(full);
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry)) yield full;
  }
}

for (const file of sourceFiles(ROOT)) {
  const src = readFileSync(file, 'utf8');
  const isClient = /^\s*['"]use client['"]/m.test(src);
  if (!isClient) continue;
  for (const v of SERVER_ONLY_VARS) {
    if (src.includes(`process.env.${v}`)) {
      errors.push(
        `${relative(ROOT, file)} is a client component and reads process.env.${v}.\n` +
          `    Move that read to a server component, a route handler or middleware.`,
      );
    }
  }
}

if (errors.length) {
  console.error('\n  Environment safety check failed:\n');
  for (const e of errors) console.error(`  - ${e}\n`);
  process.exit(1);
}

console.log('env safety check passed');
