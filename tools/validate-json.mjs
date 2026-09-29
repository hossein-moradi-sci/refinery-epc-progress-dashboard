#!/usr/bin/env node
/**
 * validate-json.mjs — the structural gate for a hand-written Power BI project.
 *
 * The report and the semantic model are JSON (PBIR) and TMDL text. Power BI's own failure
 * mode for a bad file is a dialog that says nothing useful ("Issues were found"), so every
 * change lands here first: it parses every JSON document in the tree and cross-checks the two
 * places where a rename silently breaks the report - the registered custom theme, and the
 * sibling paths in `*.pbip` / `definition.pbir`.
 *
 *   node tools/validate-json.mjs            # whole repo
 *   node tools/validate-json.mjs some/dir
 *
 * Exit 1 on any problem.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'logs', '.pbi']);
const problems = [];
let parsed = 0;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(root, p).replace(/\\/g, '/');

const files = walk(root);
for (const file of files) {
  const base = path.basename(file);
  const isJson = /\.(json|pbip)$/i.test(base) || base === '.platform';
  if (!isJson) continue;
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    parsed++;
  } catch (e) {
    problems.push(`${rel(file)}: not valid JSON - ${e.message}`);
    continue;
  }
  if (base === '.platform') {
    for (const key of ['metadata', 'config']) {
      if (!data[key]) problems.push(`${rel(file)}: .platform has no "${key}" block`);
    }
    if (data.metadata && !data.metadata.type) problems.push(`${rel(file)}: .platform has no metadata.type`);
    if (data.config && !data.config.logicalId) problems.push(`${rel(file)}: .platform has no config.logicalId`);
  }
}

// The custom theme is registered by file name in report.json and must exist next to it.
for (const file of files.filter((f) => f.endsWith('report.json'))) {
  const report = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const themeName = report.themeCollection?.customTheme?.name;
  if (!themeName) continue;
  // resourcePackages entries are flat ({ name, type, items }) in the schema Power BI writes today.
  const registered = (report.resourcePackages || [])
    .map((p) => p.resourcePackage || p)
    .find((p) => p.type === 'RegisteredResources');
  const items = registered?.items || [];
  const item = items.find((i) => i.name === themeName);
  if (!item) {
    problems.push(`${rel(file)}: custom theme "${themeName}" is not listed in resourcePackages`);
    continue;
  }
  // <report>/definition/report.json -> <report>/StaticResources/RegisteredResources/<file>
  const reportRoot = path.dirname(path.dirname(file));
  const themePath = path.join(reportRoot, 'StaticResources', 'RegisteredResources', item.path || item.name);
  if (!existsSync(themePath)) problems.push(`${rel(file)}: theme file "${item.path || item.name}" is missing on disk`);
  else {
    // A theme with an off-schema colour-slot set is applied by Power BI *silently* - or not at all.
    const theme = JSON.parse(readFileSync(themePath, 'utf8').replace(/^\uFEFF/, ''));
    // Power BI applies a custom theme only when its shape matches the base theme's schema, and
    // it says nothing when it does not - hence these checks.
    const SLOTS = ['good', 'neutral', 'bad', 'maximum', 'minimum', 'foreground', 'background'];
    const missing = SLOTS.filter((s) => theme[s] === undefined);
    if (missing.length) problems.push(`${rel(themePath)}: theme is missing the colour slots ${missing.join(', ')}`);
    if (!Array.isArray(theme.dataColors) || theme.dataColors.length < 4) {
      problems.push(`${rel(themePath)}: dataColors must be an array of at least four colours`);
    }
    const TEXT_CLASSES = ['callout', 'title', 'header', 'label'];
    const textClasses = Object.keys(theme.textClasses || {});
    const badClasses = textClasses.filter((c) => !TEXT_CLASSES.includes(c));
    if (badClasses.length) problems.push(`${rel(themePath)}: textClasses has non-canonical entries ${badClasses.join(', ')}`);
    for (const c of TEXT_CLASSES) {
      if (!theme.textClasses?.[c]) problems.push(`${rel(themePath)}: textClasses.${c} is missing`);
    }
    if (theme.visualStyles?.page && !theme.visualStyles.page['*']) {
      problems.push(`${rel(themePath)}: visualStyles.page must keep its "*" level`);
    }
  }
}

// A .pbip points at its report; definition.pbir points at the semantic model. Both are plain
// relative paths, and a rename that misses one of them gives the silent blank-window failure.
for (const file of files) {
  const base = path.basename(file);
  if (base.endsWith('.pbip')) {
    const doc = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    for (const artifact of doc.artifacts || []) {
      if (!artifact.report) continue;
      const target = path.join(path.dirname(file), artifact.report.path);
      if (!existsSync(target)) problems.push(`${rel(file)}: report path "${artifact.report.path}" does not exist`);
      const platform = path.join(target, '.platform');
      if (!existsSync(platform) && !existsSync(path.join(target, 'definition'))) {
        problems.push(`${rel(file)}: "${artifact.report.path}" does not look like a Power BI report folder`);
      }
    }
  }
  if (base === 'definition.pbir') {
    const doc = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
    const target = doc.datasetReference?.byPath?.path;
    if (target) {
      const resolved = path.join(path.dirname(file), target);
      if (!existsSync(resolved)) problems.push(`${rel(file)}: semantic model path "${target}" does not exist`);
    }
  }
}

// A report folder must keep the name of its .pbip: Power BI refuses to open a renamed copy.
const pbips = files.filter((f) => f.endsWith('.pbip'));
for (const file of pbips) {
  const stem = path.basename(file, '.pbip');
  const doc = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  for (const artifact of doc.artifacts || []) {
    const target = artifact.report?.path;
    if (target && path.basename(target) !== `${stem}.Report`) {
      problems.push(`${rel(file)}: report folder "${target}" must be named "${stem}.Report"`);
    }
  }
  const modelFolder = path.join(path.dirname(file), `${stem}.SemanticModel`);
  if (!existsSync(modelFolder)) {
    problems.push(`${rel(file)}: sibling semantic model folder "${stem}.SemanticModel" is missing`);
  }
}

const stats = statSync(root);
console.log(`root          ${root}${stats.isDirectory() ? '' : ' (file)'}`);
console.log(`json parsed   ${parsed}`);
console.log(`pbip files    ${pbips.length}`);
if (problems.length) {
  console.log(`\nPROBLEMS (${problems.length}):`);
  for (const p of problems) console.log('  ! ' + p);
  process.exit(1);
}
console.log('\nok: every JSON document parses, the theme is wired and the project paths resolve.');
