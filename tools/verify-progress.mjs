#!/usr/bin/env node
/**
 * verify-progress.mjs — recompute the dashboard's headline numbers straight from the CSV.
 *
 * The Power BI model and the offline page both show "actual / planned / variance" as a
 * **weighted itemised** roll-up over the leaf items:
 *
 *     actual  = SUM(weight x Physical % Complete) / SUM(weight)
 *     planned = SUM(weight x planned %)          / SUM(weight)
 *
 * This script is the independent check: it never reads DAX, the page, or the model - only
 * the exported CSV - so a green run means the data is what the dashboard claims it is.
 * The output is compared against the values the source schedule is known to roll up to,
 * which is how the model was validated against MS Project in the first place.
 *
 *   node tools/verify-progress.mjs                              # default path
 *   node tools/verify-progress.mjs path/to/tasks.csv
 *   node tools/verify-progress.mjs --expect "42.1,57.3,-15.1" --leaves 226 --milestones 19
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

/** The dashboard keeps its export in `<dashboard>/data/tasks.csv`; find it without hard-coding a folder name. */
function findExport(start = '.') {
  for (const entry of readdirSync(start, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const candidate = path.join(start, entry.name, 'data', 'tasks.csv');
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const csvPath = opt('path') || positional[0] || findExport() || path.join('data', 'tasks.csv');
if (!existsSync(csvPath)) {
  console.error(`no tasks.csv found (looked for <dashboard>/data/tasks.csv under ${path.resolve('.')})`);
  console.error('run the sync first, or pass a path: node tools/verify-progress.mjs path/to/tasks.csv');
  process.exit(2);
}

function parseLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const text = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = text.split(/\r?\n/).filter((l) => l.length);
const head = parseLine(lines[0]);
const rows = lines.slice(1).map((l) => Object.fromEntries(parseLine(l).map((v, i) => [head[i], v])));

// The export quotes booleans as the strings True/False.
const isTrue = (v) => String(v).trim().toLowerCase() === 'true';
const leaves = rows.filter((r) => !isTrue(r.IsSummary) && !isTrue(r.IsMilestone));
const milestones = rows.filter((r) => isTrue(r.IsMilestone));
const critical = leaves.filter((r) => isTrue(r.Critical));

const w = (r) => Number(r.WeightPercent || 0);
const totalW = leaves.reduce((a, r) => a + w(r), 0);
const actual = leaves.reduce((a, r) => a + w(r) * Number(r.PhysicalPercentComplete || 0), 0) / totalW * 100;
const planned = leaves.reduce((a, r) => a + w(r) * Number(r.PlannedPercent || 0), 0) / totalW * 100;
const variance = actual - planned;
const doneMilestones = milestones.filter((r) => Number(r.PhysicalPercentComplete || 0) >= 1).length;
const statusDate = rows.length ? String(rows[0].StatusDate || '').split(' ')[0] : '';

console.log(`file            ${csvPath}`);
console.log(`rows            ${rows.length}`);
console.log(`leaf items      ${leaves.length}   (critical: ${critical.length})`);
console.log(`milestones      ${milestones.length}   (complete: ${doneMilestones})`);
console.log(`status date     ${statusDate}`);
console.log(`actual          ${actual.toFixed(1)} %`);
console.log(`planned         ${planned.toFixed(1)} %`);
console.log(`variance        ${variance.toFixed(1)} pp`);
console.log(`SPI             ${(actual / planned).toFixed(2)}   (schedule-only: no cost data exists in the export)`);

const expected = (opt('expect') || '').split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
const checks = [];
if (expected.length === 3) {
  checks.push(['actual', actual, expected[0]], ['planned', planned, expected[1]], ['variance', variance, expected[2]]);
}
if (opt('leaves')) checks.push(['leaf items', leaves.length, Number(opt('leaves'))]);
if (opt('milestones')) checks.push(['milestones', milestones.length, Number(opt('milestones'))]);

if (!checks.length) {
  console.log('\n(no --expect baseline given: showing the recomputation only)');
  process.exit(0);
}
let failed = 0;
console.log('');
for (const [name, got, want] of checks) {
  const ok = Math.abs(got - want) < 0.05;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(12)} got ${typeof got === 'number' ? got.toFixed(2) : got}  expected ${want}`);
}
process.exit(failed ? 1 : 0);
