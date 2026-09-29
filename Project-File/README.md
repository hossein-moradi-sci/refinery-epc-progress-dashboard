# Project-File — drop the schedule here

Put the engineers' MS Project file (`*.mpp`) in this folder and the whole system follows it.

- **The name does not matter.** Any `*.mpp` in here is picked up; if several are present the
  **newest by file-modification time** wins, so replacing the file is always enough.
- The exporter also looks one level up (`..\Project-File`, the dashboard folder and its parent),
  which is what makes the portable layout work. `-MppPath` overrides the search entirely:

  ```powershell
  powershell -File Refinery8-FGR-Dashboard\Scripts\export-msp-data.ps1 -MppPath "D:\other\schedule.mpp"
  ```

- Then pick one:
  - **Offline page:** press **«به‌روزرسانی از MS Project»** in the page (or just run
    `Launch Offline Dashboard.exe` again).
  - **Power BI:** run `Launch Power BI Report.exe`, or press **Refresh** inside Power BI if it is
    already open.

This folder is deliberately **empty in the repository**: the schedule it normally holds belongs
to the project, not to the code. `*.mpp` is gitignored, so a file dropped here can never be
committed by accident. The report and the page both read the CSV in
`Refinery8-FGR-Dashboard\data\`, which ships with the anonymised sample.
