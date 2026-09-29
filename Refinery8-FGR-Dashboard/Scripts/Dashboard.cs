// "Launch Offline Dashboard.exe" — one-click launcher for the FGR dashboard preview page.
//
// What it does:
//   1. serves the dashboard folder on http://127.0.0.1:8642 (loopback only),
//   2. opens the preview page in the default browser,
//   3. answers /api/sync by running Scripts/export-msp-data.ps1 (window hidden),
//   4. shuts itself down ~3 minutes after the page stops pinging (tab closed).
//
// PORTABLE: the dashboard folder is located from the exe's own path (see
// LauncherCommon.cs) — no absolute path anywhere, so the folder can be copied
// to any drive/folder/machine. It works from the portable root or from inside
// the dashboard folder itself.
//
// Built with the .NET Framework compiler so it needs no runtime install:
//   powershell -File Scripts\build-launchers.ps1
// C# 5 only (csc.exe from .NET Framework 4.0) — no string interpolation, no ?. .
using System;
using System.Globalization;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

internal static class Dashboard
{
    private const int FirstPort = 8642;
    private const int LastPort = 8662;
    private static string root;          // the folder served (holds preview/index.html)
    private static string logFile;       // .freebuff\logs\dashboard-exe.log
    private static volatile bool pingsSeen;
    private static DateTime lastPingUtc = DateTime.UtcNow;
    private static DateTime startedUtc = DateTime.UtcNow;
    private static int syncRunning;

    [STAThread]
    private static void Main(string[] args)
    {
        // Never die silently: a WinExe has no console, so failures go to the log.
        try { Run(); }
        catch (Exception ex) { Launcher.Log(FallbackLog(), "FATAL " + ex.ToString()); }
    }

    // Used only when Run() failed before it could set logFile.
    private static string FallbackLog()
    {
        try { return Launcher.LogPath(Launcher.FindDashboardRoot(), "dashboard-exe.log"); }
        catch { return Path.Combine(Path.GetTempPath(), "fgr-dashboard.log"); }
    }

    private static void Run()
    {
        root = Launcher.FindDashboardRoot();
        logFile = Launcher.LogPath(root, "dashboard-exe.log");
        Log("start pid=" + Process.GetCurrentProcess().Id + " root=" + root);

        bool noBrowser = Environment.GetEnvironmentVariable("FGR_NO_BROWSER") == "1";
        TcpListener listener = null;
        int port = 0;
        for (int p = FirstPort; p <= LastPort; p++)
        {
            try
            {
                TcpListener candidate = new TcpListener(IPAddress.Loopback, p);
                candidate.Start();
                listener = candidate;
                port = p;
                break;
            }
            catch (SocketException)
            {
                // Port busy: if it is our own server, just reopen the page instead
                // of starting a second server on the next free port.
                if (IsOurs(p))
                {
                    Log("reusing running instance on " + p);
                    if (!noBrowser) OpenBrowser("http://127.0.0.1:" + p + "/");
                    return;
                }
            }
        }
        if (listener == null)
        {
            Log("no free port");
            return;
        }

        Thread t = new Thread(delegate() { AcceptLoop(listener); });
        t.IsBackground = true;
        t.Start();

        string url = "http://127.0.0.1:" + port + "/";
        Log("serving " + url);
        if (!noBrowser) OpenBrowser(url);

        int idleLimit = 180;
        string envIdle = Environment.GetEnvironmentVariable("FGR_IDLE_SECONDS");
        if (envIdle != null) { int parsed; if (int.TryParse(envIdle, out parsed) && parsed > 0) idleLimit = parsed; }

        while (true)
        {
            Thread.Sleep(5000);
            double idle = (DateTime.UtcNow - lastPingUtc).TotalSeconds;
            double life = (DateTime.UtcNow - startedUtc).TotalSeconds;
            if (pingsSeen && idle > idleLimit) { Log("page idle " + (int)idle + "s -> exit"); break; }
            if (!pingsSeen && life > idleLimit * 2 + 60) { Log("no page ever opened -> exit"); break; }
        }
        try { listener.Stop(); } catch { }
    }

    /* ---------------- setup helpers ---------------- */

    private static bool IsOurs(int port)
    {
        try
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + port + "/api/health");
            // Bypass any system proxy: otherwise a refused port costs the full
            // timeout and startup stalls for seconds per port.
            req.Proxy = null;
            req.KeepAlive = false;
            req.Timeout = 500;
            using (WebResponse res = req.GetResponse())
            using (StreamReader r = new StreamReader(res.GetResponseStream()))
                return r.ReadToEnd().IndexOf("fgr-dashboard") >= 0;
        }
        catch { return false; }
    }

    private static void OpenBrowser(string url)
    {
        try { Process.Start(url); } catch (Exception ex) { Log("open browser failed: " + ex.Message); }
    }

    // Delegates so the logs folder is created on demand (it no longer
    // pre-exists in .freebuff, which is not part of the portable copy).
    private static void Log(string msg)
    {
        Launcher.Log(logFile, msg);
    }

    /* ---------------- http ---------------- */

    private static void AcceptLoop(TcpListener listener)
    {
        while (true)
        {
            TcpClient client;
            try { client = listener.AcceptTcpClient(); }
            catch { break; }
            TcpClient c = client;
            ThreadPool.QueueUserWorkItem(delegate(object state) { try { Handle((TcpClient)state); } catch { } }, c);
        }
    }

    private static void Handle(TcpClient client)
    {
        using (client)
        {
            client.ReceiveTimeout = 10000;
            client.SendTimeout = 120000;
            NetworkStream ns = client.GetStream();

            string first = ReadLine(ns);
            if (first == null) return;
            while (true)
            {
                string h = ReadLine(ns);
                if (h == null || h.Length == 0) break;
            }

            string[] parts = first.Split(' ');
            string path = parts.Length > 1 ? parts[1] : "/";
            int q = path.IndexOf('?');
            if (q >= 0) path = path.Substring(0, q);
            try { path = Uri.UnescapeDataString(path); } catch { }

            if (path == "/api/health") { WriteJson(ns, "{\"ok\":true,\"app\":\"fgr-dashboard\",\"port\":" + GetPort(client) + "}"); return; }
            if (path == "/api/ping") { pingsSeen = true; lastPingUtc = DateTime.UtcNow; WriteJson(ns, "{\"ok\":true}"); return; }
            if (path == "/api/sync") { HandleSync(ns); return; }
            ServeFile(ns, path);
        }
    }

    private static int GetPort(TcpClient client)
    {
        try { return ((IPEndPoint)client.Client.LocalEndPoint).Port; } catch { return 0; }
    }

    private static string ReadLine(NetworkStream ns)
    {
        MemoryStream buf = new MemoryStream();
        int b;
        while ((b = ns.ReadByte()) != -1)
        {
            if (b == '\n') return Encoding.UTF8.GetString(buf.ToArray()).TrimEnd('\r');
            buf.WriteByte((byte)b);
            if (buf.Length > 8192) break;
        }
        return buf.Length == 0 ? null : Encoding.UTF8.GetString(buf.ToArray());
    }

    private static void ServeFile(NetworkStream ns, string path)
    {
        if (path == "/" || path.Length == 0) path = "/preview/index.html";
        string rel = path.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
        string full = Path.GetFullPath(Path.Combine(root, rel));
        if (!full.StartsWith(root, StringComparison.OrdinalIgnoreCase) || !File.Exists(full))
        {
            Write(ns, "404 Not Found", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("not found"));
            return;
        }
        byte[] body = File.ReadAllBytes(full);
        Write(ns, "200 OK", Mime(Path.GetExtension(full)), body);
    }

    private static string Mime(string ext)
    {
        switch ((ext ?? "").ToLowerInvariant())
        {
            case ".html": return "text/html; charset=utf-8";
            case ".csv": return "text/csv; charset=utf-8";
            case ".js": return "text/javascript; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".svg": return "image/svg+xml";
            case ".png": return "image/png";
            case ".ico": return "image/x-icon";
            default: return "application/octet-stream";
        }
    }

    private static void Write(NetworkStream ns, string status, string type, byte[] body)
    {
        string head = "HTTP/1.1 " + status + "\r\n" +
                      "Content-Type: " + type + "\r\n" +
                      "Content-Length: " + body.Length.ToString(CultureInfo.InvariantCulture) + "\r\n" +
                      "Cache-Control: no-store\r\nConnection: close\r\n\r\n";
        byte[] hb = Encoding.UTF8.GetBytes(head);
        ns.Write(hb, 0, hb.Length);
        ns.Write(body, 0, body.Length);
        ns.Flush();
    }

    private static void WriteJson(NetworkStream ns, string json)
    {
        Write(ns, "200 OK", "application/json; charset=utf-8", Encoding.UTF8.GetBytes(json));
    }

    /* ---------------- sync ---------------- */

    private static void HandleSync(NetworkStream ns)
    {
        if (Interlocked.CompareExchange(ref syncRunning, 1, 0) == 1)
        {
            WriteJson(ns, "{\"ok\":false,\"message\":\"sync already running\"}");
            return;
        }
        bool ok = false;
        string message = "";
        string tail = "";
        try
        {
            string script = Path.Combine(root, "Scripts", "export-msp-data.ps1");
            Log("sync requested");
            ProcessStartInfo psi = new ProcessStartInfo(
                "powershell.exe",
                "-NoProfile -ExecutionPolicy Bypass -File \"" + script + "\"");
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.WindowStyle = ProcessWindowStyle.Hidden;
            psi.RedirectStandardOutput = true;
            psi.RedirectStandardError = true;

            Process p = Process.Start(psi);
            string stdout = p.StandardOutput.ReadToEnd();
            string stderr = p.StandardError.ReadToEnd();
            if (!p.WaitForExit(300000)) { try { p.Kill(); } catch { } message = "timeout after 5 min"; }
            int code = p.HasExited ? p.ExitCode : -1;

            tail = LogTail(3);
            ok = (code == 0) && tail.IndexOf("SYNC OK", StringComparison.OrdinalIgnoreCase) >= 0;
            if (!ok && message.Length == 0)
                message = stderr.Trim().Length > 0 ? FirstLine(stderr) : ("exit code " + code);
            Log("sync finished ok=" + ok + " code=" + code + " tail=" + tail);
        }
        catch (Exception ex)
        {
            message = ex.Message;
            Log("sync error: " + ex.Message);
        }
        finally
        {
            Interlocked.Exchange(ref syncRunning, 0);
        }

        string body = "{\"ok\":" + (ok ? "true" : "false") +
                      ",\"message\":" + JsonStr(message) +
                      ",\"tail\":" + JsonStr(tail) +
                      ",\"at\":" + JsonStr(DateTime.Now.ToString("HH:mm:ss")) + "}";
        try { WriteJson(ns, body); } catch { }
    }

    private static string LogTail(int lines)
    {
        try
        {
            string syncLog = Launcher.LogPath(root, "export-msp-data.log");
            if (!File.Exists(syncLog)) return "";
            string[] all;
            using (FileStream fs = new FileStream(syncLog, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            using (StreamReader r = new StreamReader(fs, Encoding.UTF8))
                all = r.ReadToEnd().Split(new string[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            int start = Math.Max(0, all.Length - lines);
            string[] slice = new string[all.Length - start];
            Array.Copy(all, start, slice, 0, slice.Length);
            return string.Join(" | ", slice);
        }
        catch { return ""; }
    }

    private static string FirstLine(string s)
    {
        if (s == null) return "";
        s = s.Trim();
        int i = s.IndexOf('\n');
        return i >= 0 ? s.Substring(0, i).Trim() : s;
    }

    private static string JsonStr(string s)
    {
        if (s == null) return "\"\"";
        StringBuilder b = new StringBuilder("\"");
        foreach (char c in s)
        {
            switch (c)
            {
                case '"': b.Append("\\\""); break;
                case '\\': b.Append("\\\\"); break;
                case '\n': b.Append("\\n"); break;
                case '\r': break;
                case '\t': b.Append(" "); break;
                default:
                    if (c < ' ') b.Append(' ');
                    else b.Append(c);
                    break;
            }
        }
        return b.Append('"').ToString();
    }
}
