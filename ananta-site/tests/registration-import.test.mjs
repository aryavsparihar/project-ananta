import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findHeader,
  makeSourceId,
  normaliseHeader,
  parseGoogleTimestamp,
  summariseImportProgress,
} from '../lib/registration-import.ts';

test('normaliseHeader removes accents and punctuation', () => {
  assert.equal(normaliseHeader('É-mail Address!'), 'emailaddress');
  assert.equal(normaliseHeader('  Student Name  '), 'studentname');
});

test('findHeader matches normalized headings and aliases', () => {
  assert.equal(
    findHeader(
      ['Timestamp', 'Student Name', 'Email Address'],
      ['full name', 'student name'],
    ),
    'Student Name',
  );
  assert.equal(findHeader(['Timestamp'], ['Email Address']), undefined);
});

test('makeSourceId is stable across column order and whitespace', () => {
  const first = {
    'Full Name': ' Mayank ',
    'Email Address': 'mayank@smvdu.ac.in',
  };
  const reordered = {
    'Email Address': 'mayank@smvdu.ac.in',
    'Full Name': 'Mayank',
  };
  assert.equal(makeSourceId(first), makeSourceId(reordered));
  assert.match(makeSourceId(first), /^[a-f0-9]{64}$/);
});

test('parseGoogleTimestamp respects explicit ISO time zones', () => {
  assert.equal(
    parseGoogleTimestamp('2026-11-04T23:59:00+05:30'),
    '2026-11-04T18:29:00.000Z',
  );
});

test('parseGoogleTimestamp interprets ambiguous dates as India day-first IST', () => {
  assert.equal(parseGoogleTimestamp('04/11/2026, 11:59 PM'), '2026-11-04T18:29:00.000Z');
  assert.equal(parseGoogleTimestamp('04/11/2026, 12:00 AM'), '2026-11-03T18:30:00.000Z');
});

test('parseGoogleTimestamp rejects malformed and impossible dates', () => {
  assert.equal(parseGoogleTimestamp(''), null);
  assert.equal(parseGoogleTimestamp('31/02/2026'), null);
  assert.equal(parseGoogleTimestamp('13/13/2026'), null);
  assert.equal(parseGoogleTimestamp('04/11/2026, 13:00 PM'), null);
  assert.equal(parseGoogleTimestamp('not a date'), null);
});

test('summariseImportProgress separates duplicates from rows awaiting retry', () => {
  assert.deepEqual(summariseImportProgress(400, 340, 60, 100, 280), {
    duplicatesSkipped: 120,
    rowsNotImported: 180,
  });
  assert.deepEqual(summariseImportProgress(400, 340, 60, 280, 280), {
    duplicatesSkipped: 120,
    rowsNotImported: 0,
  });
});

test('summariseImportProgress rejects inconsistent counts', () => {
  assert.throws(() => summariseImportProgress(10, 9, 3, 0, 9), RangeError);
  assert.throws(() => summariseImportProgress(10, 11, 0, 0, 11), RangeError);
});
