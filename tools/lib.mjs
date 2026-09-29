/**
 * lib.mjs — the parts the tools share: reading the exporter's CSV, and the progress maths.
 *
 * The dashboard's figure is a weighted itemised roll-up. It is implemented twice on purpose -
 * once in DAX for Power BI, once in JavaScript for the offline page - so this module is the
 * third, plain implementation: the one the verifier and the anonymiser both stand on, and the
 * one that can be read without knowing either tool.
 */

/** RFC-4180-ish line parser: quotes, escaped quotes and embedded commas. */
export function parseLine(line) {
  const out = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuote) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuote = false;
      } else cur += c;
    } else if (c === '"') inQuote = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

/** Reads the export into `{ head, rows }`; the BOM PowerShell writes is dropped. */
export function parseCsv(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length);
  const head = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? '']));
  });
  return { head, rows };
}

/** Mirrors PowerShell's Export-Csv: UTF-8 BOM, CRLF, every field quoted. */
export function toCsv(head, rows) {
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const body = rows.map((r) => head.map((h) => q(r[h])).join(',')).join('\r\n');
  return '\uFEFF' + head.map(q).join(',') + '\r\n' + body + '\r\n';
}

/** The export spells booleans `True`/`False`, capitalised and quoted. */
export const isTrue = (v) => String(v).trim().toLowerCase() === 'true';
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * The dashboard's numbers, computed from the export alone.
 *
 *   actual  = Σ(weight × Physical % Complete) / Σ weight   (leaf items only)
 *   planned = Σ(weight × planned %)          / Σ weight   (leaf items only)
 *
 * Leaf means `IsSummary=False AND IsMilestone=False`: the milestone rows carry no weight and
 * counting them as work would dilute the percentage.
 */
export function itemisedProgress(rows) {
  const leaves = rows.filter((r) => !isTrue(r.IsSummary) && !isTrue(r.IsMilestone));
  const milestones = rows.filter((r) => isTrue(r.IsMilestone));
  const hasWeights = rows.length > 0 && 'WeightPercent' in rows[0];
  const critical = 'Critical' in (rows[0] || {}) ? leaves.filter((r) => isTrue(r.Critical)) : null;

  const totalWeight = leaves.reduce((a, r) => a + num(r.WeightPercent), 0);
  const actual = totalWeight
    ? leaves.reduce((a, r) => a + num(r.WeightPercent) * num(r.PhysicalPercentComplete), 0) / totalWeight * 100
    : 0;
  const planned = totalWeight
    ? leaves.reduce((a, r) => a + num(r.WeightPercent) * num(r.PlannedPercent), 0) / totalWeight * 100
    : 0;

  return {
    rows: rows.length,
    leaves: leaves.length,
    milestones: milestones.length,
    doneMilestones: milestones.filter((r) => num(r.PhysicalPercentComplete) >= 1).length,
    critical: critical ? critical.length : null,
    statusDate: rows.length ? String(rows[0].StatusDate || '').split(' ')[0] : '',
    totalWeight,
    actual,
    planned,
    variance: actual - planned,
    spi: planned ? actual / planned : null,
    hasWeights,
  };
}

/**
 * The two front ends read the same progress through different columns: Power BI divides the
 * pre-multiplied `ActualWeight`/`PlannedWeight`, while the page multiplies `WeightPercent` by
 * the percentages again. If those disagree the two views show different numbers, so the
 * identity is checked rather than assumed.
 */
export function weightIdentity(rows, tolerance = 0.0005) {
  const leaves = rows.filter((r) => !isTrue(r.IsSummary) && !isTrue(r.IsMilestone));
  let worst = null;
  for (const r of leaves) {
    const w = num(r.WeightPercent);
    const deltas = [
      ['ActualWeight', Math.abs(num(r.ActualWeight) - w * num(r.PhysicalPercentComplete))],
      ['PlannedWeight', Math.abs(num(r.PlannedWeight) - w * num(r.PlannedPercent))],
    ];
    for (const [column, delta] of deltas) {
      if (!worst || delta > worst.delta) worst = { column, delta, row: r };
    }
  }
  return { ok: !worst || worst.delta <= tolerance, tolerance, worst };
}
