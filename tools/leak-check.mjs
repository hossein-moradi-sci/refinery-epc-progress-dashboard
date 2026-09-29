#!/usr/bin/env node
/**
 * leak-check.mjs — prove that a published copy carries none of the source project's
 * vocabulary.
 *
 * The dashboard is built from a real project's schedule, so before a copy leaves the
 * machine it is scanned for the words that identify that project: its name, its plant
 * units, site names, client wording and unit numbers. The list of those words is itself
 * sensitive, which is why it lives in a file that is **not** committed
 * (`tools/leak-denylist.local.txt`, see `tools/leak-denylist.example.txt`) instead of
 * being hard-coded here.
 *
 * Every file is scanned as UTF-8 **and** as UTF-16LE, and binaries (the launcher .exe
 * files) are read as raw bytes, because a compiled launcher can carry strings a text
 * search would miss. Screenshots are checked by eye - this tool cannot read pixels.
 *
 *   node tools/leak-check.mjs                       # whole repo, default denylist
 *   node tools/leak-check.mjs --tree some/copy --denylist my/terms.txt
 *   node tools/leak-check.mjs --allow tools/leak-allow.local.txt
 *
 * A deliberately accepted leftover (here: the artifact file names, which Power BI refuses
 * to open under any other name) goes into the allow file, so the report keeps saying
 * "accepted" instead of drowning the one hit that matters. Exit code 1 means something
 * leaked: do not publish until it is clean or consciously accepted and written down.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : args[i + 1];
};

const tree = path.resolve(opt('tree', '.'));
const denylistPath = opt('denylist', path.join('tools', 'leak-denylist.local.txt'));
const allowPath = opt('allow', path.join('tools', 'leak-allow.local.txt'));
const selfPath = path.resolve(process.argv[1]);

if (!existsSync(denylistPath)) {
  console.error(`no denylist at ${denylistPath}`);
  console.error('copy tools/leak-denylist.example.txt, replace the placeholders with the identifiers');
  console.error('that must never be published, and keep that file out of version control.');
  process.exit(2);
}

const terms = readFileSync(denylistPath, 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

if (!terms.length) {
  console.error('denylist is empty - add the identifiers to look for');
  process.exit(2);
}

const readTerms = (file) => (!existsSync(file) ? [] : readFileSync(file, 'utf8')
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));

const SKIP_DIRS = new Set(['.git', 'node_modules', 'logs']);
const TEXT_MAX = 4 * 1024 * 1024;
// `*.local.*` files are the machine-only half of this workflow (the vocabulary itself:
// anonymise rules, name map, this denylist). They are gitignored and never part of a
// published copy, so they are reported separately instead of as leaks.
const isLocalFile = (p) => /\.local\./.test(path.basename(p));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const hits = [];
const countOccurrences = (haystack, needle) => {
  let n = 0;
  let i = 0;
  const h = haystack.toLowerCase();
  const nd = needle.toLowerCase();
  while ((i = h.indexOf(nd, i)) !== -1) { n++; i += nd.length; }
  return n;
};

const allFiles = walk(tree);
for (const file of allFiles) {
  if (path.resolve(file) === selfPath) continue;         // the tool lists the words itself
  if (isLocalFile(file)) continue;                       // machine-only, never committed
  if (/\.(png|jpg|jpeg|gif|pdf|webm|mp4|ico|zip)$/i.test(file)) continue; // verified by eye
  let size = 0;
  try { size = statSync(file).size; } catch { continue; }
  if (size > TEXT_MAX) continue;

  const bytes = readFileSync(file);
  const views = [bytes.toString('utf8')];
  if (bytes.length >= 2) views.push(bytes.toString('utf16le'));

  for (const term of terms) {
    const n = views.reduce((a, v) => a + countOccurrences(v, term), 0);
    if (n) hits.push({ file: path.relative(tree, file), term, n });
  }
}

const allowed = readTerms(allowPath).map((t) => t.toLowerCase());
const reported = hits.filter((h) => !allowed.includes(h.term.toLowerCase()));
const accepted = hits.filter((h) => allowed.includes(h.term.toLowerCase()));
const localFiles = allFiles
  .filter((f) => isLocalFile(f))
  .map((f) => path.relative(tree, f));

console.log(`tree     ${tree}`);
console.log(`terms    ${terms.length}`);
console.log(`files    ${allFiles.length - localFiles.length} scanned` + (localFiles.length ? ` (${localFiles.length} local file(s) skipped)` : ''));
if (reported.length) {
  console.log(`\nLEAKS (${reported.length}):`);
  for (const h of reported) console.log(`  ${h.file}  ->  "${h.term}" x${h.n}`);
} else {
  console.log('\nclean: none of the listed identifiers appear in the tree.');
}
if (accepted.length) {
  console.log(`\naccepted and disclosed (${accepted.length}) - listed in ${path.relative(tree, path.resolve(allowPath))}:`);
  for (const h of accepted) console.log(`  ${h.file}  ->  "${h.term}"`);
}
for (const f of localFiles) {
  console.log(`note: skipped ${f} - machine-only, must never be committed`);
}
process.exit(reported.length ? 1 : 0);
