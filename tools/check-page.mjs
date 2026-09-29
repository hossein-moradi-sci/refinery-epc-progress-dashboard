#!/usr/bin/env node
/**
 * check-page.mjs — syntax gate for the single-file offline dashboard.
 *
 * `preview/index.html` carries one inline `<script>` block and no build step, so a stray
 * bracket is a page that renders its header and nothing else. This extracts the block and
 * parses it (without running it) the way the browser would, and asserts the few structural
 * facts the page depends on.
 *
 *   node tools/check-page.mjs                                  # default path
 *   node tools/check-page.mjs path/to/preview/index.html
 *
 * Exit 1 on any problem.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const target = process.argv[2] || path.join(
  'Refinery8-FGR-Dashboard', 'preview', 'index.html');

if (!existsSync(target)) {
  console.error(`no page at ${target}`);
  process.exit(2);
}
const html = readFileSync(target, 'utf8');

const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const problems = [];

if (blocks.length !== 1) {
  problems.push(`expected exactly one <script> block, found ${blocks.length}`);
}
if (!/<title>[^<]+<\/title>/i.test(html)) problems.push('no <title> element');
if (!/id=["']itemsBody["']/.test(html)) problems.push('the item table body (#itemsBody) is missing');

try {
  new vm.Script(blocks[0], { filename: target });
} catch (e) {
  problems.push(`the inline script does not parse - ${e.message}`);
}

// Top-level null dereferences kill the whole page script, so the elements the boot code
// touches by id must exist in the markup (the page's own hard-won rule).
const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
const bootIds = [...blocks.join('\n').matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)].map((m) => m[1]);
const missing = [...new Set(bootIds)].filter((id) => !ids.has(id));

console.log(`page          ${target}`);
console.log(`bytes         ${html.length}`);
console.log(`script blocks ${blocks.length}`);
console.log(`ids in markup ${ids.size}`);
console.log(`ids used from JS ${new Set(bootIds).size}${missing.length ? ` (${missing.length} not in the markup: ${missing.join(', ')})` : ''}`);
if (problems.length) {
  console.log(`\nPROBLEMS (${problems.length}):`);
  for (const p of problems) console.log('  ! ' + p);
  process.exit(1);
}
console.log('\nok: one script block, and it parses.');
