import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CV_MAX_BYTES,
  emailAllowed,
  friendlyError,
  normaliseUrl,
  safeNext,
  validateCvUpload,
} from '../lib/portal.ts';

test('safeNext rejects external and malformed redirects', () => {
  assert.equal(safeNext('/account'), '/account');
  assert.equal(safeNext('/register/form?x=1'), '/register/form?x=1');
  assert.equal(safeNext('/'), '/');
  assert.equal(safeNext('//example.com/steal'), '/account');
  assert.equal(safeNext('/\\\\example.com'), '/account');
  assert.equal(safeNext('https://example.com'), '/account');
  assert.equal(safeNext(null, '/register/form'), '/register/form');
});

test('normaliseUrl upgrades profile URLs to HTTPS', () => {
  assert.equal(normaliseUrl(' github.com/mayank '), 'https://github.com/mayank');
  assert.equal(normaliseUrl('http://github.com/mayank'), 'https://github.com/mayank');
  assert.equal(normaliseUrl('https://github.com/mayank'), 'https://github.com/mayank');
  assert.equal(normaliseUrl(''), '');
});

test('emailAllowed checks exact domains case-insensitively', () => {
  assert.equal(emailAllowed('STUDENT@SMVDU.AC.IN', ['smvdu.ac.in']), true);
  assert.equal(emailAllowed('student@example.com', ['smvdu.ac.in']), false);
  assert.equal(emailAllowed('student@sub.smvdu.ac.in', ['smvdu.ac.in']), false);
  assert.equal(emailAllowed('student@example.com', []), true);
});

test('friendlyError maps common auth errors to actionable messages', () => {
  assert.equal(
    friendlyError({ message: 'Invalid login credentials' }),
    'Wrong email or password.',
  );
  assert.equal(
    friendlyError({ message: 'Email not confirmed' }),
    'Confirm your email first: open the link we sent you.',
  );
  assert.equal(
    friendlyError({ message: 'Failed to fetch' }),
    'Could not reach the server. Check your connection and try again.',
  );
  assert.equal(friendlyError({ message: 'unexpected issue' }), 'unexpected issue');
});

test('validateCvUpload accepts supported, non-empty files under the size limit', () => {
  assert.equal(validateCvUpload({ type: 'application/pdf', size: 1024 }), null);
  assert.equal(
    validateCvUpload({
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: CV_MAX_BYTES,
    }),
    null,
  );
});

test('validateCvUpload rejects unsupported, empty, and oversized files', () => {
  assert.equal(
    validateCvUpload({ type: 'text/html', size: 100 }),
    'Upload the CV as a PDF or Word document.',
  );
  assert.equal(
    validateCvUpload({ type: 'application/pdf', size: 0 }),
    'Choose a non-empty CV file.',
  );
  assert.equal(
    validateCvUpload({ type: 'application/pdf', size: CV_MAX_BYTES + 1 }),
    'Keep the CV under 5 MB.',
  );
});
