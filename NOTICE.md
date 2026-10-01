# NOTICE — provenance of the published data

This repository is an extract of a **real progress-control system** for a refinery
EPC package. The system itself is published as-is; the project's *data* is not, and neither is
the vocabulary that identifies it. This file documents exactly what was changed, what was kept,
and what deliberately still carries the project's code name, so that nobody has to guess.

## What the shipped dataset is

`Refinery8-FGR-Dashboard/data/` holds a **derived, anonymised** dataset produced by
[`tools/anonymize-data.mjs`](tools/anonymize-data.mjs) from the project's own MS Project export.
It is structurally identical to the original: the same number of rows (245), leaf items (226),
milestones (19), the same phase → discipline → item hierarchy, the same weights, the same
schedule-critical flags.

**Replaced**

| Field | Treatment |
|---|---|
| `TaskName`, `Disciplines`, `Phase` | every identifying word replaced: the three plant-unit names, the unit numbers, the site name, client-side wording and the project title — 241 of 245 rows renamed, including all 19 milestone names |
| `WBS` | unchanged in shape; the project code inside it follows the renamed items |
| `Start`, `Finish`, `StatusDate` | the whole calendar is shifted by a **fixed −767 days**, so durations, leads and lags and the planned/actual relationship are preserved while no real date remains (sample status date: 2025-06-30) |
| `UniqueID` | renumbered sequentially, so no id links back to the source file |
| `project-info.csv` | `RefreshedAt` shifted with the rest |

**Kept on purpose**

Weights (`WeightPercent`), progress (`PhysicalPercentComplete`, `PlannedPercent`) and their
derived columns (`PlannedWeight`, `ActualWeight`) are the *mathematics* of the project, not its
identity: they are what makes the dashboard's numbers (42.1 % / 57.3 % / −15.1 pp) real rather
than invented, and they are what `tools/verify-progress.mjs` checks. Without them the repository
would be a mock-up. Anonymised, they are a numeric matrix with no names attached; the anonymiser
also offers a `--perturb` switch that jitters them if that is ever not enough.

**Not published**

- the source `.mpp` file (and the `Project-File/` drop folder is empty);
- the real CSV export and the reported project/commercial documents it came from;
- the anonymisation rules, the rename map and the leak-scan vocabulary
  (`tools/*.local.*`, gitignored on purpose — the list of words *is* identifying);
- the author's machine paths, the Power BI local caches (`.pbi/`) and all run logs.

## What still carries the project's code name

The **artifact file and folder names** stay as the source project names them:
`Refinery8-FGR.pbip`, `Refinery8-FGR.Report/`, `Refinery8-FGR.SemanticModel/`,
`Refinery8-FGR-Dashboard/`, and the `displayName` entries in the two `.platform` files.

That is not an oversight. Renaming them was implemented and tested, and **Power BI Desktop then
refuses to open the project**: a renamed `<name>.Report` / `<name>.SemanticModel` pair opens as a
silent, empty *"Untitled"* report with no error dialog, while the same content under the original
names opens normally. Since the point of the repository is a working Power BI half, the names
stay, and they are recorded as a consciously accepted finding in
`tools/leak-allow.local.txt` so that `node tools/leak-check.mjs` keeps a clean, honest report
(“clean” + “accepted and disclosed: 5”).

Every **displayed** title is anonymised instead: the Power BI page headers, the unit slicer
title, the offline page's title/subtitle and the notifications it shows all read
“Gas Recovery Units EPC” / «واحدهای بازیابی گاز».

The original Persian operations manual (`Refinery8-FGR-Dashboard/README.md`), the portable manual
and the launcher/exporter sources are published as they are, because they refer to the file names
above; they contain no schedule data. Two deliberate edits were made to them: descriptive wording
that named the plant units or the project (a handful of comments, one manual heading, one
add-in description) was replaced with neutral wording, and one manual line that quoted the source
`.mpp` file name now points at `Project-File/` instead. Those edits touch comments and prose only
- no functional code, no identifier and no message shown by a running launcher was changed.

## Rights, permission and no warranty

The project schedule and everything derived from it belong to the project and its owner.
It is published here **for demonstration of the tooling**, after removing the identifying
content described above, and it is the author's responsibility — not the reader's — to keep it
that way. If you are the owner and you want any part of it removed, that request will be honoured
without discussion.

The anonymised dataset is **not** a real schedule and must not be used as one, for planning,
procurement or any contractual purpose. The code is licensed under [LICENSE](LICENSE); that
licence covers the code, not the project data.
