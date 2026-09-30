# 🏗️ Construction Progress Dashboard — Refinery EPC

**MS Project → weighted itemised progress → Power BI + a zero-install offline dashboard**

[![checks](https://github.com/hossein-moradi-sci/refinery-epc-progress-dashboard/actions/workflows/checks.yml/badge.svg)](https://github.com/hossein-moradi-sci/refinery-epc-progress-dashboard/actions/workflows/checks.yml)
[![licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![data: anonymised](https://img.shields.io/badge/data-anonymised-informational.svg)](NOTICE.md)

<p align="center">
  <a href="README.md"><img alt="English" src="https://img.shields.io/badge/English-0969da?style=for-the-badge"></a>
  <a href="README.fa.md"><img alt="فارسی" src="https://img.shields.io/badge/%D9%81%D8%A7%D8%B1%D8%B3%DB%8C-2ea043?style=for-the-badge"></a>
</p>

![The offline dashboard — Persian UI, dark theme](docs/img/dashboard-dark.png)

This project was commissioned by the maintenance supervisor of a refinery and delivered end to
end. It reads the schedule straight out of MS Project, boils it down to one small CSV, and drives
**two completely independent front ends** from that single file: a four-page Power BI report, and
a one-file web dashboard that opens on a machine with nothing installed on it.

The figure it shows is the **weighted itemised** progress a planner actually signs off — not an
average of task percentages — and it lands within **0.15 pp** of MS Project's own roll-up.

> ⚠️ **About the data — the shipped dataset is anonymised.**
> This repo was extracted from a real construction project. Every task name, discipline, milestone,
> project title and date in `data/` was replaced with a generated equivalent by
> `tools/anonymize-data.mjs`, and the whole calendar is shifted. The weights and percentages are
> the project's own, which is what makes the numbers below real instead of invented. The `.mpp`,
> the real export, and the vocabulary used to anonymise them are **not** published.
> [NOTICE.md](NOTICE.md) spells out exactly what changed and what deliberately stayed.

## 📊 The numbers

| | |
|---|---|
| Schedule items exported | **245 rows** — 226 leaf items + 19 milestones |
| Weighted actual progress | **42.1 %** (`Σ weight × Physical % Complete / Σ weight`) |
| Weighted planned progress | **57.3 %** |
| Variance | **−15.1 pp** (running behind plan) |
| Schedule Performance Index | **0.74** (`actual / planned` — schedule only, the export carries no cost data) |
| Milestones complete | **8 / 19** |
| Critical items | **14** |
| Status date (sample data) | 2025-06-30 |
| Agreement with MS Project's own roll-up | within **0.15 pp**, at every task level |

## 🤔 Why it exists

Progress on a construction package is never a plain average of task percentages. It is a
**weighted** roll-up: a 0.2 %-weight instrument cable should not count as much as a 6 %-weight
compressor, and in MS Project it does not.

The catch is that MS Project works that out with its own internal formula columns. One
hand-edited cell, and every downstream report quietly disagrees with the schedule the client
signs off. So the goal here was boring and important — make **the same number** show up in three
places:

1. in MS Project, where the engineers edit `Physical % Complete`;
2. in Power BI, for the report pack and the weekly meeting;
3. on a page that opens from a USB stick on a machine with nothing installed.

## 🖼️ Screenshots

| Offline dashboard (light theme) | The A4 meeting sheet it prints |
|---|---|
| ![Light theme](docs/img/dashboard-light.png) | ![Meeting sheet](docs/img/meeting-sheet.png) |

| Power BI — overview (FA) | Power BI — item details (FA) |
|---|---|
| ![Power BI overview](docs/img/pbi-page1-dashboard-fa.png) | ![Power BI details](docs/img/pbi-page2-details-fa.png) |

Full-page capture: [`docs/img/dashboard-full.png`](docs/img/dashboard-full.png) ·
English report pages: [`pbi-page3`](docs/img/pbi-page3-dashboard-en.png) / [`pbi-page4`](docs/img/pbi-page4-details-en.png)

## 🧩 How the pieces fit

```mermaid
flowchart LR
    MPP["Refinery8-FGR-Project.mpp<br/>(MS Project, edited by the engineers)"]
    EXP["Scripts/export-msp-data.ps1<br/>PowerShell + MS Project COM"]
    CSV["data/tasks.csv<br/>17 columns · 245 rows"]
    PBI["Power BI report<br/>4 pages · 28 visuals · 10 DAX measures"]
    WEB["preview/index.html<br/>single file · no install · offline"]
    EXE1["Launch Power BI Report.exe"]
    EXE2["Launch Offline Dashboard.exe"]

    MPP --> EXP --> CSV
    CSV --> PBI
    CSV --> WEB
    EXE1 -.->|rewrites the data path, then opens| PBI
    EXE2 -.->|serves on 127.0.0.1 and opens the browser| WEB
```

One file changes → both views change. Renaming a CSV column means touching the exporter, the TMDL
tables and the page in the same commit; that constraint is written down in
[docs/architecture.md](docs/architecture.md).

## 🧮 The maths

| Measure | Formula |
|---|---|
| Weighted actual | `Σ (WeightPercent × PhysicalPercentComplete) / Σ WeightPercent` over **leaf items only** |
| Weighted planned | `Σ (WeightPercent × PlannedPercent) / Σ WeightPercent` over leaf items |
| Variance | `actual − planned` |
| SPI | `actual / planned` — schedule index; deliberately **not** CPI, because the export has no cost data |

The model does this in DAX from `ActualWeight` / `PlannedWeight`; the page and
`tools/verify-progress.mjs` recompute it from `WeightPercent` × the percentages. Both paths are
checked against each other — that is the point of the verifier below.

## 📁 What's where

```
.
├─ README.md                        this file (English)
├─ README.fa.md                     the same README in Persian
├─ Launch Offline Dashboard.exe     one-click offline page (Windows, no install)
├─ Launch Power BI Report.exe       fixes the data path, syncs, opens the report
├─ Project-File/                    drop folder for the engineers' .mpp  (see its README)
├─ Refinery8-FGR-Dashboard/         the dashboard itself
│   ├─ Refinery8-FGR.pbip           Power BI project (report + semantic model)
│   ├─ Refinery8-FGR.Report/        4 pages, 28 visuals, FA + EN, custom theme
│   ├─ Refinery8-FGR.SemanticModel/ hand-written TMDL: 3 tables, 10 measures
│   ├─ data/                        the synced CSVs (the anonymised sample ships here)
│   ├─ preview/index.html           the offline dashboard — one file, 4,090 lines
│   ├─ preview/server.mjs           the same static server in Node (dev/agent use)
│   ├─ Scripts/                     exporter (PowerShell), launchers (C#), build script
│   └─ README.md                    the original Persian operations manual
├─ tools/                           anonymise · verify · leak-check · validate · check-page
├─ .github/workflows/checks.yml     the gates that run on every push
└─ docs/                            architecture, decisions, portfolio text, screenshots
```

## 🚀 Quick start

**Nothing installed — just the offline dashboard**

```
1. Double-click  Launch Offline Dashboard.exe
2. It serves the page on http://127.0.0.1:8642 and opens your browser.
```

The page comes up in Persian with an EN switch, seven colour themes, slicers, drill-down (global
and per-chart), a chart picker, period comparison, look-ahead, a virtualised item table, and an
A4 meeting sheet on `P` / `Ctrl+P`. It needs **no** Power BI, **no** Node, **no** internet.

Nothing in it runs on a timer, on purpose: the numbers only move when you press
**«به‌روزرسانی از MS Project»**, which runs the exporter hidden and reloads the page.

**The Power BI report**

```
1. Double-click  Launch Power BI Report.exe
   (it rewrites the model's absolute data path to this folder, syncs if a .mpp is present,
    then opens Refinery8-FGR.pbip)
2. No .mpp yet? The report still opens on the CSV that ships in data/.
```

**Refreshing from a real schedule**

```
1. Put the engineers' .mpp into Project-File\   (newest file wins, the name does not matter)
2. powershell -File Refinery8-FGR-Dashboard\Scripts\export-msp-data.ps1     (needs MS Project)
3. Offline page: press the update button.   Power BI: press Refresh.
```

The workflow is **manual by design**. There is no Windows task, service or watcher anywhere in
this project, because a construction team that sees a window appear by itself stops trusting the
numbers. The cadence is the file motion between engineers, not a timer.

## 🛠️ What was actually hard

The domain maths is a weighted mean. Everything around it was the engineering.

- **MS Project COM is a grumpy API.** `GetActiveObject` can hand you back a zombie whose
  `Projects` collection is empty, after an instance has been force-killed; `CreateInstance` throws
  a transient `InvalidCastException` while a previous process is still deregistering. So the
  exporter retries activation, prefers a *live* instance, reuses a running MS Project instead of
  spawning a second one, and falls back to opening the file from disk head-lessly — writing the
  CSV atomically (`.tmp` → move) so Power BI can never read a half-written file.
- **The Power BI project is hand-written.** The `.pbip` is TMDL + PBIR JSON, and the failure mode
  of a mistake is a dialog that says only *"Issues were found"* — the real message renders in a
  WebView that neither Win32 nor UI Automation can read. `//` comments are invalid (only `///`),
  hand-made `lineageTag`s break the model, and a theme that is one colour slot short is silently
  ignored rather than reported.
- **Portability comes down to one absolute path.** Power Query has no relative-path option, so the
  model's `DataFolder` parameter is absolute and moving the folder breaks every table. The Power BI
  launcher rewrites that value on each launch — that is the single line that makes the USB-stick
  copy work.
- **The launchers are C# 5 by constraint.** They are compiled with the .NET Framework's `csc.exe`
  (no SDK, no NuGet): one serves the folder on loopback and shuts itself down three minutes after
  the last page heartbeat, the other finds a non-standard Power BI install, fixes the data path
  and presses Power BI's *"Refresh now"* banner through UI Automation.
- **The report has to survive a printing.** The meeting sheet is built off-screen, measured and
  filled row by row until one A4 page would overflow, then printed with the light "paper" palette
  even when the dashboard is dark — which is why the sheet re-renders its own S-curve instead of
  cloning the dark one.

More of this, including the mistakes that produced those rules, is in
[docs/technical-decisions.md](docs/technical-decisions.md).

## ✅ Check it yourself

Nothing here asks to be taken on trust. Every claim above has a command behind it, and the three
that need no private data run in CI on each push — that is the badge at the top of this file.

| Gate | Command | What it proves | CI |
|---|---|---|---|
| Progress maths | `node tools/verify-progress.mjs --expect "42.1,57.3,-15.1" --leaves 226 --milestones 19 --critical 14` | the CSV still rolls up to the numbers the dashboard claims, and Power BI's weight columns agree with the page's arithmetic | ✅ |
| Report/model integrity | `node tools/validate-json.mjs` | every `.json`/`.pbip`/`.platform` parses, the custom theme is wired and shaped the way Power BI actually applies it, and the project paths resolve | ✅ |
| Page syntax | `node tools/check-page.mjs` | the page has exactly one `<script>` block and it parses as JavaScript | ✅ |
| Anonymisation | `node tools/leak-check.mjs` | none of the source project's vocabulary survives anywhere in the tree — binaries included | author-side |
| Launchers | `powershell -File Refinery8-FGR-Dashboard\Scripts\build-launchers.ps1 -OutDir .` | the `.cs` sources still compile with the framework's `csc.exe`, no SDK needed | Windows |

```bash
# thirty seconds, from a fresh clone, no install:
node tools/verify-progress.mjs --expect "42.1,57.3,-15.1" --leaves 226 --milestones 19 --critical 14
node tools/validate-json.mjs
node tools/check-page.mjs
```

The leak scan inevitably carries the vocabulary of the project it is protecting, so it is the one
gate that stays on the machine that owns the data: [tools/README.md](tools/README.md) explains
that split, and [NOTICE.md](NOTICE.md) documents what the anonymisation did and the one leftover
it consciously accepts.

## ⚠️ What this is not

- **Not multi-user.** Single user, single machine: no server, no database, no shared state. Two
  people editing the same copy of the *dashboard* would collide — that is what the `.mpp` hand-off
  is for.
- **No cost data**, so there is deliberately no CPI, no earned-value cost curve and no forecast to
  complete. Adding them means extending the exporter first.
- **Not real-time.** Refresh is manual by design (see above), so "the number is stale" is a
  workflow property, not a bug.
- **Windows-first.** The launchers and the exporter use MS Project COM and WinForms; the *page*
  itself is plain HTML/JS and runs anywhere you can serve it from.
- **Not a Power BI replacement.** The offline page reproduces the itemised maths, the S-curve and
  the slicers; the client-facing report pages live in Power BI.

## 🧑‍💻 How I built it

I am an electrical power engineer, not a software engineer. The commission came from the
maintenance supervisor of a refinery — the name stays out of this repo — and I delivered it end
to end. I specified this tool, I own its domain logic — the weighted roll-up, the look-ahead
window, what SPI does and does not mean — I checked every number against MS Project, and I
tested it on Windows across all three paths: USB stick, Power BI, offline page. The code itself was written in **AI-assisted** sessions under my
direction. That is also the honest reason this repo carries so much written-down reasoning and a
`tools/` folder: the verification had to be something I could run and read myself.

**Reviewing this?** The parts worth poking at are the weighted roll-up, why the S-curve is pinned
at both ends, why the donut filters instead of drilling, and why the sync is manual.

## 📄 Licence and data

Code: [MIT](LICENSE). The sample dataset is derived from a real project and is published for
demonstration only — read [NOTICE.md](NOTICE.md) before reusing it.

**Eng. Hossein Moradi** — power/electrical technology engineer, construction project controls.

---

🌐 نسخهٔ فارسی همین توضیحات: **[README.fa.md](README.fa.md)**
