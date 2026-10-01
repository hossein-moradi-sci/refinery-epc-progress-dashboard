# داشبورد پرتابل پروژه the EPC dashboard

**Portable Project — Gas Recovery Units EPC Progress Dashboard**

این پوشه یک نسخهٔ **کاملاً پرتابل** از داشبورد پیشرفت پروژه است. هر جا آن را کپی کنید
(فلش، هارد اکسترنال، دسکتاپ هر سیستم دیگری) کار می‌کند و هیچ مسیر ثابتی در آن تعریف نشده است.

---

## فهرست مطالب فارسی

1. [پیش‌نیازها](#۱-پیشنیازها)
2. [شروع سریع](#۲-شروع-سریع)
3. [دو فایل اجرایی](#۳-دو-فایل-اجرایی)
4. [کار روزمره: فایل جدید از مهندس‌ها می‌رسد](#۴-کار-روزمره-فایل-جدید-از-مهندسها-میرسد)
5. [محتوای پوشه](#۵-محتوای-پوشه)
6. [توضیح دقیق‌تر: پاور بی آی](#۶-پاور-بی-آی)
7. [توضیح دقیق‌تر: صفحهٔ آفلاین HTML](#۷-صفحهٔ-آفلاین-html)
8. [اگر مشکلی پیش آمد](#۸-اگر-مشکلی-پیش-آمد)
9. [نکات مهم](#۹-نکات-مهم)

---

## ۱) پیش‌نیازها

| لازم برای | چه چیزی باید روی سیستم باشد |
|---|---|
| دیدن صفحهٔ داشبورد | **هیچ چیز** — فقط ویندوز (برنامهٔ اجرایی HTML خودش کامل است) |
| دیدن گزارش پاور بی آی | **Power BI Desktop** |
| به‌روزرسانی داده از فایل ام‌اس پراجکت | **Microsoft Project** و **PowerShell** (روی همهٔ ویندوزها هست) |

> اگر ام‌اس پراجکت نصب نباشد، داشبورد با **آخرین داده‌ای که قبلاً سینک شده** باز می‌شود و
> یک پیام هشدار می‌دهد. دیدن گزارش در این حالت هم مشکلی ندارد.

**فونت:** برای نمایش درست متن‌های فارسی، فونت **Shabnam FD** روی سیستم نصب باشد بهتر است.
اگر نباشد، ویندوز فونت جانشین می‌گذارد و متن‌ها خوانا می‌مانند.

---

## ۲) شروع سریع

```
۱. فایل ام‌اس پراجکت را در پوشهٔ  Project-File  بگذارید (جایگزین فایل قبلی).
۲. یکی از این دو فایل را دوبار کلیک کنید:
      Launch Offline Dashboard.exe     →  دیدن سریع در مرورگر (بدون نیاز به پاور بی آی)
      Launch Power BI Report.exe       →  باز شدن گزارش کامل در پاور بی آی
۳. تمام. در گزارش پاور بی آی داده همان لحظه سینک می‌شود؛ در صفحهٔ آفلاین
   دکمهٔ «به‌روزرسانی از MS Project» را بزنید (پایین‌تر توضیح داده شده).
```

هیچ تنظیمی لازم نیست. هیچ پنجرهٔ خط فرمانی هم باز نمی‌شود.

---

## ۳) دو فایل اجرایی

### `Launch Offline Dashboard.exe` — صفحهٔ آفلاین

- داشبورد را به‌صورت یک صفحهٔ وب روی کامپیوتر خودتان (`127.0.0.1`) باز می‌کند.
- **بدون اینترنت کار می‌کند** و **به پاور بی آی هم نیازی ندارد**.
- داخل صفحه یک دکمهٔ **«به‌روزرسانی از MS Project»** هست که داده را از فایل ام‌اس پراجکت
  می‌خواند و صفحه را تازه می‌کند. **هیچ به‌روزرسانیِ خودکاری وجود ندارد**: هیچ اسکریپتی در
  پس‌زمینه اجرا نمی‌شود، هیچ عددی خودش عوض نمی‌شود و صفحه هیچ‌وقت سرِخود داده را دوباره
  نمی‌خواند. عددها فقط وقتی عوض می‌شوند که خودتان این دکمه را بزنید.
- تنها کار پس‌زمینهٔ صفحه یک **«ضربان» کوچک برای زنده‌نگه‌داشتن برنامه** است: حداکثر
  یک‌بار در هر دقیقه یک پیام خیلی کوتاه («من هنوز بازم») به برنامهٔ محلی می‌رود. این پیام
  هیچ داده‌ای جابه‌جا نمی‌کند و چیزی روی دیسک نمی‌نویسد؛ فقط باعث می‌شود برنامه بفهمد
  صفحه باز است و زودتر از موعد خاموش نشود تا دکمهٔ به‌روزرسانی و کلید **F5** از کار نیفتد.
- وقتی همهٔ پنجره‌های مرورگر بسته شد (یعنی این ضربان‌ها قطع شد)، برنامهٔ محلی خودش بعد از
  حدود **۳ دقیقه** خاموش می‌شود. اگر بعد از آن دکمهٔ به‌روزرسانی پیام **«برنامهٔ محلی بسته
  شده»** داد، کافی است `Launch Offline Dashboard.exe` را دوباره اجرا کنید و صفحه را تازه کنید.

### `Launch Power BI Report.exe` — گزارش پاور بی آی

این فایل به‌ترتیب سه کار می‌کند:

1. **مسیر داده را برای همین پوشه درست می‌کند** (پاور بی آی مسیر را ثابت ذخیره می‌کند؛
   این برنامه در هر بار اجرا مسیر را با محل فعلی پوشه هماهنگ می‌کند تا بعد از جابه‌جا کردن پوشه هم کار کند).
2. **داده را از فایل ام‌اس پراجکت موجود در `Project-File` سینک می‌کند** (پنجره‌ای باز نمی‌شود).
3. **گزارش `Refinery8-FGR.pbip` را در پاور بی آی باز می‌کند.**

اگر پاور بی آی نصب نباشد، پیام می‌دهد که چطور نصبش کنید یا مسیرش را دستی بدهید
(پایین‌تر توضیح داده شده).

---

## ۴) کار روزمره: فایل جدید از مهندس‌ها می‌رسد

پوشهٔ **`Project-File`** جایی است که فایل ام‌اس پراجکت می‌نشیند:

> **فایل جدید را داخل پوشهٔ `Project-File` کپی کنید و فایل قبلی را پاک کنید (یا جایگزینش کنید).**
> نام فایل مهم نیست — هر فایل `.mpp` که آنجا باشد پیدا و خوانده می‌شود.
> اگر چند فایل `.mpp` آنجا باشد، **جدیدترین** (بر اساس تاریخ تغییر فایل) خوانده می‌شود.

بعد از گذاشتن فایل جدید:

- برای **صفحهٔ آفلاین**: `Launch Offline Dashboard.exe` را بزنید و داخل صفحه دکمهٔ
  **«به‌روزرسانی از MS Project»** را بزنید. (اگر صفحه از قبل باز است، همین یک دکمه کافی است.)
- برای **پاور بی آی**: `Launch Power BI Report.exe` را بزنید. داده سینک می‌شود و گزارش باز می‌شود.
  اگر پاور بی آی **از قبل باز** است، در خود پاور بی آی دکمهٔ **Refresh** را بزنید.

---

## ۵) محتوای پوشه

```
portable project\
├─ README.md                        ← همین فایل (فارسی + انگلیسی)
├─ Launch Offline Dashboard.exe     ← اجرای صفحهٔ آفلاین HTML
├─ Launch Power BI Report.exe       ← اجرای گزارش پاور بی آی
├─ Project-File\                    ← ★ فایل ام‌اس پراجکت را اینجا بگذارید ★
│   └─ Refinery8-FGR-Project.mpp
└─ Refinery8-FGR-Dashboard\         ← خود داشبورد (به این پوشه دست نزنید)
    ├─ Refinery8-FGR.pbip           ← فایل گزارش پاور بی آی
    ├─ Refinery8-FGR.Report\        ← صفحات و ویژوال‌های گزارش (فارسی و انگلیسی)
    ├─ Refinery8-FGR.SemanticModel\ ← مدل داده و فرمول‌های DAX
    ├─ data\                        ← خروجی CSV از ام‌اس پراجکت (سینک‌شده)
    ├─ preview\index.html           ← صفحهٔ داشبورد HTML
    ├─ Scripts\                     ← اسکریپت‌های سینک و ساخت برنامه‌ها
    └─ logs\                        ← گزارش‌های اجرا (برای عیب‌یابی)
```

> ⚠️ نام پوشه‌ها و فایل‌های اجرایی را **تغییر ندهید** و ساختار پوشه‌ها به‌هم نزنید.
> برنامه‌ها مسیر خودشان را از روی محل قرار گرفتن فایل اجرایی پیدا می‌کنند.

---

## ۶) پاور بی آی

**چهار تب دارد:**

| تب | زبان | محتوا |
|---|---|---|
| **داشبورد** | فارسی | شاخص‌های اصلی، نمودار فازها، وضعیت نقاط عطف |
| **جزئیات** | فارسی | جدول کامل اقلام، جدول نقاط عطف، فیلترها |
| **Dashboard** | انگلیسی | همان صفحهٔ داشبورد به انگلیسی |
| **Item Details** | انگلیسی | همان صفحهٔ جزئیات به انگلیسی |

**شاخص‌های اصلی که محاسبه می‌شوند:**

- **پیشرفت واقعی آیتمیک** = Σ(وزن × درصد واقعی) ÷ Σ وزن‌ها
- **پیشرفت برنامه‌ای آیتمیک** = Σ(وزن × درصد برنامه‌ای) ÷ Σ وزن‌ها
- **انحراف** = واقعی − برنامه‌ای

وضعیت فعلی (تاریخ وضعیت ۱۴۰۴/۰۴/۰۹ میلادی 2025-06-30):

| شاخص | مقدار |
|---|---|
| پیشرفت واقعی آیتمیک | **۴۲٫۱٪** |
| پیشرفت برنامه‌ای آیتمیک | **۵۷٫۳٪** |
| انحراف | **−۱۵٫۱ واحد درصد** |
| اقلام (آیتم‌های برگ) | **۲۲۶** |
| نقاط عطف | **۱۹** (۸ تکمیل‌شده) |

ستون **`(%W.F)`** در جدول، همان **ضریب وزن** (Weight Factor) هر آیتم است که از فایل
ام‌اس پراجکت می‌آید. ستون‌های «واقعی» و «برنامه‌ای» به‌صورت وزنی از همین ضریب‌ها حساب می‌شوند.

### اگر پاور بی آی روی سیستم دیگری نصب است

برنامه مسیر پاور بی آی را خودش در این جاها پیدا می‌کند: رجیستری ویندوز، پوشه‌های
`Program Files` و `Program Files (x86)` روی همهٔ درایوها، و نسخهٔ فروشگاه مایکروسافت.

اگر پیدا نکرد و پاور بی آی در جای عجیبی نصب بود، یک فایل متنی به نام `powerbi-path.txt`
کنار فایل‌های اجرایی بسازید و مسیر کامل برنامه را در آن بنویسید. مثلاً:

```
D:\Program Files (x86)\powerbi2\bin\PBIDesktop.exe
```

---

## ۷) صفحهٔ آفلاین HTML

- **راهنمای شناور «؟»:** گوشهٔ پایین صفحه یک دکمهٔ گرد **؟** هست. با کلیک روی آن (یا کلید **؟/H**)
  یک راهنمای کوتاه باز می‌شود که در چند سطر توضیح می‌دهد: دریل‌دان کلی و دریل‌دان تکیِ هر نمودار، منوی
  **«نمودارها»**، نوار و کشوی **فیلترها**، مقایسهٔ دو بازهٔ زمانی، پریویو، SPI و نوار وضعیت،
  رنگ‌های وضعیت، مسیر بحرانی، جدول و برگهٔ چاپ، زبان/تم/صدا و فهرست **کلیدهای میانبر**.
  تا اولین باری که بازش کنید یک حلقهٔ نبض‌دار و برچسب «راهنما» کنارش دیده می‌شود؛ با **Esc**
  یا کلیک بیرون بسته می‌شود و در چاپ/PDF نمی‌آید.
- **صفحهٔ خوشامد:** با هر بار باز شدن صفحه، یک کارت کوتاه (حدود ۳ ثانیه) با انیمیشن و یک صدای
  کوتاه می‌آید و «ساخته‌شده توسط **مهندس حسین مرادی**» را نشان می‌دهد، بعد محو می‌شود. با یک
  کلیک، هر کلید یا **Esc** زودتر رد می‌شود. (اگر مرورگر هنوز اجازهٔ پخش صدا نداده باشد، همان صدا
  با اولین کلیک شما پخش می‌شود.)
- **نوار نکته‌ها (ته صفحه):** به‌جای یک خط توضیح ثابت، نوارِ متحرکی مثل نوارهای زیرنویس خبری
  پایین صفحه است و هر بار چند **نکتهٔ تصادفی** دربارهٔ همین داشبورد را نشان می‌دهد. **هر سه نکته
  یک‌بار**، به‌جای جداکنندهٔ الماسی، برچسب نورانیِ «سازنده: مهندس حسین مرادی» لابه‌لای نکته‌ها
  می‌آید. با نگه داشتن نشانگر روی آن می‌ایستد، با فلش کنارش جمع می‌شود و در چاپ/PDF نمی‌آید.
- **۷ تم رنگی** (شبانه، اقیانوس، بنفش شبانه، نئون، غروب، روشن، کاغذی). با کلید **T** هم عوض می‌شود.
- **دو زبان** فارسی و انگلیسی با سوییچ **FA / EN** بالای صفحه. (انتخاب زبان و تم ذخیره می‌شود.)
- **موسیقی محیط آرام** و **صداهای کلیک** — با کلیک روی علامت بلندگو یک پنل باز می‌شود که
  هر کدام کلید جدا دارند. با کلید **M** هم موسیقی محیط روشن/خاموش می‌شود.
- **پس‌زمینهٔ زنده** با نورهای آرام و ذرات ریز؛ شدتش پایین است تا خوانایی اعداد حفظ شود.
- داده را از پوشهٔ `Refinery8-FGR-Dashboard\data` می‌خواند — یعنی همان فایل‌هایی که
  ام‌اس پراجکت در آن‌ها سینک شده است.
- **نوار فیلتر + کشویی تاشو (شبیه پاور بی آی):** یک نوار باریک همیشه بالای صفحه است: دکمهٔ
  **«فیلترها»**، برچسب فیلترهای فعال و «پاک کردن». با زدن دکمه، کشویی از بالا به پایین باز
  می‌شود که فیلترها را در **سه زبانهٔ دسته‌بندی‌شده** دارد؛ هر فیلتر روی همهٔ کارت‌ها، نمودارها
  و جدول اثر می‌گذارد:
  - **پایه:** فاز، دیسیپلین، وضعیت پیشرفت و جستجوی نام/WBS.
  - **عددی:** فیلد (وزن، پیشرفت واقعی، پیشرفت برنامه‌ای، انحراف، تکمیل فیزیکی) + شرط
    (بزرگ‌تر از، کوچک‌تر از، بزرگ‌تر/کوچک‌تر یا مساوی، برابر، نامساوی، بین دو عدد). عدد را
    بدون % بنویسید — مثلاً «بزرگ‌تر از 5» یعنی وزن بیشتر از ۵٪.
  - **زمانی:** بازهٔ تاریخ پایان، **بازهٔ تاریخ نسبی** (آخرین / بعدی / این + تعداد +
    روز/هفته/ماه/سال — مبنای محاسبه، تاریخ وضعیت پروژه است) و **Top N** (مثلاً ۱۰ مورد برتر
    بر اساس وزن یا انحراف).
  هر شرط به‌صورت یک برچسب روی نوار فیلتر می‌نشیند و با ✕ جدا می‌شود؛ هنگام اسکرول هم نوار به
  بالای صفحه می‌چسبد تا فیلترها همیشه در دسترس باشند.
- **نمودارهای قابل انتخاب:** موس را روی دکمهٔ **«نمودارها»** ببرید — دکمه در نوار مخصوص خودش،
  بالای شبکهٔ نمودارها و جدا از نوار فیلترهاست — منو
  با انیمیشن (ورود پله‌ای گزینه‌ها و حرکت کلیدهای روشن/خاموش) باز می‌شود و انتخاب می‌کنید کدام
  نمودارها دیده شوند: **گیج پیشرفت**، **نمودار S**، **فازها**، **انحراف** و **نقاط عطف**.
  پیش‌فرض **فقط نمودار دایره‌ای (نقاط عطف)** است تا صفحه سبک باز شود؛ بقیه را خودتان روشن
  می‌کنید. هنگام روشن/خاموش کردن، کارت‌ها با انیمیشن وارد صفحه می‌شوند، تعداد نمودارهای روشن
  روی خود دکمه نشان داده می‌شود و انتخاب‌ها ذخیره می‌شود.
- **انیمیشن‌های حرفه‌ای صفحه:** کارت‌ها با محو شدن ملایم و بالا آمدن وارد می‌شوند و با حرکت موس
  روی هر کارت، یک نور نقطه‌ای آرام دنبال نشانگر حرکت می‌کند و لبهٔ کارت کمی بالا می‌آید. نوار
  نازک بالای صفحه میزان اسکرول را نشان می‌دهد. بخش جدول که پایین صفحه است با اسکرول آرام ظاهر
  می‌شود و ردیف‌ها یکی‌یکی پایین می‌آیند (ولی موقع تایپ در جستجو، انیمیشن‌ها دوباره پخش نمی‌شوند
  تا کار کند نشود). در نمودار S، دو خط تجمعی «کشیده می‌شوند»، دونات با یک چرخش کوچک می‌نشیند،
  عقربه گیج و اعداد با حرکت نرم جا می‌افتند و با عوض کردن تم، کل رنگ‌بندی یک‌جا محو می‌شود.
  اگر ویندوز شما «کاهش حرکت» (Reduced motion) را روشن کرده باشد، این انیمیشن‌ها خودکار خاموش
  می‌شوند.
- **دریل‌دان (Drill down / Drill up) — کلی و تکی:** مسیر **کلی** بالای صفحه است (کل پروژه → فاز →
  دیسیپلین → آیتم‌ها) و روی همهٔ نمودارها با هم اثر می‌گذارد: کلیک روی ستون، سطر جدول یا
  دکمه‌های دریل‌دانِ نوار بالا، کل صفحه را یک سطح پایین/بالا می‌برد (کلید **D** هم یک سطح بالا
  می‌برد). علاوه بر آن **هر نمودار دکمه‌های دریل‌دان مخصوص خودش** را دارد (بالا/پایین + فهرست
  زیرسطح‌ها)؛ دریلِ تکی فقط همان نمودار را عوض می‌کند و بقیه دست‌نخورده می‌مانند — کارتِ
  دریل‌شده هاله می‌گیرد، عنوانش دکمهٔ خروج می‌شود و دکمهٔ نشانه‌گرفته (⊙) آن را با مسیر کلی
  هماهنگ می‌کند. دکمهٔ «دریل‌دان» هر نمودار هم نام زیرسطح را نشان می‌دهد (دریل‌دان: فازها → دیسیپلین‌ها
  → آیتم‌ها).
- **مقایسهٔ دو بازهٔ زمانی:** کنار دکمهٔ «نمودارها» دکمهٔ **«مقایسهٔ بازه‌ها»** است. با روشن
  کردنش، دو نقطه روی نمودار S علامت می‌خورند: **A** (حلقهٔ توخالی = مبنا) و **B** (نقطهٔ توپر =
  تاریخ وضعیت)؛ فاصلهٔ بین آن‌ها سایه می‌گیرد و یک خط‌چین از A بالا می‌رود تا پیدا باشد. بازهٔ
  مقایسه را از پیش‌فرض‌ها انتخاب کنید — **پایان ماه قبل ← اکنون**، **هفتهٔ قبل ← اکنون**، **۳۰ روز
  قبل ← اکنون** — یا **دو تاریخ دلخواه**. در همان پنل و روی کارت‌های KPI، مقدار تغییر
  (مثلاً ‎+۰٫۶pp) نوشته می‌شود: Δواقعی، Δبرنامه‌ای و Δانحراف (بازهٔ انحراف باریک‌تر یا پهن‌تر شده).
  اگر تاریخ B قبل از A باشد پیام هشدار می‌دهد و چیزی حساب نمی‌شود. این مقایسه با فیلترها و
  دریل‌دان هم کار می‌کند: روی همان بخشی که در حال دیدنش هستید حساب می‌شود (و در دریل‌دانِ تکی هر نمودار،
  برای همان نمودارِ دریل‌شده).
- **خروجی PDF / چاپ برای جلسه:** دکمهٔ **«خروجی PDF / چاپ»** در نوار بالا (یا کلید **P**، یا Ctrl+P)
  یک **برگهٔ تمیز و دقیقاً یک‌صفحه‌ای A4** می‌سازد: عنوان پروژه، تاریخ وضعیت، دامنهٔ فعلی و
  فیلترهای فعال، چهار کارت شاخص اصلی، **نمودار S**، و **سنگین‌ترین آیتم‌های همان دامنه** به‌همراه
  نوار و درصد واقعی/برنامه‌ای. هرچند ردیف که کامل در صفحه جا شود می‌آید و در پایین برگه تعداد
  نوشته می‌شود (مثلاً «۱۸ / ۲۲۶ آیتم — فهرست کامل در داشبورد»)؛ بقیهٔ آیتم‌ها در خود داشبورد
  می‌مانند. رنگ‌های برگه روشن و کم‌مصرف است، حتی اگر داشبورد روی تم شبانه باشد، و اگر حالت
  مقایسهٔ بازه‌ها روشن باشد همان بازه و دلتاهایش روی برگه می‌آیند.
- **نمودار S:** پیشرفت تجمعی برنامه‌ای در برابر واقعی روی محور زمان، با خط «تاریخ وضعیت».
  مقدار نمودار در تاریخ وضعیت دقیقاً همان عدد کارت‌ها است (برنامه‌ای ۵۷٫۳٪ / واقعی ۴۲٫۱٪) و در
  پایان پروژه به ۱۰۰٪ می‌رسد. با حرکت موس روی نمودار، مقدار هر تاریخ دیده می‌شود.
- **گیج پیشرفت:** کمان سبز پررنگ = پیشرفت واقعی و یک **خط نازک آبی و کاملاً واضح** که **کنار**
  همان کمان (نه رویش) حرکت می‌کند = پیشرفت برنامه‌ای (هدف)؛ عقربه روی واقعی است و کنار گیج،
  انحراف، تعداد نقاط عطف و تعداد آیتم‌ها نوشته می‌شود. رنگ این خط همان رنگ برنامه‌ای تم است؛
  مثل همهٔ نمودارهای دیگر با عوض کردن تم، رنگش همراه بقیه عوض می‌شود.
- **سلامت زمان‌بندی در یک نگاه:** زیر کارت‌های شاخص، یک **نوار وضعیت رنگی** آمده است که سهم هر
  چهار وضعیت (تکمیل‌شده/در حال انجام/دارای تأخیر/آینده) را در همان دامنه‌ای که می‌بینید نشان
  می‌دهد؛ با نگه داشتن موس روی هر رنگ، تعداد و درصدش را می‌بینید و با کلیک روی آن، صفحه به همان
  وضعیت فیلتر می‌شود. کنارش **پریویو** است: با انتخاب ۷/۱۴/۳۰ روز، کارهای همین دامنه که در آن
  پنجره تمام می‌شوند شمرده می‌شوند (و دکمهٔ «فقط همین‌ها» همان‌ها را روی کل صفحه فیلتر می‌کند).
  روی کارت انحراف هم چیپ **SPI** نشسته — نسبت پیشرفت واقعی به برنامه‌ای؛ بالای ۱ یعنی جلوتر از
  برنامه. این عدد فقط زمان‌بندی است (دادهٔ هزینه در فایل نیست)، و همان وزن‌دهی کارت‌ها را دارد.
- **مسیر بحرانی:** از همگام‌سازی بعدی، ستون «بحرانی» از MS Project می‌آید: کنار راهنمای جدول یک
  کلید **«مسیر بحرانی»** ظاهر می‌شود که فقط کارهای بحرانی را نگه می‌دارد، و در لیست آیتم‌ها هر
  ردیف بحرانی یک تیک قرمز کوچک در لبهٔ نام می‌گیرد (تا آن زمان این کلید پنهان است — فایل فعلی
  هنوز ستون را ندارد).
- **لیست آیتم‌ها در پایین صفحه:** مثل قبل **کل آیتم‌ها** (به ترتیب وزن) لیست می‌شوند، ولی حالا
  **دو نوار پیشرفت (سبز = واقعی، آبی = برنامه‌ای) بلافاصله جلوی نام آیتم** می‌آیند و درصد هر
  نوار **با رنگ خودش** کنارش نوشته می‌شود؛ نوارها کمی بزرگ‌تر شده‌اند و ستون‌های اطلاعاتی مثل
  **(%W.F)** هم درست کنارشان قرار می‌گیرند. زیرنویس دیسیپلین/فاز هر آیتم حفظ شده و بالای جدول
  هم راهنمای رنگ‌ها (واقعی/برنامه‌ای) آمده است. با فیلترها و دریل‌دان، این لیست محدود می‌شود
  (مثلاً فقط آیتم‌های همان فاز) و تعداد در بالای جدول و پایین آن نوشته می‌شود.
  این جدول **مجازی (virtualized)** است: فقط همان چند ردیفی که می‌بینید ساخته می‌شوند و اسکرول
  و فیلتر کردن حتی با ۲۲۶ آیتم هم روان می‌ماند. نام‌های خیلی بلند در دو خط کوتاه می‌شوند؛
  برای دیدن نام کامل، موس را روی همان نام نگه دارید. اگر صفحه را پرینت بگیرید (Ctrl+P)،
  **همهٔ ردیف‌ها** در نسخهٔ کاغذی می‌آیند.

> صفحه باید از طریق برنامهٔ اجرایی باز شود. اگر فایل `preview\index.html` را مستقیم
> دوبار کلیک کنید، مرورگر به‌خاطر محدودیت امنیتی نمی‌تواند فایل‌های داده را بخواند.

---

## ۸) اگر مشکلی پیش آمد

**همهٔ گزارش‌ها اینجا هستند:**

| فایل | مربوط به |
|---|---|
| `Refinery8-FGR-Dashboard\logs\export-msp-data.log` | سینک داده از ام‌اس پراجکت |
| `Refinery8-FGR-Dashboard\logs\powerbi-launcher.log` | اجرای گزارش پاور بی آی |
| `Refinery8-FGR-Dashboard\logs\dashboard-exe.log` | اجرای صفحهٔ آفلاین |

**رایج‌ترین حالت‌ها:**

| نشانه | علت و راه‌حل |
|---|---|
| پیام «No .mpp file found» | فایل ام‌اس پراجکت داخل پوشهٔ `Project-File` نیست. فایل را آنجا بگذارید. |
| پیام «Data sync did not succeed» | ام‌اس پراجکت نصب نیست، یا با دسترسی Administrator باز است. ام‌اس پراجکت را ببندید و دوباره امتحان کنید. |
| پاور بی آی باز می‌شود ولی داده قدیمی است | پاور بی آی را ببندید و از طریق `Launch Power BI Report.exe` دوباره باز کنید (یا داخل پاور بی آی **Refresh** بزنید). |
| پاور بی آی پیام خطا می‌دهد | مطمئن شوید همهٔ فایل‌ها با هم کپی شده‌اند (کل پوشه، نه بخشی از آن). |
| صفحهٔ HTML باز نمی‌شود | اگر پورت `8642` اشغال باشد، برنامه خودش پورت بعدی را انتخاب می‌کند؛ آدرس پیش‌فرض همان `http://127.0.0.1:8642` است. |
| دکمهٔ «به‌روزرسانی از MS Project» پیام «برنامهٔ محلی بسته شده» می‌دهد | برنامهٔ محلی بعد از مدت طولانی بی‌استفادگی خودش بسته شده است. `Launch Offline Dashboard.exe` را دوباره اجرا کنید و صفحه را تازه کنید. |

**تست سریع سلامت داده:** داخل پاور بی آی باید این اعداد را ببینید:
**۴۲٫۱٪** پیشرفت واقعی، **۵۷٫۳٪** پیشرفت برنامه‌ای، **−۱۵٫۱** انحراف.

---

## ۹) نکات مهم

- **هیچ چیزی خودکار و زمان‌بندی‌شده اجرا نمی‌شود** — هیچ Task و هیچ پنجره‌ای خودش ظاهر نمی‌شود.
  همه‌چیز با همان دو فایل اجرایی و به‌صورت دستی است. تنها استثنا همان **ضربانِ زنده‌نگه‌داشتنِ
  برنامه** در صفحهٔ آفلاین است (حداکثر یک‌بار در دقیقه، بدون هیچ داده‌ای).
- **پاور بی آی فقط CSV روی دیسک را می‌خواند**، نه خود فایل ام‌اس پراجکت.
  پس ترتیب همیشه این است: **اول سینک، بعد نمایش.**
- این پوشه را می‌توانید روی فلش بگذارید و روی سیستم دیگری باز کنید. فقط دو نکته:
  ۱. آن سیستم باید پاور بی آی (برای گزارش) و ام‌اس پراجکت (برای سینک) داشته باشد،
  ۲. فایل‌ها را با نام و ساختار درست کپی کنید.
- پوشهٔ `logs` و پوشهٔ `data` با هر سینک به‌روز می‌شوند؛ پاک کردنشان مشکلی ایجاد نمی‌کند.
- **`data\*.csv` و فایل ام‌اس پراجکت، هر دو، منبع داده هستند** — دستی تغییرشان ندهید.

---
---

# Portable Project — Gas Recovery Units EPC Dashboard

This folder is a **fully portable** copy of the project progress dashboard. It contains **no
absolute paths**, so you can copy it to a USB stick, an external drive, or another computer and it
will keep working.

## 1) Requirements

| To do this | What must be installed |
|---|---|
| View the dashboard page | **Nothing** — Windows only (the launcher is self-contained) |
| View the Power BI report | **Power BI Desktop** |
| Update the data from MS Project | **Microsoft Project** and **PowerShell** (present on all Windows) |

> If MS Project is not installed, the dashboard still opens with the **last successfully synced
> data** and shows a warning. Viewing works either way.

Installing the **Shabnam FD** font is recommended for the Persian text; without it Windows
substitutes a fallback font and the text stays readable.

## 2) Quick start

```
1. Put the MS Project file in the  Project-File  folder (replacing the previous one).
2. Double-click one of:
      Launch Offline Dashboard.exe   ->  fast look in your browser (no Power BI needed)
      Launch Power BI Report.exe     ->  open the full report in Power BI
3. Done. The Power BI report syncs the data as it opens; for the offline page press
   "Update from MS Project" (see below).
```

No configuration, and no console window ever appears.

## 3) The two launchers

**`Launch Offline Dashboard.exe`** — serves the dashboard page locally (`127.0.0.1`), opens it in
your default browser. Works **offline** and needs **no Power BI**. The page has a
**"Update from MS Project"** button that re-reads the MPP and refreshes. **Nothing updates on its
own**: no script runs in the background, no figure changes by itself, and the page never re-reads
the data behind your back. The numbers change only when you press that button.

The only thing the page does in the background is send a tiny **keep-alive ping** — at most once a
minute — so the local app knows the page is still open. The ping carries no data and writes nothing
to disk; it exists purely so the app does not quit early and leave the Update button and **F5**
dead. When those pings stop (all browser tabs closed), the app shuts itself down about **3 minutes**
later. If the Update button then reports **"The local app has closed"**, just run
`Launch Offline Dashboard.exe` again and reload the page.

**`Launch Power BI Report.exe`** — does three things in order:
1. **points the report's data path at this folder** (Power BI stores that path as an absolute
   value, so this keeps the report working after the folder is moved),
2. **syncs the data from the MPP in `Project-File`** (hidden, no window),
3. **opens `Refinery8-FGR.pbip` in Power BI Desktop.**

If Power BI is not installed it tells you how to install it or how to point the launcher at a
non-standard installation.

## 4) Everyday workflow: a new file arrives from the engineers

The **`Project-File`** folder is where the MS Project file lives:

> **Copy the new file into `Project-File` and delete/replace the old one.** The file name does not
> matter — any `.mpp` there is found and used. If several are present, the **newest** one (by file
> modification date) wins.

Then:

- **Offline page:** run `Launch Offline Dashboard.exe` and click **"Update from MS Project"** in the
  page (if it is already open, that single button is enough).
- **Power BI:** run `Launch Power BI Report.exe`. It syncs and opens the report. If Power BI is
  **already open**, press **Refresh** inside Power BI instead.

## 5) Folder contents

```
portable project\
├─ README.md                        <- this file (Persian + English)
├─ Launch Offline Dashboard.exe     <- starts the offline HTML dashboard
├─ Launch Power BI Report.exe       <- starts the Power BI report
├─ Project-File\                    <- * put the MS Project file here *
│   └─ Refinery8-FGR-Project.mpp
└─ Refinery8-FGR-Dashboard\         <- the dashboard itself (leave it alone)
    ├─ Refinery8-FGR.pbip           <- the Power BI project file
    ├─ Refinery8-FGR.Report\        <- report pages and visuals (Persian + English)
    ├─ Refinery8-FGR.SemanticModel\ <- data model and DAX measures
    ├─ data\                        <- CSV output synced from MS Project
    ├─ preview\index.html           <- the HTML dashboard page
    ├─ Scripts\                     <- sync + build scripts
    └─ logs\                        <- run logs (for troubleshooting)
```

> Do **not** rename the folders or the launchers, and keep the folder structure intact — the
> launchers locate everything relative to their own position.

## 6) Power BI report

Four tabs: **داشبورد** (Persian overview), **جزئیات** (Persian detail), **Dashboard** (English
overview), **Item Details** (English detail).

Measures: **actual itemized progress** = Σ(weight × actual%) ÷ Σ weights; **planned itemized
progress** = Σ(weight × planned%) ÷ Σ weights; **variance** = actual − planned.

Current values (status date 2025-06-30) — use these to sanity-check the data:

| Measure | Value |
|---|---|
| Actual itemized progress | **42.1%** |
| Planned itemized progress | **57.3%** |
| Variance | **−15.1 pp** |
| Leaf items | **226** |
| Milestones | **19** (8 completed) |

The **`(%W.F)`** column is each item's **Weight Factor** from the MS Project file; the actual and
planned figures are weighted by it.

**Non-standard Power BI installs:** the launcher searches the registry, `Program Files` /
`Program Files (x86)` on every drive, and the Microsoft Store build. If it still cannot find
Power BI, create a file named `powerbi-path.txt` next to the launchers containing the full path:

```
D:\Program Files (x86)\powerbi2\bin\PBIDesktop.exe
```

## 7) Offline HTML page

- **Floating «?» guide:** a round **?** button sits in the bottom corner. Click it (or press **?
  / H**) for a short guide to the global and per-chart drill, the **Charts** menu, the filter bar
  and drawer, period compare, look-ahead, SPI and the health strip, the status colours, the
  critical path, the table and print sheet, language/theme/sound and the full **keyboard
  shortcut** list. Until you open it once a pulsing ring and a small "Guide" pill point at it;
  it closes with **Esc** or an outside click and never appears in print/PDF.
- **Welcome screen:** every time the page opens, a short card (about 3 seconds) fades in with an
  animation and a chime, showing "Built by **Eng. Hossein Moradi**", then melts away. A click,
  any key or **Esc** skips it early. (If the browser has not allowed audio yet, the chime plays
  on your first click instead.)
- **Tips strip at the bottom:** instead of one fixed footer line, a news-style ticker scrolls a
  fresh handful of **random tips** about the dashboard. After **every third tip** a glowing
  "Made by Eng. Hossein Moradi" badge rides past instead of the diamond separator. Hovering
  pauses it, the chevron beside it folds it away, and it never appears in print/PDF.
- **7 themes** (cycle with **T**), **FA / EN** language switch — both remembered.
- **Ambient music** and **UI click sounds**, each with its own switch in the speaker panel
  (**M** toggles the music).
- A subtle animated background, kept faint so the numbers stay perfectly readable.
- Reads `Refinery8-FGR-Dashboard\data` — the same CSVs the Power BI model reads.
- **Filter bar + collapsible drawer (Power BI-style):** a slim always-visible bar holds the
  **Filters** button, the active chips and **Clear filters**. Press it and a drawer unfolds
  downward with the filters grouped into **three tabs**: **Basic** (phase, discipline, progress
  status, name/WBS search), **Numeric** (field — weight, actual, planned, variance, physical
  complete — plus a condition: greater/less than, or-equal, equal, not equal, between; type
  numbers without the % sign) and **Time** (finish-date range, a **relative** range — last / next
  / this + a count + days/weeks/months/years, measured from the status date — and **Top N**).
  Whatever you pick applies to every card, chart and the table; each condition shows as a chip on
  the bar and is removed with its ✕. While you scroll, the bar pins itself to the top so filters
  stay one click away.
- **Chart picker:** hover the **Charts** button — it sits in its own slim bar above the chart
  grid, separate from the filters — and the menu opens with a staggered,
  springy animation and lets you switch each chart on or off: **progress gauge**, **S-curve**,
  **phases**, **variance** and **milestone status**. The **donut (milestone status) is the only
  chart on by default**; turn the rest on yourself. Toggling one plays a premium entrance on the
  cards, the button shows how many are on, and the choice is remembered.
- **Motion:** cards settle in with a soft lift and blur, a spotlight follows the pointer across
  every card, a hairline at the top tracks the scroll position, the below-the-fold sections reveal
  on scroll, table rows cascade in (never while you type in the search box), the S-curve lines are
  drawn in, the donut turns into place and a theme change cross-fades the whole palette. All of it
  is skipped automatically when Windows is set to reduce motion.
- **Drill down / drill up — global and per-chart:** the global path sits at the top
  (whole project → phase → discipline → items); clicking a bar, a table row or the bar's drill
  buttons moves EVERY chart at once (**D** walks back). Each chart card also carries its **own**
  drill buttons (up/down + a child list): a per-chart drill changes only that chart — the card
  gets a halo and its title becomes an exit pill — and the card's target button (⊙) syncs it back
  to the global path. Each drill-down button names the level below (Drill down: Phases →
  Disciplines → Items).
- **Period compare:** the **Period compare** button sits beside the chart picker. Switch it on and
  two points are marked on the S-curve: **A** (hollow ring = baseline) and **B** (solid =
  status date); the span between them is shaded and a dashed guide marks A. Pick the window from
  **End of last month → now**, **A week ago → now**, **30 days ago → now** or **two custom
  dates**. The panel and the KPI cards then read the change (e.g. +0.6pp): ΔActual, ΔPlanned and
  ΔVariance (whether the variance gap narrowed or widened). If B is before A it says so and
  computes nothing. It honours the filters and the drill — it measures the slice you are looking
  at, including a chart's own per-chart drill.
- **The item list is virtualized:** only the handful of rows you can actually see exist in the
  page, so scrolling and filtering stay smooth even with 226 items. Very long names are trimmed
  to two lines — hover one to read it in full — and printing the page (Ctrl+P) still puts **every
  row** on paper.
- **Schedule health at a glance:** a **status strip** under the KPI cards shows the share of the
  four states (completed / in progress / late / upcoming) for whatever scope you are looking at;
  hover a colour for its count and percentage, click it to filter the page to that status. Next to
  it the **look-ahead** counts the scope's work finishing within 7/14/30 days of the status date
  ("Focus these" turns that window into a real filter). The variance card carries an **SPI** chip —
  actual ÷ planned progress, above 1 = ahead of schedule (schedule-only: the file has no cost
  data).
- **Critical path:** from the next sync the exporter also carries MS Project's Critical flag: a
  **Critical path** toggle appears beside the table legend (keeping only critical work) and every
  critical row gets a small red tick at the edge of its name. Until that sync the toggle stays
  hidden (the currently shipped CSV does not have the column yet).
- **Export PDF / Print:** the **Export PDF / Print** button in the header (or the **P** key, or a
  plain Ctrl+P) builds a clean **single A4 page** for meetings: project title, status date, current
  scope and active filters, the four KPI cards, the **S-curve**, and the **heaviest items of that
  scope** with their actual/planned bars and percentages. As many rows as fit on the page are
  printed and the footer says how many (e.g. "18 / 226 items — the full list lives in the
  dashboard"); the rest stay in the dashboard. The sheet is printed on a light, ink-friendly
  palette even if you are using a dark theme, and when period compare is on its window and deltas
  appear on the sheet too.
- **S-curve:** cumulative planned vs actual over the timeline, with a status-date line. At the
  status date it reads exactly the KPI values (planned 57.3% / actual 42.1%) and the planned curve
  reaches 100% at the project finish. Hover it for a per-date read-out.
- **Progress gauge:** the bold green arc is the actual progress and a **thin, clearly visible
  blue line** running right **beside** it (not over it) is the planned progress (the target); the
  needle sits on the actual value, with the variance, milestone count and item count beside it.
  The planned line uses the active theme's planned colour at full strength, so it re-colours with
  every other chart.
- **Item list at the bottom:** as before, **all items** are listed (heaviest first), but the **two
  progress bars (green = actual, blue = planned) now sit right in front of the item name**, each
  with its own percentage printed **in that line's colour**; the bars are a little larger and the
  data columns such as **(%W.F)** sit right beside them. The discipline/phase subtitle stays, and
  a green/blue legend sits above the table. Filters and drilling narrow that list (e.g. only one
  phase's items) and the counts are shown above and below the table.

> Open it through the launcher. Double-clicking `preview\index.html` directly will not work:
> browsers block reading the data files from a local `file://` page.

## 8) Troubleshooting

Logs: `export-msp-data.log` (sync), `powerbi-launcher.log` (Power BI launch),
`dashboard-exe.log` (offline page) — all in `Refinery8-FGR-Dashboard\logs\`.

| Symptom | Cause / fix |
|---|---|
| "No .mpp file found" | There is no MS Project file in `Project-File`. Put one there. |
| "Data sync did not succeed" | MS Project is not installed, or is running elevated (as Administrator). Close it and retry. |
| Report opens with old data | Close Power BI and reopen it via `Launch Power BI Report.exe`, or press **Refresh** inside Power BI. |
| Power BI shows an error dialog | Make sure the whole folder was copied intact, not a part of it. |
| Page does not open | If port `8642` is busy the launcher picks the next free port; the default URL is `http://127.0.0.1:8642`. |
| The "Update from MS Project" button says "The local app has closed" | The local app shut itself down after a long idle period. Run `Launch Offline Dashboard.exe` again and reload the page. |

## 9) Important notes

- **Nothing runs automatically or on a schedule** — no task, no popup window. Everything is driven
  by the two launchers. The one exception is the offline page's tiny **keep-alive ping** (at most
  once a minute, carrying no data).
- Power BI reads only the **CSVs on disk**, never the MPP itself. The order is always
  **sync first, then view**.
- To use it on another machine, that machine needs Power BI Desktop (to view the report) and
  MS Project (to sync). Copy the folder as a whole.
- `logs\` and `data\` are rewritten on each sync; deleting their contents is harmless.
- The CSVs in `data\` and the MPP in `Project-File\` are the data sources — do not edit them by hand.
