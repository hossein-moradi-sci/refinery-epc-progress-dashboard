#!/usr/bin/env node
/**
 * verify-progress.mjs — check the dashboard's numbers straight from the CSV, independently of
 * Power BI and of the page.
 *
 * Everything the dashboard shows comes out of `data/tasks.csv`, so this script re-derives it
 * with the shared maths in lib.mjs and then compares the result against the values the
 * schedule is known to roll up to. A green run means the data is what the dashboard claims;
 * a red one names the number that moved.
 *
 *   node tools/verify-progress.mjs                       # find the export, report the numbers
 *   node tools/verify-progress.mjs --expect "42.1,57.3,-15.1" --leaves 226 --milestones 19
 *   node tools/verify-progress.mjs path/to/tasks.csv     # or point it at another export
 *
 * Exit codes: 0 = matches, 1 = a number moved, 2 = nothing to check.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseCsv, itemisedProgress, weightIdentity } from './lib.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

/** The dashboard keeps its export in `<dashboard>/data/tasks.csv`; find it without hard-coding a folder name. */
function findExport() {
  for (const entry of readdirSync(REPO, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const candidate = path.join(REPO, entry.name, 'data', 'tasks.csv');
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const csvPath = opt('path') || positional[0] || findExport();
if (!csvPath || !existsSync(csvPath)) {
  console.error(`no tasks.csv found under ${REPO} - run the sync first, or pass a path`);
  process.exit(2);
}

const { rows } = parseCsv(readFileSync(csvPath, 'utf8'));
const p = itemisedProgress(rows);
const identity = weightIdentity(rows);

console.log(`file            ${path.relative(REPO, csvPath) || csvPath}`);
console.log(`rows            ${p.rows}`);
console.log(`leaf items      ${p.leaves}${p.critical === null ? '   (no Critical column in this export)' : `   (critical: ${p.critical})`}`);
console.log(`milestones      ${p.milestones}   (complete: ${p.doneMilestones})`);
console.log(`status date     ${p.statusDate}`);
if (!p.hasWeights) {
  console.log('\nthis export has no WeightPercent column: a weighted roll-up cannot be computed from it.');
  process.exit(2);
}
console.log(`total weight    ${p.totalWeight.toFixed(2)}`);
console.log(`actual          ${p.actual.toFixed(1)} %`);
console.log(`planned         ${p.planned.toFixed(1)} %`);
console.log(`variance        ${p.variance.toFixed(1)} pp`);
console.log(`SPI             ${p.spi === null ? '—' : p.spi.toFixed(2)}   (schedule-only: the export carries no cost data)`);
console.log(
  `weight columns  ${identity.ok ? 'consistent with weight × percentage' : 'INCONSISTENT'}` +
  (identity.worst ? `  (worst: ${identity.worst.column} off by ${identity.worst.delta.toExponential(1)}` +
    ` on "${String(identity.worst.row.TaskName).slice(0, 40)}")` : ''),
);

const checks = [];
const expected = (opt('expect') || '').split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
if (expected.length === 3) {
  checks.push(['actual %', p.actual, expected[0]], ['planned %', p.planned, expected[1]], ['variance pp', p.variance, expected[2]]);
}
if (opt('leaves')) checks.push(['leaf items', p.leaves, Number(opt('leaves'))]);
if (opt('milestones')) checks.push(['milestones', p.milestones, Number(opt('milestones'))]);
if (opt('critical') && p.critical !== null) checks.push(['critical items', p.critical, Number(opt('critical'))]);

if (!checks.length) {
  console.log('\n(no --expect baseline given: this is the recomputation, not a comparison)');
  process.exit(identity.ok ? 0 : 1);
}

let failed = identity.ok ? 0 : 1;
console.log(`\nbaseline        ${checks.map(([, , want]) => want).join(' / ')}`);
for (const [name, got, want] of checks) {
  const ok = Math.abs(got - want) < 0.05;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(12)} got ${got.toFixed(2).padStart(7)}   expected ${want}`);
}
if (!identity.ok) console.log(`FAIL  weight columns   Power BI and the page would disagree on this export`);
console.log(failed ? `\n${failed} check(s) failed.` : '\nall checks passed.');
process.exit(failed ? 1 : 0);
