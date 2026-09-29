# Portfolio text — ready to copy

Everything here is written to be pasted straight into GitHub, a résumé or LinkedIn. It describes
the project in this repository, using its real figures. Swap the links/nothing else.

---

## 1. GitHub "About" (one line, ≤ 350 characters)

> **EN** — Progress-control dashboard for a refinery EPC package: MS Project → weighted itemised
> progress → Power BI + a zero-install offline web dashboard. 226 weighted items, S-curve, SPI,
> critical path, A4 meeting sheet.

> **FA** — داشبورد کنترل پیشرفت یک پکیج EPC پالایشگاهی: از MS Project تا پیشرفت آیتمیک وزنی،
> Power BI و یک داشبورد وب آفلاین بدون نیاز به نصب — ۲۲۶ آیتم وزندار، منحنی S، SPI، مسیر بحرانی
> و برگهٔ چاپ جلسه.

**Topics:** `power-bi` `ms-project` `project-controls` `construction-management` `dax` `tmdl`
`power-query` `powershell` `csharp` `vanilla-js` `progress-tracking` `epc` `evm`

---

## 2. Repository description (the paragraph under the title)

> **EN** — A project-controls toolkit for a refinery EPC package. It reads the schedule out of MS
> Project (PowerShell + COM), projects it to a 17-column CSV and drives two independent front
> ends from that one file: a four-page bilingual Power BI report built on a hand-written TMDL
> model, and a single-file HTML dashboard that opens from a USB stick on a machine with nothing
> installed. Progress is the weighted itemised roll-up the industry actually uses — 226 leaf
> items, 42.1 % actual vs 57.3 % planned (−15.1 pp, SPI 0.74) — validated against MS Project's
> own roll-up to within 0.15 pp. The shipped dataset is anonymised; the tooling is not.

> **FA** — یک جعبه‌ابزار کنترل پروژه برای یک پکیج EPC: خواندن برنامه از MS Project با PowerShell و
> COM، تبدیل به یک CSV هفده‌ستونی، و تغذیهٔ دو نمایش مستقل از همان یک فایل — گزارش چهارتبی
> دوزبانهٔ Power BI روی مدل TMDL دست‌نویس، و یک داشبورد وب تک‌فایلی که از روی فلش روی سیستمی
> بدون هیچ نصب اجرا می‌شود. پیشرفت به‌صورت میانگین وزنی آیتمیک محاسبه می‌شود (۲۲۶ آیتم برگ،
> ۴۲٬۱٪ واقعی در برابر ۵۷٬۳٪ برنامه‌ای، انحراف −۱۵٬۱ واحد درصد، SPI ۰٫۷۴) و با رول‌آپ خود
> MS Project تا کمتر از ۰٬۱۵ واحد درصد صحه‌گذاری شده است. دادهٔ منتشرشده بی‌نام‌شده است، ابزار نه.

---

## 3. Résumé entry

**Persian (for a CV section «پروژه‌ها»)**

> **داشبورد کنترل پیشرفت پروژهٔ EPC — واحدهای بازیابی گاز** · ۲۰۲۶ · Power BI + MS Project +
> PowerShell/C# + JavaScript
> طراحی و ساخت یک سامانهٔ کنترل پیشرفت: خودکارسازی خواندن فایل MS Project، محاسبهٔ پیشرفت
> آیتمیک وزنی (۲۲۶ آیتم، ۱۹ نقطهٔ عطف) و دو نمایش — گزارش Power BI با چهار تب دوزبانه و صفحهٔ وب
> تک‌فایلی بدون نیاز به نصب.
> - بازتولید دقیق رول‌آپ وزنی MS Project در DAX با خطای کمتر از ۰٫۱۵ واحد درصد (۴۲٬۱٪ واقعی /
>   ۵۷٬۳٪ برنامه‌ای / انحراف −۱۵٬۱ واحد درصد) و ساخت شاخص **SPI**، منحنی S، مسیر بحرانی،
>   پنجرهٔ پیش‌نگر و مقایسهٔ دو بازهٔ زمانی روی همان محاسبه.
> - ساخت داشبورد وب **تک‌فایلی و بدون‌وابستگی** (دوزبانه، هفت تم، جدول مجازی‌سازی‌شدهٔ ۲۲۶ ردیفی،
>   برگهٔ چاپ یک‌صفحه‌ای A4 برای جلسه) به‌همراه دو اجرای C# برای سرو محلی و باز کردن گزارش.
> - پرتابل‌سازی کامل برای حمل با فلش: پیدا کردن خودکار فایل برنامه در پوشهٔ افتان، بازنویسی
>   خودکار مسیر مطلق داده در مدل، و بیلد خودآزما با تطبیق بایت‌به‌بایت خروجی.
> - اعتبارسنجی: بازمحاسبهٔ مستقل سرانه‌ها از CSV، اعتبارسنجی ساختار پروژهٔ Power BI و
>   تست نشت داده پیش از انتشار.

**English (for an international CV / GitHub profile)**

> **Construction Progress Dashboard — Refinery EPC** · 2026 · Power BI · MS Project · PowerShell ·
> C# · JavaScript
> Built an end-to-end progress-control system for a refinery EPC package: automated MS Project →
> CSV pipeline, weighted itemised progress, and two front ends (a four-page bilingual Power BI
> report and a zero-install single-file HTML dashboard).
> - Reproduced MS Project's weighted itemised roll-up in DAX to within **0.15 pp**
>   (226 weighted items: **42.1 % actual / 57.3 % planned / −15.1 pp**, SPI 0.74) and built SPI,
>   S-curve, critical-path, look-ahead and period-comparison views on that one calculation.
> - Shipped a **dependency-free single-file web dashboard** (bilingual FA/EN, 7 themes, a
>   virtualised 226-row item table, a one-page A4 meeting sheet) plus two C# launchers that serve
>   it on loopback and open the Power BI report.
> - Made it **USB-portable**: the drop-folder schedule is auto-discovered, the model's absolute
>   data path is rewritten on every launch, and the release build self-verifies with a
>   byte-identical export check.
> - Verification-first workflow: an independent progress recomputation, a Power BI project
>   structure validator and a pre-publication data-leak scan.

**Short two-liner (for a summary line)**

> **EN** — Built and shipped a progress-control dashboard for a refinery EPC package: an automated
> MS Project → Power BI + offline-web pipeline showing weighted itemised progress (226 items)
> within 0.15 pp of MS Project's own roll-up, portable on a USB stick.

> **FA** — ساخت و تحویل داشبورد کنترل پیشرفت یک پکیج EPC پالایشگاهی: زنجیرهٔ خودکار
> MS Project → Power BI و وب آفلاین با پیشرفت آیتمیک وزنی (۲۲۶ آیتم) با تطابق کمتر از ۰٬۱۵ واحد
> درصد با رول‌آپ خود MS Project و قابل حمل روی فلش.

---

## 4. LinkedIn / portfolio paragraph

> **EN** — Most construction dashboards quietly disagree with the schedule they claim to summarise.
> I built one that does not: it reads the MS Project file directly, reproduces the **weighted
> itemised** progress the industry actually uses (226 items, 42.1 % actual against 57.3 % planned),
> and shows the same number three ways — in Power BI, on a single-file offline page that runs from
> a USB stick with nothing installed, and in an independent script anyone can run to check it.
> Along the way: MS Project COM automation that survives a grumpy API, a hand-written Power BI
> project (TMDL + PBIR), two C# launchers compiled with no SDK, and a build that verifies itself.
> The shipped data is anonymised; the engineering is the point.

> **FA** — بیشتر داشبوردهای پروژه‌ای بی‌سروصدا با همان برنامه‌ای که ادعا می‌کنند خلاصه‌اش می‌کنند
> اختلاف دارند. من یکی ساختم که ندارد: فایل MS Project را مستقیم می‌خواند، همان **میانگین وزنی
> آیتمیک** را که در این صنعت مرجع است بازتولید می‌کند (۲۲۶ آیتم، ۴۲٬۱٪ واقعی در برابر ۵۷٬۳٪
> برنامه‌ای) و همان یک عدد را سه‌جا نشان می‌دهد — در Power BI، روی یک صفحهٔ وب تک‌فایلی که از
> فلش روی سیستمی بدون هیچ نصب اجرا می‌شود، و در یک اسکریپت مستقل که هر کسی می‌تواند اجرا کند.
> مسیر کار: اتوماسیون COM روی MS Project، پروژهٔ Power BI دست‌نویس (TMDL + PBIR)، دو اجرای C#
> بدون نیاز به SDK، و یک بیلد که خودش را صحه‌گذاری می‌کند.

---

## 5. Interview prep — the six questions this project invites

| Question | Your answer in one line |
|---|---|
| Why weighted progress instead of the average of task percentages? | A 0.14 %-weight item must not outvote a 6 %-weight one; MS Project already rolls up weight × % and the dashboard has to say the same thing. |
| How do you know your numbers are right? | `tools/verify-progress.mjs` recomputes them from the raw CSV, independently of DAX and of the page, and the result matches MS Project's summary within 0.15 pp. |
| What does the SPI you show actually tell me? | Schedule performance only: work done over work that should be done by the status date. Above 1 is ahead. There is no cost data in the export, so there is deliberately no CPI. |
| Why is the sync manual? | The user read a scheduled sync as "something is running on my machine" and stopped trusting the numbers. Trust was worth more than the automation. |
| Why two front ends for one dataset? | Power BI is the report pack; the site engineers need something that opens on a borrowed laptop with nothing installed. |
| What was hardest? | Keeping a *hand-written* Power BI project (TMDL/PBIR) honest: its failures are silent, so the project needed its own validator before it needed features. |

**Two things to say honestly, before you are asked:**

1. **"The code was written in AI-assisted sessions under my direction."** Then say what you *did*
   own: the requirements, the domain maths and its validation against MS Project, the test runs on
   Windows across all three launch paths, and the decision to keep a verifier you can read
   yourself. That is a modern, defensible story — and it is checkable, because `docs/` and `tools/`
   exist precisely so a reviewer can audit the reasoning.
2. **"I published it with the data anonymised."** You can explain exactly how (name replacement,
   a fixed calendar shift, sequential ids, a leak scan that also reads the compiled binaries) — that
   answer demonstrates judgement, not just coding.

**What not to claim:** that it is a multi-user or web-hosted product (it is single-machine), that
it does earned-value *cost* management (there is no cost data), or that it replaces primavera-scale
scheduling. Reviewers who work in this field will ask exactly those questions.

---

## 6. Figures cheat-sheet

| Figure | Value | Where it comes from |
|---|---|---|
| Exported rows / leaf items / milestones | 245 / 226 / 19 (8 complete) | `data/tasks.csv` |
| Weighted actual / planned / variance | 42.1 % / 57.3 % / −15.1 pp | the same formula in DAX, in the page and in `tools/verify-progress.mjs` |
| SPI | 0.74 | actual ÷ planned |
| Critical items | 14 | `Critical = True` on leaf items |
| Agreement with MS Project | < 0.15 pp | validated against the schedule's own summary rows |
| Power BI report | 4 pages (FA + EN), 28 visuals, 10 DAX measures | `Refinery8-FGR.Report/`, `…SemanticModel/` |
| Offline page | 1 file, 4,090 lines, no dependency, 7 themes | `preview/index.html` |
| Launchers | 2 `.exe`, 18 KB + 16.5 KB, from 931 lines of C# | `Scripts/*.cs` + `build-launchers.ps1` |
| Export step | ~7 s for a 245-row schedule, no window | `Scripts/export-msp-data.ps1` |

---

## 7. LinkedIn — paste-ready fields

LinkedIn has no connector here and no public API for profile sections, so this part is manual.
Copy from below.

### 7.1 Profile → **Projects** → *Add project*

| Field | Value |
|---|---|
| **Project name** | Construction Progress Dashboard — Refinery EPC (MS Project → Power BI + offline web) |
| **Associated with** | your employer (or leave blank) |
| **Start date / End date** | your real dates; tick *“I am currently working on this project”* while it is live |
| **Project URL** | the GitHub repository URL |

**Description** (paste, then adjust the first line to your role):

> Design and build of a progress-control system for a refinery EPC package: the schedule is
> read out of MS Project, converted into a single CSV, and displayed in two independent front
> ends — a four-page bilingual Power BI report and a single-file web dashboard that runs from a
> USB stick on a machine with nothing installed. Progress is the weighted itemised roll-up used
> in construction (226 leaf items, 19 milestones): 42.1 % actual against 57.3 % planned,
> −15.1 pp variance, SPI 0.74, validated against MS Project's own roll-up to within 0.15 pp. The
> system also produces the period-comparison and look-ahead views used in the weekly meeting and
> a one-page A4 sheet for the meeting pack. Verification tooling (an independent progress
> recomputation, a Power BI project validator and a pre-publication data-leak scan) ships with
> it; the published data is anonymised.

> **Skills to attach:** Project Planning · Project Control · Microsoft Project · Power BI ·
> Earned Value Management · Critical Path Method · Construction Management · Progress
> Measurement · Reporting & Dashboards · Data Analysis · Automation

### 7.2 Post draft (short, specific, no adjectives)

> **EN** — Most progress dashboards drift away from the schedule they summarise. I built one that
> does not: it reads the MS Project file directly and reproduces the **weighted itemised**
> progress construction actually uses — 226 items, 42.1 % actual against 57.3 % planned
> (−15.1 pp, SPI 0.74) — and shows the same number in Power BI, in a single-file page that runs
> from a USB stick with nothing installed, and in a script anyone can run to check it.
> Automating MS Project through its COM interface, a hand-written Power BI project (TMDL/PBIR),
> two C# launchers compiled without an SDK, and a build that verifies itself. The data is
> anonymised; the engineering is real. → <repo link>
> #ProjectControls #Planning #ProjectManagement #PowerBI #MSProject #EarnedValueManagement

> **FA** — بیشتر داشبوردهای پیشرفت بی‌سروصدا از همان برنامه‌ای که ادعا می‌کنند خلاصه‌اش می‌کنند
> فاصله می‌گیرند. من یکی ساختم که فاصله نمی‌گیرد: فایل MS Project را مستقیم می‌خواند و همان
> **میانگین وزنی آیتمیک** را که در کنترل پروژهٔ عمرانی مرجع است بازتولید می‌کند (۲۲۶ آیتم،
> ۴۲٬۱٪ واقعی در برابر ۵۷٬۳٪ برنامه‌ای، انحراف −۱۵٬۱ واحد درصد، SPI ۰٫۷۴) و همان یک عدد را
> در Power BI، در یک صفحهٔ وب تک‌فایلی که از فلش روی سیستم بدون نصب اجرا می‌شود، و در یک
> اسکریپت مستقل که هر کسی می‌تواند اجرا کند نشان می‌دهد.
> → <لینک مخزن>
> #کنترل_پروژه #برنامه_ریزی #پاور_بی_آی #ام_اس_پروژه #مدیریت_پروژه

### 7.3 Featured / «نمایش برجسته»

Add the repository link as a *Link* and the offline-dashboard screenshot as a *Media* item — the
capture is what people actually look at. Keep the same two in your GitHub profile README
(`<username>/<username>` repository) so the profile and LinkedIn tell one story.

### 7.4 Keep it credible in a hiring conversation

- Quote the numbers, never adjectives: 226 items, 19 milestones, 42.1 / 57.3 / −15.1 pp, SPI
  0.74, agreement within 0.15 pp.
- Say plainly which tool is missing, because a planner will ask: this is **MS Project + Power
  BI**, not Primavera P6, and there is **no cost data**, so there is no CPI, no EAC and no
  earned-value *cost* curve. Naming the boundary yourself is what makes the rest believable.
- Say plainly that the code was written AI-assisted under your direction, and then describe what
  you personally did: the requirements, the progress-measurement method, validation against MS
  Project, and the Windows test runs. See the honesty notes in §5.
