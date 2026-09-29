# Technical decisions (and the mistakes that produced them)

Written for the person reviewing this repository — and for the interview. Each entry states the
problem, the decision, and what it cost to learn.

## 1. Why the progress figure is a weighted mean, not an average

**Problem.** A package has 226 leaf items whose importance differs by two orders of magnitude
(0.14 % to ~6 %). Averaging their percentages would let a cable pull outvote a compressor.

**Decision.** Reproduce MS Project's own roll-up instead of inventing a second one:

```
actual  = Σ(WeightPercent × PhysicalPercentComplete) / Σ WeightPercent      (leaf items only)
planned = Σ(WeightPercent × PlannedPercent)          / Σ WeightPercent      (leaf items only)
```

**Consequences.** The dashboard, the report and the CSV all speak the same number, and
`tools/verify-progress.mjs` can be run by anyone suspicious of it. It also means the export must
carry the weights (`Number1`) and the *formula* columns (`Number3` planned %, which is **not**
`% Complete`) — a dashboard that reads `% Complete` instead produces a plausible-looking,
systematically wrong curve. Agreement with MS Project's weighted summary was validated within
0.15 pp; that is the number to test a future change against.

## 2. Why the sync is manual, and there is no scheduler anywhere

**Problem.** The first build synced on a Windows task every 15 minutes. The user saw a console
window flash, concluded "something is running on my machine", and stopped trusting every figure
on the page.

**Decision.** No task, no service, no watcher. The update happens when the user presses the
button, or from the desktop shortcut. The page's own status line says so
(«به‌روزرسانی: دستی»), and the only timer left in the page is a 1/min keep-alive ping so the local
server does not shut down under the user's feet.

**Lesson.** In project controls, *perceived* trustworthiness is part of the specification. A
background process that saves the user nothing costs more than it gives.

## 3. Why there is a second, single-file front end at all

**Problem.** Power BI Desktop must be installed, licensed, and pointed at the right folder, and
the people who read this dashboard are engineers on a site, often on a borrowed laptop. The
numbers also have to be visible in a meeting even when Power BI will not start.

**Decision.** A dependency-free `preview/index.html` (one file, no build step, no CDN) served from
localhost by an 18 KB launcher. It reproduces the itemised maths, the S-curve, the gauge, the
slicers, drill-down, the look-ahead window, the critical-path cut and the A4 print sheet.

**Consequence.** Two front ends over one CSV means the *maths* must be written twice (DAX and
JavaScript), which is exactly why the verifier exists as a third implementation in plain Node.

## 4. Why the S-curve is pinned at both ends

**Problem.** Sampling "planned % at date t" only from the item's start/finish span produces a
curve that drifts away from the KPI cards and never reaches 100 %.

**Decision.** The planned curve is anchored to the itemised planned value **at the status date**
(57.28 %) and to exactly 100 % at the project finish; the actual curve is pinned to the reported
actual at the status date and stays flat afterwards (no fabricated extrapolation). The
comparison mode samples *exact* times so A and B are points on the curve rather than the nearest
samples of a ~7-day step.

**Why it matters.** A progress curve that disagrees with the cards next to it destroys the
report's credibility faster than a missing feature.

## 5. Backend facts that took the longest to learn

**MS Project COM is a hostile API.** `GetActiveObject("MSProject.Application")` can return a
*zombie*: the object answers calls, but `Projects` is empty and `Name` is `""` after a force-killed
instance left a stale ROT registration. `CreateInstance` then throws a transient
`InvalidCastException` while the old process is still tearing down (observed: cleared by itself
after ~3 minutes). The exporter therefore retries activation up to 6 × 5 s, prefers a live
instance, reuses a running MS Project rather than spawning a second one, and falls back to
opening the file head-lessly from disk. It writes the CSV to `.tmp` and moves it into place, so
Power BI can never read a half-written file. A window title showing the MPP open does **not**
mean COM is healthy.

**Elevation breaks the headless path.** If MS Project is started as Administrator, an unelevated
script can neither attach to that instance nor open the MPP; it surfaces as `0x80080005`. The
fix is procedural, not technical: close MS Project, reopen it unelevated.

**A 4.9 MB MPP can take longer than 3 s to open through COM** — poll for readiness instead of
firing and forgetting.

**Hand-written TMDL/PBIR fails silently.** Power BI's dialog says only *"Issues were found"*, and
its text renders in an embedded WebView that neither Win32 nor UI Automation can read (the only
way to see it is a screenshot of the dialog window). Rules paid for one at a time: `//` comments
are invalid in TMDL (only `///`), a `.tmdl` file containing only a comment fails to parse, hand-made
`lineageTag`s break the model, multi-line DAX measures need triple-backtick fencing, and
`compatibilityLevel` must be indented under `database`.

**A custom theme is applied only when its schema matches — otherwise nothing happens.** The file
must keep the full colour-slot set, use only the four canonical `textClasses`
(`callout`/`title`/`header`/`label`), and keep `visualStyles.page`'s `"*"` level. There is no error;
the report simply looks unstyled. `tools/validate-json.mjs` now checks those three rules
mechanically. Card label colours are hardcoded per visual, so they do *not* follow the theme and
have to be edited alongside it.

**Renaming a PBIP is not allowed.** A structurally identical Power BI project whose
`<name>.Report` / `<name>.SemanticModel` folders are renamed opens as a silent, empty *"Untitled"*
report — no dialog, no log, nothing. (Verified by renaming one copy and keeping another: same
bytes, different names, one opens and one does not. `tools/validate-json.mjs` encodes the naming
rule, and `NOTICE.md` explains why the artifact names in this repo keep the source project's code
name.)

## 6. The launchers

**Why C# 5 with `csc.exe`.** The target machines have the .NET Framework but no SDK, no NuGet and
no admin rights. `Scripts/build-launchers.ps1` compiles both launchers with the framework's own
`csc.exe` and nothing else. The consequence is a hard rule: the sources stay C# 5 (no string
interpolation, no null-conditional operator), `/codepage:65001` is mandatory because the sources
carry Persian message text, and a `WinExe` has no console — so every launcher logs to `logs/`,
and the log is the only way to see a crash. One of them shipped a `Log()` that did not create its
own directory, and every line vanished silently for a day.

**What the launchers solve that a shortcut cannot.** They are location-independent: they find the
dashboard folder relative to themselves, fix the model's absolute data path, discover a
non-standard Power BI install (registry → Store build → scan `Program Files` on every drive),
press Power BI's *"Refresh now"* banner through UI Automation, and shut the local server down
three minutes after the browser stops pinging.

## 7. The portable copy

The dashboard is carried on a USB stick between three machines, so there is a build that
assembles exactly two launchers, one drop folder for the engineers' MPP and one bilingual README.
Two rules keep it honest:

- the build **self-verifies**: it runs the exporter inside the copy, re-exports the shipped MPP
  into a scratch folder and fails unless the two `tasks.csv` files are byte-identical, then prints
  the head-line numbers;
- `data/` and `Project-File/` are **never** mirrored from the dev tree into the copy: the
  engineers' MPP is usually newer than the dev copy, and copying ours over it would silently roll
  the reported numbers back.

## 8. Data, and the line between "anonymised" and "invented"

The published dataset keeps the project's real *shape* (row counts, weights, percentages,
critical flags) and replaces its *identity* (every name, the whole calendar, the ids). Keeping
the numbers is what makes the dashboard's figures real; replacing the identity is what makes
publishing it acceptable. `tools/anonymize-data.mjs` does the transformation, refuses to write its
output while a forbidden token survives, and writes a rename map that stays on the author's
machine — with `--perturb` available when even the numeric shape should not be traceable.
`NOTICE.md` states exactly what was kept, what was replaced and what deliberately still carries
the code name.
