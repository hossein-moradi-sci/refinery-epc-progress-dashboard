// "Launch Power BI Report.exe" - one-click launcher for the FGR Power BI report.
//
// What it does, in order:
//   1. finds the dashboard folder from its own location (LauncherCommon.cs),
//   2. points the semantic model's DataFolder parameter at THIS copy's data
//      folder - Power BI stores absolute paths, so without this the report would
//      still look at the folder it was built in when the project is moved,
//   3. runs Scripts\export-msp-data.ps1 (hidden) so the CSVs match the MPP that
//      currently sits in the drop folder,
//   4. opens Refinery8-FGR.pbip in Power BI Desktop, wherever that is installed.
//
// Built with the .NET Framework compiler:
//   powershell -File Scripts\build-launchers.ps1
// C# 5 only (csc.exe from .NET Framework 4.0) - no string interpolation, no ?. .
using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Windows.Forms;

// UIA interop: after the first open of a copied project (no .pbi folder), Power BI
// shows "Some of the tables have incomplete or no data" with a "Refresh now"
// button until a full refresh runs. We press that button for the user.
using System.Windows.Automation;

internal static class PowerBILauncher
{
    [STAThread]
    private static void Main(string[] args)
    {
        // Never die silently: a WinExe has no console, so failures go to the log.
        try { Run(); }
        catch (Exception ex) { Launcher.Log(FallbackLog(), "FATAL " + ex.ToString()); }
    }

    private static string FallbackLog()
    {
        try { return Launcher.LogPath(Launcher.FindDashboardRoot(), "powerbi-launcher.log"); }
        catch { return Path.Combine(Path.GetTempPath(), "fgr-powerbi-launcher.log"); }
    }

    private static void Run()
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
        string root = Launcher.FindDashboardRoot();
        string log = Launcher.LogPath(root, "powerbi-launcher.log");
        Launcher.Log(log, "start pid=" + Process.GetCurrentProcess().Id + " root=" + root);

        // ---- the report file ----
        string pbip = FindPbip(root);
        if (pbip == null)
        {
            Launcher.Log(log, "no .pbip found in " + root);
            Box("Power BI report not found." + Environment.NewLine + "Refinery8-FGR.pbip is missing next to this launcher." + Environment.NewLine + Environment.NewLine +
                "فایل گزارش پاور بی آی پیدا نشد؛ فایل Refinery8-FGR.pbip کنار این برنامه نیست.",
                "Launch Power BI Report", MessageBoxIcon.Error);
            return;
        }

        // ---- 1. keep the model's data path correct for THIS folder ----
        bool pathChanged = PatchDataFolder(root, log);

        // ---- 2. refresh the CSVs from whatever MPP is in the drop folder ----
        bool synced = RunSync(root, log);

        // A moved project keeps the old path in memory until Power BI is restarted.
        if (pathChanged && PowerBiRunning())
        {
            Box("The data path was updated for this folder." + Environment.NewLine +
                "Power BI is already open: close it and reopen it so the new data is read." + Environment.NewLine + Environment.NewLine +
                "مسیر داده برای این پوشه به‌روز شد. پاور بی آی باز است؛ آن را ببندید و دوباره باز کنید تا داده جدید خوانده شود.",
                "Launch Power BI Report", MessageBoxIcon.Warning);
        }

        if (!synced)
        {
            Box("Data sync from MS Project did not succeed." + Environment.NewLine +
                "Power BI will open with the data from the last successful sync." + Environment.NewLine +
                "Details: logs\\export-msp-data.log" + Environment.NewLine + Environment.NewLine +
                "سینک داده از ام اس پراجکت انجام نشد. داشبورد با آخرین داده سینک‌شده باز می‌شود. جزئیات در پوشه logs.",
                "Launch Power BI Report", MessageBoxIcon.Warning);
        }

        // ---- 3. open the report ----
        string pbiExe;
        if (Launcher.FindPowerBI(root, baseDir, out pbiExe))
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(pbiExe, "\"" + pbip + "\"");
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.WorkingDirectory = root;
                Process.Start(psi);
                Launcher.Log(log, "launched: " + pbiExe + " " + pbip);
            }
            catch (Exception ex)
            {
                Launcher.Log(log, "launch failed: " + ex.Message);
                OpenByAssociation(pbip, log, baseDir);
                return;
            }
        }
        else
        {
            Launcher.Log(log, "Power BI Desktop not found - falling back to the .pbip association");
            OpenByAssociation(pbip, log, baseDir);
            return;
        }

        // ---- 4. first open of a fresh copy does a full refresh: press
        //         "Refresh now" on the banner when it appears ----
        PressRefreshNow(log);
    }

    // Polls for up to ~4 minutes for Power BI's "Some of the tables have
    // incomplete or no data" banner and presses its "Refresh now" button via
    // UI Automation. Silent no-op when the banner never appears (normal case:
    // the .pbi cache exists or the model is already loaded).
    private static void PressRefreshNow(string log)
    {
        int newPid = -1;
        for (int waited = 0; waited < 45 * 1000; waited += 2000)
        {
            Thread.Sleep(2000);
            try
            {
                Process[] all = Process.GetProcessesByName("PBIDesktop");
                if (all.Length == 0) all = Process.GetProcessesByName("PBIDesktopStore");
                if (all.Length == 0) continue;
                foreach (Process p in all)
                {
                    if (p.StartTime > DateTime.Now.AddSeconds(-(waited / 1000 + 60))) { newPid = p.Id; break; }
                }
                if (newPid < 0) newPid = all[all.Length - 1].Id;
            }
            catch { }
            if (newPid < 0) continue;

            try
            {
                AutomationElement root = AutomationElement.FromHandle(Process.GetProcessById(newPid).MainWindowHandle);
                AutomationElement btn = root.FindFirst(TreeScope.Descendants,
                    new PropertyCondition(AutomationElement.NameProperty, "Refresh now"));
                if (btn == null) continue;
                ((InvokePattern)btn.GetCurrentPattern(InvokePattern.Pattern)).Invoke();
                Launcher.Log(log, "pressed the 'Refresh now' banner button (first load after a copy) - pid " + newPid);
                return;
            }
            catch (Exception ex)
            {
                Launcher.Log(log, "refresh-now probe failed: " + ex.Message);
                return;
            }
        }
        Launcher.Log(log, "no 'Refresh now' banner within the wait window (normal when the model loads cleanly)");
    }

    /* ---------------- steps ---------------- */

    private static string FindPbip(string root)
    {
        try
        {
            string[] files = Directory.GetFiles(root, "*.pbip");
            if (files.Length > 0) return files[0];
        }
        catch { }
        return null;
    }

    // Power BI reads the CSVs through the DataFolder parameter in the semantic
    // model, and that value is an absolute path. Point it at this copy's data
    // folder so the project works after being copied to another drive.
    private static bool PatchDataFolder(string root, string log)
    {
        string exprPath = Path.Combine(root, Path.Combine(Path.Combine("Refinery8-FGR.SemanticModel", "definition"), "expressions.tmdl"));
        string dataDir = Path.Combine(root, "data");

        if (!File.Exists(exprPath))
        {
            Launcher.Log(log, "WARN model file not found: " + exprPath);
            return false;
        }

        string text = Launcher.ReadText(exprPath);
        if (text == null)
        {
            Launcher.Log(log, "WARN could not read " + exprPath);
            return false;
        }

        const string marker = "expression DataFolder = \"";
        int i = text.IndexOf(marker, StringComparison.Ordinal);
        if (i < 0)
        {
            Launcher.Log(log, "WARN no DataFolder parameter in expressions.tmdl - left unchanged");
            return false;
        }

        int start = i + marker.Length;
        int end = text.IndexOf('"', start);
        if (end <= start)
        {
            Launcher.Log(log, "WARN malformed DataFolder value - left unchanged");
            return false;
        }

        string current = text.Substring(start, end - start);
        if (string.Equals(current, dataDir, StringComparison.OrdinalIgnoreCase))
        {
            Launcher.Log(log, "data path already correct: " + dataDir);
            return false;
        }

        string updated = text.Substring(0, start) + dataDir + text.Substring(end);
        if (Launcher.WriteIfChanged(exprPath, updated))
        {
            Launcher.Log(log, "data path updated: " + current + " -> " + dataDir);
            return true;
        }

        Launcher.Log(log, "WARN could not update the data path in expressions.tmdl");
        return false;
    }

    private static bool RunSync(string root, string log)
    {
        string script = Path.Combine(root, Path.Combine("Scripts", "export-msp-data.ps1"));
        if (!File.Exists(script))
        {
            Launcher.Log(log, "WARN sync script not found: " + script);
            return false;
        }

        Launcher.Log(log, "sync start");
        string outp, err;
        bool ok = Launcher.RunHidden("powershell.exe",
            "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\"",
            300000, out outp, out err);

        Launcher.Log(log, "sync " + (ok ? "OK" : "FAILED") + (err.Length > 0 ? (" err=" + FirstLine(err)) : ""));
        return ok;
    }

    private static void OpenByAssociation(string pbip, string log, string baseDir)
    {
        bool started = false;
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo(pbip);
            psi.UseShellExecute = true;
            psi.WorkingDirectory = Path.GetDirectoryName(pbip);
            Process.Start(psi);
            started = true;
            Launcher.Log(log, "opened via the .pbip file association");
        }
        catch (Exception ex)
        {
            Launcher.Log(log, "open by association failed: " + ex.Message);
        }

        if (!started)
        {
            Box("Power BI Desktop was not found on this computer." + Environment.NewLine + Environment.NewLine +
                "Install Power BI Desktop, or write the full path of PBIDesktop.exe" + Environment.NewLine +
                "into a file named powerbi-path.txt next to this launcher." + Environment.NewLine +
                "See README.md for details." + Environment.NewLine + Environment.NewLine +
                "پاور بی آی دسکتاپ روی این سیستم پیدا نشد. آن را نصب کنید، یا مسیر کامل فایل PBIDesktop.exe را در فایل" + Environment.NewLine +
                "powerbi-path.txt کنار همین برنامه بنویسید. برای توضیح بیشتر فایل README.md را ببینید.",
                "Launch Power BI Report", MessageBoxIcon.Error);
        }
    }

    /* ---------------- helpers ---------------- */

    private static bool PowerBiRunning()
    {
        try
        {
            return Process.GetProcessesByName("PBIDesktop").Length > 0
                || Process.GetProcessesByName("PBIDesktopStore").Length > 0;
        }
        catch { return false; }
    }

    private static string FirstLine(string s)
    {
        if (s == null) return "";
        s = s.Trim();
        int i = s.IndexOf('\n');
        return i >= 0 ? s.Substring(0, i).Trim() : s;
    }

    private static void Box(string message, string title, MessageBoxIcon icon)
    {
        try { MessageBox.Show(message, title, MessageBoxButtons.OK, icon); }
        catch { }
    }
}
