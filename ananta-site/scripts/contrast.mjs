/**
 * Every text/background pair the design system actually uses, checked against
 * WCAG AA. Run with `npm run contrast`; the output goes in the PR.
 *
 * The values here mirror the tokens in app/globals.css. If you change a token,
 * change it here and re-run — a pair that fails should either be fixed or be
 * marked large-only, never left to drift.
 */
const lin = (c) =>
  c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4;
const L = (hex) => {
  const [r, g, b] = hex
    .replace('#', '')
    .match(/../g)
    .map((x) => parseInt(x, 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [L(a), L(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

const T = {
  paper: '#F7F0E3',
  paperDeep: '#EFE6D4',
  ink: '#16181D',
  saffron: '#F07800',
  saffronDeep: '#C85F00',
  saffronText: '#9E4F00',
  green: '#007830',
  navy: '#13204A',
  white: '#FFFFFF',
  sangam: '#A3542F',
  devgrowth: '#0078C0',
  codeclub: '#6A4BFF',
  smvdu: '#007830',
  nullclub: '#2E2E2E',
  aiml: '#0B6B5C',
};

/** [foreground, background, where it is used, large-only?] */
const PAIRS = [
  ['ink', 'paper', 'body text, headings', false],
  ['ink', 'paperDeep', 'text on the deeper paper bands', false],
  ['navy', 'paper', 'strong labels on paper', false],
  ['green', 'paper', 'links (.link), team card links', false],
  ['saffronText', 'paper', 'round numbers, commit hashes, rule numbers', false],
  ['saffronText', 'paperDeep', 'the same, on the deeper paper bands', false],
  ['saffronDeep', 'paper', 'अनन्त on /about (3rem+) — large display only', true],
  ['ink', 'saffron', 'saffron label strips and tags', false],
  ['ink', 'saffron', 'countdown "tag: N marks"', false],
  ['paper', 'ink', 'ink label strips, buttons, countdown digits', false],
  ['paper', 'navy', 'dark sections, footer, on-campus chips', false],
  ['white', 'navy', 'footer headings', false],
  ['saffron', 'navy', 'अनन्त in the footer mark (large)', true],
  ['white', 'sangam', 'SANGAM club tag', false],
  ['white', 'devgrowth', 'DevGrowth club tag', false],
  ['white', 'codeclub', 'Code Club tag', false],
  ['white', 'smvdu', 'SMVDU tag', false],
  ['white', 'nullclub', 'NULL club tag', false],
  ['white', 'aiml', 'AI & ML Club tag', false],
];

/**
 * Saffron on paper is 2.51:1 and fails at every size, so it is never text on
 * paper — only a fill with ink on top, or the deepened saffronDeep above.
 */
const NEVER = [['saffron', 'paper', 'saffron text on paper — fill only, never text']];

/*
 * Not listed above because they carry no text: the stamp ring and अनन्त inside
 * it, the hero arrow, the HEAD node on /journey and the checklist bars all use
 * --c-saffron-deep as a graphic. The stamp is aria-hidden and has a
 * visually-hidden text equivalent.
 */

const pad = (s, n) => String(s).padEnd(n);
let failures = 0;

console.log(
  pad('foreground', 13) +
    pad('background', 12) +
    pad('ratio', 9) +
    pad('AA', 7) +
    'used for',
);
console.log('-'.repeat(92));

for (const [fg, bg, use, largeOnly] of PAIRS) {
  const r = ratio(T[fg], T[bg]);
  const ok = largeOnly ? r >= 3 : r >= 4.5;
  if (!ok) failures++;
  console.log(
    pad(fg, 13) +
      pad(bg, 12) +
      pad(r.toFixed(2) + ':1', 9) +
      pad(ok ? (largeOnly ? 'large' : 'pass') : 'FAIL', 7) +
      use,
  );
}

console.log('-'.repeat(92));
for (const [fg, bg, why] of NEVER) {
  console.log(`not used: ${fg} on ${bg} = ${ratio(T[fg], T[bg]).toFixed(2)}:1 — ${why}`);
}
console.log('-'.repeat(92));

if (failures) {
  console.error(
    `${failures} pair(s) below AA. Fix the token or mark the pair large-only.`,
  );
  process.exit(1);
}
console.log('All pairs meet WCAG AA for the size they are used at.');
