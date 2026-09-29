#!/usr/bin/env node
/**
 * anonymize-data.mjs — build a publishable dataset from a real MS Project export.
 *
 * The dashboard's export (`data/tasks.csv`) describes a real construction project: its task
 * names, disciplines, milestones and whole calendar are commercially sensitive. This tool
 * produces a **structurally identical** copy in which
 *
 *   * every human-readable identifier is replaced through a rules file,
 *   * every date is shifted by a fixed number of days (durations are preserved),
 *   * `UniqueID` is renumbered sequentially (no link back to the source file),
 *   * the project-info timestamp is shifted with everything else,
 *
 * while the weights and progress percentages are kept (or, with `--perturb`, jittered
 * deterministically) so that every progress figure still holds and the two front ends stay
 * internally consistent. The derived weight columns are recomputed whenever a percentage moves,
 * because Power BI reads those columns while the page multiplies the percentages itself.
 *
 * The rules file holds the real vocabulary, so it is never committed: the default path
 * (`tools/anonymize-rules.local.json`) is listed in .gitignore.
 * See `tools/anonymize-rules.example.json` for the shape and run
 *
 *   node tools/anonymize-data.mjs \
 *        --in  "C:/path/to/real/tasks.csv" \
 *        --out "Refinery8-FGR-Dashboard/data" \
 *        --project-info "C:/path/to/real/project-info.csv"
 *
 * The tool refuses to write while any forbidden token (rules file, `forbiddenTokens`) still
 * appears in the transformed data, and always writes an audit map of every rename it made.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseCsv, toCsv, itemisedProgress } from './lib.mjs';

// ---------------------------------------------------------------- arguments
const args = process.argv.slice(2);
const opt = (name, dflt = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : args[i + 1];
};

const inCsv = opt('in');
const outDir = opt('out', 'data');
const rulesPath = opt('rules', path.join('tools', 'anonymize-rules.local.json'));
const mapPath = opt('map', path.join('tools', 'name-map.local.json'));
const projectInfoIn = opt('project-info');
const offsetDaysArg = opt('offset-days');
const perturbPp = Number(opt('perturb', '0'));

if (!inCsv || !existsSync(inCsv)) {
  console.error('usage: node tools/anonymize-data.mjs --in <tasks.csv> --out <dir> [--rules <file>] [--project-info <csv>]');
  console.error('       the rules file carries the real vocabulary and is deliberately not in this repository');
  process.exit(2);
}
if (!existsSync(rulesPath)) {
  console.error(`rules file not found: ${rulesPath}`);
  console.error('copy tools/anonymize-rules.example.json, replace the match/replace pairs with the real');
  console.error('vocabulary of your project, and keep it out of version control.');
  process.exit(2);
}

const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
const offsetDays = offsetDaysArg === null ? Number(rules.dateOffsetDays || 0) : Number(offsetDaysArg);
const replacements = (rules.replacements || []).slice(); // order matters: most specific first
const forbidden = (rules.forbiddenTokens || []).filter(Boolean);

// ------------------------------------------------------------------- dates
/** Parses MS Project's `M/D/YYYY h:mm:ss AM/PM` without going through the host locale. */
function parseMspDate(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i.exec(String(value).trim());
  if (!m) return null;
  let h = Number(m[4]) % 12;
  if (/pm/i.test(m[7])) h += 12;
  return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), h, Number(m[5]), Number(m[6])));
}

function formatMspDate(d) {
  const h24 = d.getUTCHours();
  const ap = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const p2 = (n) => String(n).padStart(2, '0');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()} ` +
         `${h12}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())} ${ap}`;
}

const shiftDate = (value) => {
  const d = parseMspDate(value);
  if (!d || !offsetDays) return value;
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return formatMspDate(d);
};

// ------------------------------------------------------------ transformation
const TEXT_COLUMNS = rules.textColumns || ['TaskName', 'Phase', 'Disciplines'];
const DATE_COLUMNS = rules.dateColumns || ['Start', 'Finish', 'StatusDate'];

const { head, rows } = parseCsv(readFileSync(inCsv, 'utf8'));
for (const col of [...TEXT_COLUMNS, ...DATE_COLUMNS, 'UniqueID']) {
  if (!head.includes(col)) {
    console.error(`input is missing the expected column "${col}" — is this the dashboard export?`);
    process.exit(2);
  }
}

const nameMap = new Map();
const applyRules = (value) => {
  let out = value;
  for (const { match, replace } of replacements) {
    if (!match || !out.includes(match)) continue;
    out = out.split(match).join(replace);
  }
  return out;
};

/** Small deterministic jitter so published numbers cannot be matched to the source file. */
let seed = 0x9e3779b9;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
};
const jitter = (value, amplitude) => {
  if (!amplitude) return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  const moved = Math.min(1, Math.max(0, n + (rand() * 2 - 1) * amplitude));
  return String(Math.round(moved * 1e4) / 1e4);
};
const round6 = (n) => String(Math.round(n * 1e6) / 1e6);

const outRows = rows.map((row, index) => {
  const next = { ...row };

  for (const col of TEXT_COLUMNS) {
    const before = String(next[col] ?? '');
    const after = applyRules(before);
    nameMap.set(before, after); // kept even when identical, so the run reports what it left alone
    next[col] = after;
  }

  for (const col of DATE_COLUMNS) next[col] = shiftDate(next[col]);

  // Sequential ids: the published file keeps no trace of the source's UniqueIDs.
  next.UniqueID = String(index + 1);

  if (perturbPp) {
    // A jittered percentage must carry its derived weight columns with it, or Power BI (which
    // sums the weights) would disagree with the page (which multiplies the percentages).
    next.PhysicalPercentComplete = jitter(next.PhysicalPercentComplete, perturbPp / 100);
    next.PlannedPercent = jitter(next.PlannedPercent, perturbPp / 100);
    const w = Number(next.WeightPercent) || 0;
    next.ActualWeight = round6(w * (Number(next.PhysicalPercentComplete) || 0));
    next.PlannedWeight = round6(w * (Number(next.PlannedPercent) || 0));
  }

  return next;
});

// ------------------------------------------------------------------ guardrail
const leftovers = [];
for (const row of outRows) {
  for (const col of TEXT_COLUMNS) {
    const value = String(row[col] ?? '');
    for (const token of forbidden) {
      if (token && value.toLowerCase().includes(token.toLowerCase())) {
        leftovers.push(`${col}: "${value}" still contains "${token}"`);
      }
    }
  }
}
if (leftovers.length) {
  console.error('refusing to write: forbidden identifiers survived the transformation');
  for (const l of [...new Set(leftovers)].slice(0, 40)) console.error('  ! ' + l);
  process.exit(1);
}

// --------------------------------------------------------------------- write
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'tasks.csv'), toCsv(head, outRows), 'utf8');

let infoNote = '';
if (projectInfoIn && existsSync(projectInfoIn)) {
  const info = parseCsv(readFileSync(projectInfoIn, 'utf8'));
  const shifted = info.rows.map((r) => ({ ...r, RefreshedAt: shiftDate(r.RefreshedAt) }));
  writeFileSync(path.join(outDir, 'project-info.csv'), toCsv(info.head, shifted), 'utf8');
  infoNote = ` + project-info.csv (RefreshedAt ${shifted.map((r) => r.RefreshedAt).join(', ')})`;
}

const renamed = [...nameMap.entries()].filter(([a, b]) => a !== b);
const unchanged = [...nameMap.entries()].filter(([a, b]) => a === b).map(([a]) => a);
mkdirSync(path.dirname(mapPath), { recursive: true });
writeFileSync(mapPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: path.basename(inCsv),
  dateOffsetDays: offsetDays,
  perturbPp,
  names: Object.fromEntries(renamed),
}, null, 2), 'utf8');

const p = itemisedProgress(outRows);
console.log(`rows ${p.rows}  leaves ${p.leaves}  milestones ${p.milestones}`);
console.log(`actual ${p.actual.toFixed(1)}%  planned ${p.planned.toFixed(1)}%  variance ${p.variance.toFixed(1)}pp  SPI ${p.spi.toFixed(2)}`);
console.log(`status date ${p.statusDate}  (offset ${offsetDays} days)`);
console.log(`renamed ${renamed.length} distinct names -> ${mapPath}`);
console.log(`wrote ${path.join(outDir, 'tasks.csv')}${infoNote}`);
if (unchanged.length) {
  console.log(`left untouched (review these are generic): ${unchanged.length}`);
  for (const n of unchanged.slice(0, 30)) console.log('  = ' + n);
}
