<a id="en"></a>

# 🏗️ Construction Progress Dashboard — Refinery EPC

**MS Project → weighted itemised progress → Power BI + a zero-install offline dashboard**

[![checks](https://github.com/hossein-moradi-sci/refinery-epc-progress-dashboard/actions/workflows/checks.yml/badge.svg)](https://github.com/hossein-moradi-sci/refinery-epc-progress-dashboard/actions/workflows/checks.yml)
[![licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![data: anonymised](https://img.shields.io/badge/data-anonymised-informational.svg)](NOTICE.md)

<p align="center">
  <a href="#en"><img alt="English" src="https://img.shields.io/badge/English-0969da?style=for-the-badge"></a>
  <a href="#fa"><img alt="فارسی" src="https://img.shields.io/badge/%D9%81%D8%A7%D8%B1%D8%B3%DB%8C-2ea043?style=for-the-badge"></a>
</p>

![The offline dashboard — Persian UI, dark theme](docs/img/dashboard-dark.png)

I build progress-control tooling for construction projects. This one reads the schedule straight
out of MS Project, boils it down to one small CSV, and drives **two completely independent front
ends** from that single file: a four-page Power BI report, and a one-file web dashboard that opens
on a machine with nothing installed on it.

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

I am an electrical power engineer, not a software engineer. I specified this tool, I own its
domain logic — the weighted roll-up, the look-ahead window, what SPI does and does not mean — I
checked every number against MS Project, and I tested it on Windows across all three paths: USB
stick, Power BI, offline page. The code itself was written in **AI-assisted** sessions under my
direction. That is also the honest reason this repo carries so much written-down reasoning and a
`tools/` folder: the verification had to be something I could run and read myself.

**Reviewing this?** The parts worth poking at are the weighted roll-up, why the S-curve is pinned
at both ends, why the donut filters instead of drilling, and why the sync is manual.

## 📄 Licence and data

Code: [MIT](LICENSE). The sample dataset is derived from a real project and is published for
demonstration only — read [NOTICE.md](NOTICE.md) before reusing it.

**Eng. Hossein Moradi** — power/electrical technology engineer, construction project controls.

---

<a id="fa"></a>

<div dir="rtl">

# 🏗️ داشبورد پیشرفت پروژهٔ EPC — پالایشگاه

**از MS Project تا پیشرفت آیتمیک وزنی، و از آنجا تا Power BI و یک داشبورد وب آفلاین بدون نصب**

<p align="center">
  <a href="#en"><img alt="English" src="https://img.shields.io/badge/English-0969da?style=for-the-badge"></a>
  <a href="#fa"><img alt="فارسی" src="https://img.shields.io/badge/%D9%81%D8%A7%D8%B1%D8%B3%DB%8C-2ea043?style=for-the-badge"></a>
</p>

![داشبورد آفلاین — رابط فارسی، تم تیره](docs/img/dashboard-dark.png)

من برای پروژه‌های عمرانی ابزار کنترل پیشرفت می‌سازم. این ابزار برنامه را مستقیم از MS Project
می‌خواند، آن را به یک CSV کوچک تبدیل می‌کند و از همان یک فایل **دو نمایش کاملاً مستقل** می‌سازد:
یک گزارش چهارصفحه‌ای Power BI، و یک داشبورد وب تک‌فایلی که روی سیستمی که هیچ‌چیز نصب ندارد باز
می‌شود.

عددی که نشان می‌دهد همان پیشرفت **آیتمیک وزنی** است که برنامه‌ریز پروژه تحویل می‌گیرد — نه
میانگین درصد کارها — و با جمع‌بندی خود MS Project تا کمتر از **۰٫۱۵ واحد درصد** جور درمی‌آید.

> ⚠️ **دربارهٔ داده‌ها — دیتاست منتشرشده بی‌نام است.**
> این مخزن از یک پروژهٔ عمرانی واقعی بیرون آمده. نام همهٔ آیتم‌ها، دیسیپلین‌ها، نقاط عطف، عنوان
> پروژه و تاریخ‌ها در پوشهٔ `data/` با ابزار `tools/anonymize-data.mjs` جانشین شده‌اند و کل تقویم
> جابه‌جا شده است. وزن‌ها و درصدها اما، اعداد واقعی خودِ پروژه‌اند؛ همان چیزی که باعث می‌شود
> عددهای پایین واقعی باشند و نه ساختگی. فایل `.mpp`، خروجی واقعی و واژگانی که برای بی‌نام‌سازی
> استفاده شده **منتشر نشده‌اند**. جزئیات دقیق در [NOTICE.md](NOTICE.md).

## 📊 اعداد کلیدی

| | |
|---|---|
| اقلام خروجی | **۲۴۵ ردیف** — ۲۲۶ آیتم برگ + ۱۹ نقطهٔ عطف |
| پیشرفت واقعی وزنی | **۴۲٬۱٪** = `Σ (وزن × Physical % Complete) ÷ Σ وزن` |
| پیشرفت برنامه‌ای وزنی | **۵۷٬۳٪** |
| انحراف | **−۱۵٬۱ واحد درصد** (عقب‌تر از برنامه) |
| شاخص SPI | **۰٫۷۴** (واقعی ÷ برنامه‌ای — فقط زمان‌بندی؛ خروجی دادهٔ هزینه ندارد) |
| نقاط عطف تکمیل‌شده | **۸ از ۱۹** |
| اقلام بحرانی | **۱۴** |
| تاریخ وضعیت (دادهٔ نمونه) | ۲۰۲۵-۰۶-۳۰ |
| تطابق با جمع‌بندی خود MS Project | کمتر از **۰٬۱۵ واحد درصد**، در همهٔ سطوح |

## 🤔 چرا ساخته شد

پیشرفت یک پکیج عمرانی هیچ‌وقت میانگین سادهٔ درصد کارها نیست؛ **میانگین وزنی** است. یک کابل
ابزار دقیق با وزن ۰٬۲٪ نباید هم‌قدر یک کمپرسور با وزن ۶٪ حساب شود — و در MS Project هم نمی‌شود.

مشکل اینجاست که MS Project این حساب را با ستون‌های فرمول داخلی خودش انجام می‌دهد. یک سلول که
دستی عوض شود، و تمام گزارش‌های بعدی بی‌سروصدا با برنامه‌ای که تحویل کارفرما می‌شود اختلاف پیدا
می‌کنند. هدف این پروژه دقیقاً همین بود؛ کاری کسل‌کننده و مهم: اینکه **همان یک عدد** در سه جا
دیده شود:

۱. در MS Project، همان‌جا که مهندس‌ها `Physical % Complete` را وارد می‌کنند؛
۲. در Power BI، برای پک گزارش و جلسهٔ هفتگی؛
۳. روی صفحه‌ای که از روی فلش، روی سیستمی که هیچ‌چیز نصب ندارد باز می‌شود.

## 🖼️ تصاویر

| داشبورد آفلاین (تم روشن) | برگهٔ چاپ جلسه (A4) |
|---|---|
| ![تم روشن](docs/img/dashboard-light.png) | ![برگهٔ جلسه](docs/img/meeting-sheet.png) |

| Power BI — نمای کلی (فارسی) | Power BI — جزئیات اقلام (فارسی) |
|---|---|
| ![نمای کلی](docs/img/pbi-page1-dashboard-fa.png) | ![جزئیات](docs/img/pbi-page2-details-fa.png) |

تصویر کامل صفحه: [`docs/img/dashboard-full.png`](docs/img/dashboard-full.png) ·
صفحات انگلیسی گزارش: [`pbi-page3`](docs/img/pbi-page3-dashboard-en.png) / [`pbi-page4`](docs/img/pbi-page4-details-en.png)

## 🧩 اجزا چطور به هم می‌خورند

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

یک فایل عوض می‌شود → هر دو نمایش عوض می‌شوند. اسم یک ستون CSV را که عوض کنید، باید در همان
کامیت دست به اکسپورتر، جدول‌های TMDL و صفحهٔ وب هم ببرید؛ همین قید در
[docs/architecture.md](docs/architecture.md) نوشته شده است.

## 🧮 فرمول‌ها

| سنجه | فرمول |
|---|---|
| پیشرفت واقعی وزنی | `Σ (WeightPercent × PhysicalPercentComplete) ÷ Σ WeightPercent` — فقط روی **آیتم‌های برگ** |
| پیشرفت برنامه‌ای وزنی | `Σ (WeightPercent × PlannedPercent) ÷ Σ WeightPercent` — روی آیتم‌های برگ |
| انحراف | `واقعی − برنامه‌ای` |
| SPI | `واقعی ÷ برنامه‌ای` — شاخص زمان‌بندی؛ **عمداً** CPI نیست، چون خروجی دادهٔ هزینه ندارد |

مدل Power BI این کار را در DAX و از روی `ActualWeight` و `PlannedWeight` انجام می‌دهد؛ صفحهٔ وب و
`tools/verify-progress.mjs` همان را از `WeightPercent` × درصدها بازحساب می‌کنند. هر دو مسیر با هم
مقایسه می‌شوند — دلیل وجود همان ابزار راستی‌آزمایی همین است.

## 📁 ساختار مخزن

<div dir="ltr">

```
.
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

</div>

## 🚀 شروع سریع

**بدون نصب — فقط داشبورد آفلاین:** روی `Launch Offline Dashboard.exe` دوبار کلیک کنید. صفحه را
روی `http://127.0.0.1:8642` سرو می‌کند و مرورگرتان را باز می‌کند.

صفحه با زبان فارسی و یک کلید EN بالا می‌آید: هفت تم رنگی، فیلترها، کاوش (در سطح کل صفحه و
به‌تفکیک هر نمودار)، انتخابگر نمودار، مقایسهٔ دو بازهٔ زمانی، پیش‌نگر (Look-ahead)، جدول
مجازی‌سازی‌شدهٔ اقلام، و برگهٔ جلسهٔ A4 با کلید `P` یا `Ctrl+P`. نه Power BI لازم دارد، نه Node،
نه اینترنت.

هیچ‌چیز در آن روی تایمر اجرا نمی‌شود و این عمدی است: عددها فقط وقتی عوض می‌شوند که دکمهٔ
**«به‌روزرسانی از MS Project»** را بزنید — همان دکمه اکسپورتر را بی‌صدا اجرا می‌کند و صفحه را
نو می‌کند.

**گزارش Power BI:** `Launch Power BI Report.exe` را اجرا کنید. مسیر مطلق دادهٔ مدل را با پوشهٔ
فعلی هماهنگ می‌کند، اگر فایل `.mpp` موجود باشد سینک می‌کند و بعد `Refinery8-FGR.pbip` را باز
می‌کند. اگر هنوز `.mpp` نگذاشته باشید، گزارش با همان CSV موجود در `data/` باز می‌شود.

**سینک از برنامهٔ واقعی:** فایل `.mpp` را در `Project-File\` بگذارید (جدیدترین فایل خوانده
می‌شود، اسم مهم نیست)، بعد `Scripts/export-msp-data.ps1` را اجرا کنید (نیازمند MS Project) و در
صفحه دکمهٔ به‌روزرسانی، یا در Power BI دکمهٔ Refresh را بزنید.

این روال **عمداً دستی** است. هیچ تسک ویندوزی، سرویس یا ناظری در این پروژه وجود ندارد، چون تیمی
که پنجره‌ای را خودبه‌خود بالا بیاید ببیند، دیگر به عددها اعتماد نمی‌کند. ریتم کار، جابه‌جایی فایل
بین مهندس‌هاست، نه تایمر.

## 🛠️ کجای کار واقعاً سخت بود

ریاضیات دامنه‌ای‌اش یک میانگین وزنی است؛ سختی، همه‌جای دیگری بود.

- **COM در MS Project اخلاق خوشی ندارد.** `GetActiveObject` می‌تواند یک نمونهٔ مرده برگرداند که
  مجموعهٔ `Projects` آن خالی است (بعد از kill شدن اجباری)، و `CreateInstance` وقتی نمونهٔ قبلی
  هنوز در حال deregister شدن است، `InvalidCastException` می‌دهد. برای همین اکسپورتر فعال‌سازی را
  دوباره تلاش می‌کند، نمونهٔ *زنده* را ترجیح می‌دهد، همان MS Project در حال اجرا را قرض می‌گیرد و
  نه اینکه دومی بسازد، و در نهایت فایل را بی‌سر‌و‌صدا از روی دیسک باز می‌کند — و CSV را اتمیک
  می‌نویسد (`.tmp` → move) که Power BI هرگز فایل نیمه‌نوشته نخواند.
- **پروژهٔ Power BI دست‌نویس است.** فایل `.pbip` ترکیبی است از TMDL و JSON همان PBIR، و مدل شکست
  یک اشتباه، پنجره‌ای است که فقط می‌گوید *«Issues were found»* — پیام واقعی در یک WebView رندر
  می‌شود که نه Win32 می‌تواند بخواندش و نه UI Automation. کامنت `//` نامعتبر است (فقط `///`)،
  `lineageTag` دست‌ساز مدل را می‌شکند، و تمی که یک اسلات رنگی کم داشته باشد، بی‌صدا نادیده گرفته
  می‌شود و خطایی نمی‌دهد.
- **پرتابل بودن به یک مسیر مطلق گره خورده.** Power Query گزینهٔ مسیر نسبی ندارد، پس پارامتر
  `DataFolder` مدل مطلق است و جابه‌جا کردن پوشه همهٔ جدول‌ها را می‌شکند. اجراکنندهٔ Power BI این
  مقدار را در هر اجرا از نو می‌نویسد؛ همین یک خط باعث می‌شود نسخهٔ روی فلش کار کند.
- **اجراکننده‌ها به‌اجبار C# 5 هستند.** با `csc.exe` خودِ .NET Framework کامپایل می‌شوند (بدون SDK
  و NuGet): یکی پوشه را روی loopback سرو می‌کند و سه دقیقه بعد از آخرین ضربان‌آهنگ صفحه خودش را
  خاموش می‌کند، دیگری نصب غیراستاندارد Power BI را پیدا می‌کند، مسیر داده را درست می‌کند و از طریق
  UI Automation دکمهٔ *«Refresh now»* را می‌زند.
- **گزارش باید از چاپ سالم بیرون بیاید.** برگهٔ جلسه بیرون از قاب ساخته می‌شود، اندازه‌گیری و
  ردیف‌به‌ردیف پر می‌شود تا یک صفحهٔ A4 پر شود، و بعد با پالت روشن «کاغذی» چاپ می‌شود — حتی وقتی
  داشبورد تیره است. برای همین همان برگه منحنی S خودش را از نو می‌کشد و منحنی تیره را کپی نمی‌کند.

اشتباه‌هایی که این قیدها را ساختند، در [docs/technical-decisions.md](docs/technical-decisions.md)
نوشته شده‌اند.

## ✅ خودت چک کن

هیچ‌جای این پروژه نمی‌خواهد که پذیرفته شود؛ هر ادعای بالا یک فرمان پشتش است، و آن سه فرمانی که
دادهٔ خصوصی نمی‌خواهند در هر push اجرا می‌شوند — همان بج بالای همین صفحه.

| دروازه | فرمان | چه چیزی را ثابت می‌کند | CI |
|---|---|---|---|
| ریاضیات پیشرفت | `node tools/verify-progress.mjs --expect "42.1,57.3,-15.1" --leaves 226 --milestones 19 --critical 14` | CSV همان عددهایی را می‌دهد که داشبورد ادعا می‌کند، و ستون‌های وزنی Power BI با حساب صفحهٔ وب می‌خوانند | ✅ |
| سلامت گزارش و مدل | `node tools/validate-json.mjs` | همهٔ فایل‌های `.json`/`.pbip`/`.platform` پارس می‌شوند، تم سفارشی همان‌طور که Power BI واقعاً اعمال می‌کند سیم‌کشی شده، و مسیرهای پروژه سر جایشان هستند | ✅ |
| سینتکس صفحه | `node tools/check-page.mjs` | صفحه دقیقاً یک بلوک `<script>` دارد و به‌عنوان جاوااسکریپت پارس می‌شود | ✅ |
| بی‌نام‌سازی | `node tools/leak-check.mjs` | هیچ واژه‌ای از پروژهٔ اصلی در هیچ‌جای درخت نمانده — حتی داخل فایل‌های اجرایی | سمت نویسنده |
| اجراکننده‌ها | `powershell -File Refinery8-FGR-Dashboard\Scripts\build-launchers.ps1 -OutDir .` | سورس‌های `.cs` با `csc.exe` خودِ فریم‌ورک کامپایل می‌شوند، بدون نیاز به SDK | ویندوز |

<div dir="ltr">

```bash
# thirty seconds, from a fresh clone, no install:
node tools/verify-progress.mjs --expect "42.1,57.3,-15.1" --leaves 226 --milestones 19 --critical 14
node tools/validate-json.mjs
node tools/check-page.mjs
```

</div>

اسکن نشت، طبعاً واژگان همان پروژه‌ای را با خود دارد که از آن محافظت می‌کند؛ پس تنها دروازه‌ای است
که روی همان سیستمی می‌ماند که داده را دارد. [tools/README.md](tools/README.md) این تقسیم را توضیح
می‌دهد و [NOTICE.md](NOTICE.md) نوشته که بی‌نام‌سازی دقیقاً چه کرد و تنها بازماندهٔ پذیرفته‌شده چیست.

## ⚠️ این پروژه چه چیزی نیست

- **چندکاربره نیست.** تک‌کاربر و تک‌سیستم: بدون سرور، بدون دیتابیس، بدون state مشترک. دو نفر که
  هم‌زمان یک نسخه از *داشبورد* را ویرایش کنند، به هم می‌خورند — کاری که تحویل فایل `.mpp` انجام
  می‌دهد.
- **دادهٔ هزینه ندارد**، پس عمداً CPI، منحنی هزینهٔ ارزش کسب‌شده و پیش‌بینی تا اتمام وجود ندارد.
  اضافه کردنشان اول از همه یعنی بزرگ کردن اکسپورتر.
- **زمان‌واقعی نیست.** به‌روزرسانی عمداً دستی است (بالاتر توضیح دادم)، پس «عدد کهنه شده» یک ویژگی
  روال کار است، نه باگ.
- **ویندوزی است.** اجراکننده‌ها و اکسپورتر از COM در MS Project و WinForms استفاده می‌کنند؛ خودِ
  *صفحهٔ وب* HTML/JS ساده است و هرجا سرو شود کار می‌کند.
- **جای Power BI را نمی‌گیرد.** صفحهٔ آفلاین همان ریاضیات آیتمیک، منحنی S و فیلترها را دارد؛
  صفحات رو به کارفرمای گزارش، در Power BI می‌مانند.

## 🧑‍💻 این را چطور ساختم

من مهندس برق قدرت هستم، نه مهندس نرم‌افزار. این ابزار را خودم مشخص کردم، منطق کاری‌اش هم مال خودم
است — میانگین وزنی، پنجرهٔ پیش‌نگر (Look-ahead)، و اینکه SPI چه معنایی دارد و چه معنایی ندارد.
همهٔ عددها را با خود MS Project چک کردم و هر سه مسیر را روی ویندوز تست کردم: فلش، Power BI و
صفحهٔ آفلاین. کدش را در جلسه‌های **AI-assisted** و زیر نظر خودم نوشتم. همین هم دلیل صادقانهٔ این
است که چرا این مخزن این‌قدر سند و توضیح دارد و یک پوشهٔ `tools/` هم کنارش است: راستی‌آزمایی باید
چیزی می‌بود که خودم بتوانم اجرا کنم و بخوانم.

**اگر داری این را برای بررسی می‌خوانی:** جاهای جذاب برای سؤال پرسیدن این‌هاست — میانگین وزنی،
اینکه چرا منحنی S در دو سرش قید شده، اینکه چرا دونات فیلتر می‌کند و کاوش نمی‌رود، و اینکه چرا
سینک دستی است.

## 📄 پروانه و داده

کد با پروانهٔ [MIT](LICENSE). دادهٔ نمونه از یک پروژهٔ واقعی مشتق شده و فقط برای نمایش منتشر شده
است — پیش از استفادهٔ مجدد [NOTICE.md](NOTICE.md) را ببینید.

**مهندس حسین مرادی** — مهندس تکنولوژی برق قدرت، کنترل پروژه‌های عمرانی.

</div>
