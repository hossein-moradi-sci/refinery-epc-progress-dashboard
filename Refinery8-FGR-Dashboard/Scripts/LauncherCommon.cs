// LauncherCommon.cs - shared helpers for the two portable launchers.
//
// Compiled into BOTH "Launch Offline Dashboard.exe" (Dashboard.cs) and
// "Launch Power BI Report.exe" (PowerBI.cs), so the root-finding and
// Power BI lookup rules only exist once.
//
// Everything here is location-independent: the portable project can sit on any
// drive, in any folder, on any machine. No absolute path is ever assumed.
//
// Built with the .NET Framework compiler (see build-launchers.ps1).
// C# 5 only (csc.exe from .NET Framework 4.0) - no string interpolation, no ?. .
using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using Microsoft.Win32;

internal static class Launcher
{
    public const string DashboardFolderName = "Refinery8-FGR-Dashboard";

    /* ------------------------------------------------------------------
       Where is the dashboard payload (the folder holding preview\index.html)?
       Handles all three layouts:
         A. exe next to preview\            -> <exe dir>
         B. exe inside Scripts\ or one level up -> nearest parent that qualifies
         C. exe at the portable root, payload in a subfolder -> search downward
       ------------------------------------------------------------------ */
    public static string FindDashboardRoot()
    {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);

        if (IsRoot(baseDir)) return baseDir;

        string dir = baseDir;
        for (int i = 0; i < 4 && dir != null; i++)
        {
            if (IsRoot(dir)) return dir;
            dir = Path.GetDirectoryName(dir);
        }

        string found = SearchDown(baseDir, 0);
        if (found != null) return found;

        return baseDir;
    }

    private static bool IsRoot(string dir)
    {
        if (string.IsNullOrEmpty(dir)) return false;
        return File.Exists(Path.Combine(dir, Path.Combine("preview", "index.html")));
    }

    private static string SearchDown(string dir, int depth)
    {
        if (depth > 2) return null;
        try
        {
            foreach (string sub in Directory.GetDirectories(dir))
            {
                if (IsRoot(sub)) return sub;
                string found = SearchDown(sub, depth + 1);
                if (found != null) return found;
            }
        }
        catch { }
        return null;
    }

    /* ---------------- logging ---------------- */

    // Logs live inside the dashboard folder, so the portable project stays self-contained.
    public static string LogPath(string root, string name)
    {
        return Path.Combine(Path.Combine(root, "logs"), name);
    }

    public static void Log(string logFile, string msg)
    {
        try
        {
            string dir = Path.GetDirectoryName(logFile);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);
            string line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " " + msg + Environment.NewLine;
            File.AppendAllText(logFile, line, Encoding.UTF8);
        }
        catch { }
    }

    /* ---------------- file helpers ---------------- */

    public static string ReadText(string path)
    {
        try { return File.ReadAllText(path, new UTF8Encoding(false)); }
        catch { return null; }
    }

    // Rewrites only when the content really differs, so a launch never touches
    // the file's timestamp for nothing (which would make Power BI re-read it).
    public static bool WriteIfChanged(string path, string content)
    {
        try
        {
            string current = File.Exists(path) ? File.ReadAllText(path, new UTF8Encoding(false)) : null;
            if (current != null && current == content) return false;
            File.WriteAllText(path, content, new UTF8Encoding(false));
            return true;
        }
        catch { return false; }
    }

    /* ---------------- hidden process ---------------- */

    public static bool RunHidden(string exe, string arguments, int timeoutMs, out string stdout, out string stderr)
    {
        stdout = "";
        stderr = "";
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo(exe, arguments);
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.WindowStyle = ProcessWindowStyle.Hidden;
            psi.RedirectStandardOutput = true;
            psi.RedirectStandardError = true;
            Process p = Process.Start(psi);
            stdout = p.StandardOutput.ReadToEnd();
            stderr = p.StandardError.ReadToEnd();
            if (!p.WaitForExit(timeoutMs))
            {
                try { p.Kill(); } catch { }
                stderr = stderr + " (timed out)";
                return false;
            }
            return p.ExitCode == 0;
        }
        catch (Exception ex)
        {
            stderr = ex.Message;
            return false;
        }
    }

    /* ---------------- Power BI Desktop lookup ---------------- */

    // Ordered: explicit override -> registry -> standard folders -> all fixed drives.
    public static bool FindPowerBI(string root, string baseDir, out string exePath)
    {
        exePath = null;
        string p;

        // 1. An override file lets the user pin a non-standard install.
        string[] overrides = new string[]
        {
            Path.Combine(baseDir, "powerbi-path.txt"),
            Path.Combine(root, "powerbi-path.txt"),
            Path.Combine(root, "Scripts", "powerbi-path.txt")
        };
        foreach (string f in overrides)
        {
            string text = ReadText(f);
            if (text == null) continue;
            p = text.Trim().Trim('"').Trim();
            if (p.Length > 0 && File.Exists(p)) { exePath = p; return true; }
        }

        // 2. The installer writes an "App Paths" entry for the normal download.
        string[] appPathKeys = new string[]
        {
            @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\PBIDesktop.exe",
            @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\PBIDesktop.exe"
        };
        foreach (string sub in appPathKeys)
        {
            p = RegValue(Registry.LocalMachine, sub);
            if (p != null && File.Exists(p)) { exePath = p; return true; }
            p = RegValue(Registry.CurrentUser, sub);
            if (p != null && File.Exists(p)) { exePath = p; return true; }
        }

        // 3. Standard locations, including the Microsoft Store build.
        string[] standard = new string[]
        {
            Combine2(Env("ProgramFiles"), @"Microsoft Power BI Desktop\bin\PBIDesktop.exe"),
            Combine2(Env("ProgramFiles(x86)"), @"Microsoft Power BI Desktop\bin\PBIDesktop.exe"),
            Combine2(Env("ProgramW6432"), @"Microsoft Power BI Desktop\bin\PBIDesktop.exe"),
            Combine2(Env("LOCALAPPDATA"), @"Microsoft\WindowsApps\PBIDesktopStore.exe"),
            Combine2(Env("LOCALAPPDATA"), @"Microsoft\Power BI Desktop\bin\PBIDesktop.exe")
        };
        foreach (string candidate in standard)
        {
            if (candidate != null && File.Exists(candidate)) { exePath = candidate; return true; }
        }

        // 4. Power BI is often installed to a custom folder; scan the usual roots.
        p = ScanDrives();
        if (p != null) { exePath = p; return true; }

        return false;
    }

    public static string Env(string name)
    {
        try
        {
            string v = Environment.GetEnvironmentVariable(name);
            if (string.IsNullOrEmpty(v)) return "";
            return v;
        }
        catch { return ""; }
    }

    public static string Combine2(string dir, string rel)
    {
        if (string.IsNullOrEmpty(dir)) return null;
        return Path.Combine(dir, rel);
    }

    private static string RegValue(RegistryKey hive, string subKey)
    {
        try
        {
            using (RegistryKey k = hive.OpenSubKey(subKey))
            {
                if (k == null) return null;
                object v = k.GetValue(null);        // the App Paths default value = the exe
                if (v == null) return null;
                return v.ToString().Trim().Trim('"');
            }
        }
        catch { return null; }
    }

    private static string ScanDrives()
    {
        DriveInfo[] drives;
        try { drives = DriveInfo.GetDrives(); }
        catch { return null; }

        foreach (DriveInfo d in drives)
        {
            try
            {
                if (!d.IsReady) continue;
                if (d.DriveType != DriveType.Fixed && d.DriveType != DriveType.Removable) continue;
            }
            catch { continue; }

            string[] roots = new string[] { "Program Files", "Program Files (x86)" };
            foreach (string r in roots)
            {
                string pf = Path.Combine(d.Name, r);
                if (!Directory.Exists(pf)) continue;

                // Well-known folder names first.
                string[] known = new string[] { "Microsoft Power BI Desktop", "powerbi2", "powerbi" };
                foreach (string n in known)
                {
                    string p = Path.Combine(Path.Combine(pf, n), Path.Combine("bin", "PBIDesktop.exe"));
                    if (File.Exists(p)) return p;
                }

                // Then anything that looks like a Power BI install.
                try
                {
                    foreach (string sub in Directory.GetDirectories(pf))
                    {
                        string leaf = Path.GetFileName(sub).ToLowerInvariant();
                        if (leaf.IndexOf("power bi") < 0 && leaf.IndexOf("powerbi") < 0) continue;
                        string p = Path.Combine(sub, Path.Combine("bin", "PBIDesktop.exe"));
                        if (File.Exists(p)) return p;
                    }
                }
                catch { }
            }
        }
        return null;
    }
}
