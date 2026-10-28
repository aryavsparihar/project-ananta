import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAccountDirectory } from '../lib/account-directory.ts';

const users = [
  {
    id: 'student-a',
    email: 'a@smvdu.ac.in',
    created_at: '2026-10-20T10:00:00Z',
    email_confirmed_at: '2026-10-20T10:01:00Z',
    last_sign_in_at: '2026-10-27T10:00:00Z',
  },
  {
    id: 'student-b',
    email: 'b@smvdu.ac.in',
    created_at: '2026-10-22T10:00:00Z',
    email_confirmed_at: null,
    last_sign_in_at: null,
  },
  {
    id: 'admin-a',
    email: 'admin@smvdu.ac.in',
    created_at: '2026-10-21T10:00:00Z',
    email_confirmed_at: '2026-10-21T10:01:00Z',
    last_sign_in_at: '2026-10-28T09:00:00Z',
  },
];

const registrations = [
  {
    user_id: 'student-a',
    participant_email: 'a@smvdu.ac.in',
    participant_name: 'Student A',
    entry_number: '25BCS001',
    submitted_at: '2026-10-27T11:00:00Z',
    imported_at: '2026-10-27T11:00:00Z',
    source: 'website',
  },
];

const admins = [{ user_id: 'admin-a', role: 'event_admin', is_active: true }];

test('account directory distinguishes accounts from submitted registrations', () => {
  const rows = buildAccountDirectory(users, registrations, admins, false);
  const registered = rows.find((row) => row.email === 'a@smvdu.ac.in');
  const unregistered = rows.find((row) => row.email === 'b@smvdu.ac.in');

  assert.equal(registered.registrationStatus, 'registered');
  assert.equal(registered.participantName, 'Student A');
  assert.equal(registered.entryNumber, '25BCS001');
  assert.equal(registered.registrationSource, 'website');
  assert.equal(unregistered.registrationStatus, 'not_registered');
  assert.equal(unregistered.lastSignInAt, null);
});

test('legacy Google Form submissions match accounts by email when user IDs are absent', () => {
  const imported = {
    user_id: null,
    participant_email: ' B@SMVDU.AC.IN ',
    participant_name: 'Student B',
    entry_number: '25BCS002',
    submitted_at: '2026-10-24T09:00:00Z',
    imported_at: '2026-10-27T09:00:00Z',
    source: 'google_forms',
  };
  const rows = buildAccountDirectory(users, [...registrations, imported], admins, false);
  const account = rows.find((row) => row.email === 'b@smvdu.ac.in');

  assert.equal(account.registrationStatus, 'registered');
  assert.equal(account.registrationSource, 'google_forms');
  assert.equal(account.registrationDate, '2026-10-24T09:00:00Z');
  assert.equal(account.participantName, 'Student B');
});

test('event-admin directory does not disclose existing organiser accounts', () => {
  const rows = buildAccountDirectory(users, registrations, admins, false);
  assert.equal(
    rows.some((row) => row.email === 'admin@smvdu.ac.in'),
    false,
  );
});

test('super-admin directory can see organiser roles and active status', () => {
  const rows = buildAccountDirectory(users, registrations, admins, true);
  const admin = rows.find((row) => row.email === 'admin@smvdu.ac.in');
  assert.equal(admin.adminRole, 'event_admin');
  assert.equal(admin.adminActive, true);
});

test('directory sorts recently active accounts first and falls back to creation date', () => {
  const rows = buildAccountDirectory(users, registrations, admins, true);
  assert.equal(rows[0].email, 'admin@smvdu.ac.in');
  assert.equal(rows[1].email, 'a@smvdu.ac.in');
  assert.equal(rows[2].email, 'b@smvdu.ac.in');
});
