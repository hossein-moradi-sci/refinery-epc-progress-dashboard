<#
.SYNOPSIS
  Sync engine for the Power BI dashboard.
  Exports task data from the project MPP into
  data\tasks.csv and data\project-info.csv, which the PBIP semantic model reads.

.DESCRIPTION
  PORTABLE: every path is derived from this script's own location, so the whole
  folder can be copied to any drive, folder or machine and still work. Nothing
  here needs to be edited when the project moves.

  The MPP is found automatically, newest first, in these folders:
    1. <dashboard>\Project-File      <- the drop folder (replace the file here)
    2. <dashboard>\..\Project-File   <- portable layout: drop folder next to the dashboard
    3. <dashboard>                   <- dropped straight next to the .pbip
    4. <dashboard>\..
  Pass -MppPath to override the search.

  The data source is then picked automatically:
    1. LIVE  - the MPP is open in a running MS Project: read it there in real time.
    2. REUSE - MS Project is running without the MPP: open it read-only in that
       same instance instead of spawning a second one.
    3. DISK  - no MS Project running: open the MPP read-only in a new process.

  Writes are atomic (write to .tmp, then move) so Power BI never reads a
  half-written file.

.EXAMPLE
  .\export-msp-data.ps1                          # sync the dropped MPP
  .\export-msp-data.ps1 -MppPath "D:\other.mpp"  # sync a different file
#>
param(
    [string]$MppPath = "",
    [string]$OutDir  = ""
)

$ErrorActionPreference = 'Stop'

# ---- portable paths: everything hangs off the script's own folder ----
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dashboard = Split-Path -Parent $ScriptDir
$ParentDir = Split-Path -Parent $Dashboard
if (-not $OutDir) { $OutDir = Join-Path $Dashboard 'data' }
$LogDir  = Join-Path $Dashboard 'logs'
$LogFile = Join-Path $LogDir 'export-msp-data.log'

foreach ($d in @($LogDir, $OutDir)) {
    if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

function Write-Log([string]$msg) {
    $line = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $msg
    try { Add-Content -Path $LogFile -Value $line -Encoding UTF8 } catch {}
    try { Write-Host $line } catch {}
}

<#
.SYNOPSIS
  Finds the MPP to sync: the newest *.mpp in the drop folder (or its neighbours).
  "Newest" means replacing the file in the drop folder always takes effect,
  even if an older file is left behind under a different name.
#>
function Find-Mpp([string]$Dashboard) {
    if (-not $Dashboard) { return $null }
    $Parent = Split-Path -Parent $Dashboard
    $dirs = @(
        (Join-Path $Dashboard 'Project-File'),
        (Join-Path $Parent 'Project-File'),
        $Dashboard,
        $Parent
    )
    $found = @()
    foreach ($d in $dirs) {
        if (-not $d) { continue }
        try {
            $found += @(Get-ChildItem -LiteralPath $d -Filter '*.mpp' -File -ErrorAction SilentlyContinue)
        } catch {}
    }
    if ($found.Count -eq 0) { return $null }
    return ($found | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}

function Write-CsvAtomic {
    param([object[]]$Rows, [string]$Path)
    $tmp = "$Path.tmp"
    $Rows | Export-Csv -Path $tmp -NoTypeInformation -Encoding UTF8
    Move-Item -Force -Path $tmp -Destination $Path
}

function Find-Project($app, [string]$Path) {
    # Match by file Name first: FullName can come back empty via late binding.
    $leaf = [IO.Path]::GetFileName($Path)
    foreach ($p in $app.Projects) {
        if ($null -eq $p) { continue }
        $nm = ""; $fn = ""
        try { $nm = [string]$p.Name } catch {}
        try { $fn = [string]$p.FullName } catch {}
        if ($nm -eq $leaf -or $fn -eq $Path) { return $p }
    }
    return $null
}

<#
.SYNOPSIS
  Opens the MPP read-only and returns @{ App; Project; Mode } with Mode
  LIVE, REUSE or DISK - the mode also decides what gets closed afterwards.
#>
function Read-Mpp([string]$Path) {
    $leaf = [IO.Path]::GetFileName($Path)
    try {
        $app = [Runtime.InteropServices.Marshal]::GetActiveObject("MSProject.Application")
        $name = ""
        try { $name = [string]$app.Name } catch {}
        if ($name -ne "") {
            $p = Find-Project $app $Path
            if ($null -ne $p) {
                Write-Log "MPP is open in the running instance - reading LIVE."
                return @{ App = $app; Project = $p; Mode = "LIVE" }
            }
            # REUSE: open it read-only inside the user's running instance.
            Write-Log "MS Project is running without our MPP - opening it read-only in that instance."
            $app.FileOpenEx($Path, $true)
            Start-Sleep -Seconds 2
            $p = Find-Project $app $Path
            if ($null -eq $p) {
                # On attached instances the Projects collection can come back
                # empty; ActiveProject is the reliable handle for the file we
                # just opened - but only if it really is our file.
                try { $ap = $app.ActiveProject } catch { $ap = $null }
                if ($null -ne $ap -and ([string]$ap.Name) -eq $leaf) { $p = $ap }
            }
            if ($null -ne $p) {
                Write-Log ("Opened (read-only, reused instance): " + $leaf)
                return @{ App = $app; Project = $p; Mode = "REUSE" }
            }
            Write-Log "Could not open the MPP in the running instance."
        } else {
            # A force-closed MS Project can leave a stale COM registration; the
            # attached object answers calls but carries no state. Ignore it.
            Write-Log "Running-instance COM object is not responding (stale registration) - ignoring it."
        }
    } catch {
        Write-Log "No running MS Project instance."
    }

    # DISK: open read-only in a fresh, hidden instance.
    # Late-bound activation: New-Object -ComObject can fail with an ApplicationClass
    # cast error when an MS Project instance is already running.
    # Retry: a WINPROJ instance that was killed moments earlier (or still tearing
    # down) briefly leaves a ROT registration whose object cannot be cast -
    # CreateInstance then throws InvalidCastException. The registration clears
    # within seconds, so wait and retry instead of failing the sync.
    $app = $null
    for ($attempt = 1; $attempt -le 6; $attempt++) {
        try {
            $app = [Activator]::CreateInstance([type]::GetTypeFromProgID("MSProject.Application"))
            break
        } catch {
            if ($attempt -eq 6) { throw }
            Write-Log ("MS Project COM not ready (attempt " + $attempt + " of 6): " + $_.Exception.InnerException.Message + " - retrying in 5 s")
            Start-Sleep -Seconds 5
        }
    }
    try { $app.Visible = $false } catch {}
    try { $app.DisplayAlerts = $false } catch {}
    Write-Log "Opening MPP read-only from disk..."
    $app.FileOpenEx($Path, $true)
    $proj = $app.ActiveProject
    Write-Log ("Opened: " + $proj.Name)
    return @{ App = $app; Project = $proj; Mode = "DISK" }
}

Set-Content -Path $LogFile -Value ("[{0:yyyy-MM-dd HH:mm:ss}] === SYNC START ===" -f (Get-Date)) -Encoding UTF8
Write-Log ("Folder: " + $Dashboard)

$ctx = $null
try {
    # ---- locate the MPP (the engineer-supplied file) ----
    if (-not $MppPath) { $MppPath = Find-Mpp $Dashboard }
    if (-not $MppPath) {
        throw ("No .mpp file found. Put the MS Project file in:`n    " + (Join-Path $Dashboard 'Project-File') + "`n  (or in " + $ParentDir + ") and run the sync again.")
    }
    if (-not (Test-Path -LiteralPath $MppPath)) { throw "MPP file not found: $MppPath" }
    Write-Log ("MPP: " + $MppPath)
    $mppStamp = (Get-Item -LiteralPath $MppPath).LastWriteTime.ToString("yyyy-MM-dd HH:mm")

    $ctx = Read-Mpp $MppPath
    $app = $ctx.App
    $proj = $ctx.Project

    # The MPP tracks itemized progress in custom Number fields (formulas):
    #   Number1 = item weight (summaries roll up the sum of children)
    #   Number3 = planned itemized %  (the MPP's own planned-progress formula, NOT % Complete)
    #   Number5 = actual itemized %   (Physical % Complete on leaf tasks)
    # MSP rolls Number1/3/5 up weight-wise on summary rows, so exporting leaves
    # with weight x N3 / weight x N5 reproduces the file's own rollups exactly.
    $constWeight  = $app.FieldNameToFieldConstant("Number1")
    $constPlanned = $app.FieldNameToFieldConstant("Number3")

    $rows = New-Object System.Collections.Generic.List[object]
    $byWbs = @{}
    $statusDate = $proj.StatusDate
    if ($null -eq $statusDate -or $statusDate -eq [datetime]::MinValue) { $statusDate = Get-Date }

    foreach ($t in $proj.Tasks) {
        if ($null -eq $t) { continue }

        $weight = 0.0
        try { $weight = [double]($t.GetField($constWeight)) } catch {}
        if ($weight -lt 0) { $weight = 0.0 }

        $phys = [double]$t.PhysicalPercentComplete
        $actualFraction = $phys / 100.0
        $n3raw = ""
        try { $n3raw = [string]$t.GetField($constPlanned) } catch {}
        $plannedFraction = if ($n3raw -ne "") { [double]::Parse($n3raw, [Globalization.CultureInfo]::InvariantCulture) / 100.0 } else { 0.0 }

        $rows.Add([pscustomobject][ordered]@{
            UniqueID                = $t.UniqueID
            TaskName                = $t.Name
            WBS                     = $t.WBS
            Phase                   = ""
            Disciplines             = ""
            IsSummary               = [bool]$t.Summary
            IsMilestone             = [bool]$t.Milestone
            WeightPercent           = $weight
            PlannedWeight           = [math]::Round($weight * $plannedFraction, 6)
            ActualWeight            = [math]::Round($weight * $actualFraction, 6)
            Start                   = $t.Start
            Finish                  = $t.Finish
            PhysicalPercentComplete = $actualFraction
            PlannedPercent          = $plannedFraction
            ActualPercent           = $actualFraction
            Critical                = [bool]$t.Critical
            StatusDate              = $statusDate
        })
        if ($t.WBS) { $byWbs[$t.WBS] = $rows[$rows.Count - 1] }
    }

    # Fill Phase / Disciplines from the WBS hierarchy (L1 phase, L2 discipline).
    foreach ($r in $rows) {
        if (-not $r.WBS) { continue }
        $parts = $r.WBS.Split('.')
        if ($byWbs.ContainsKey($parts[0])) {
            $r.Phase = $byWbs[$parts[0]].TaskName
            if ($parts.Count -ge 2) {
                $key2 = ($parts[0..1] -join '.')
                if ($byWbs.ContainsKey($key2)) { $r.Disciplines = $byWbs[$key2].TaskName }
            }
        }
    }

    # Export leaves and milestones (the model derives summary progress by weights).
    $export = @($rows | Where-Object { -not $_.IsSummary -or $_.IsMilestone })
    Write-CsvAtomic -Rows $export -Path (Join-Path $OutDir "tasks.csv")
    Write-Log ("tasks.csv written: {0} rows (mode={1})." -f $export.Count, $ctx.Mode)

    # In LIVE mode the MPP may have unsaved changes, so wall-clock time is the
    # honest refresh stamp; otherwise stamp with the file's last write time.
    $RefreshedAt = if ($ctx.Mode -eq 'LIVE') { Get-Date } else { (Get-Item $MppPath).LastWriteTime }
    Write-CsvAtomic -Rows @([pscustomobject]@{ RefreshedAt = $RefreshedAt }) -Path (Join-Path $OutDir "project-info.csv")
    Write-Log ("project-info.csv written (MPP last saved " + $mppStamp + ").")

    # Cleanup. PjSaveType: pjDoNotSave = 0 (pjSave = 1, pjPromptSave = 2). MSP
    # recalculates the file's formulas on open, which marks the project dirty;
    # closing without saving prevents an invisible save prompt from blocking Quit().
    if ($ctx.Mode -eq 'DISK') {
        try { $proj.Application.FileClose(0) } catch { try { $app.FileCloseAll(0) } catch {} }
        Start-Sleep -Seconds 2
        try { $app.Quit() } catch {}
        Write-Log "Closed MS Project instance opened by this script (pjDoNotSave)."
    } elseif ($ctx.Mode -eq 'REUSE') {
        try { $proj.Activate() } catch {}
        try { $app.FileClose(0) } catch {}
        Write-Log "Closed the read-only copy in the running MS Project instance."
    }
    Write-Log "=== SYNC OK ==="
    exit 0
} catch {
    Write-Log ("SYNC FAILED: " + $_.Exception.ToString())
    if ($null -ne $ctx) {
        if ($ctx.Mode -eq 'REUSE') {
            try { $ctx.Project.Activate() } catch {}
            try { $ctx.App.FileClose(0) } catch {}
        }
        if ($ctx.Mode -eq 'DISK') {
            try { $ctx.App.FileCloseAll(0) } catch {}
            try { $ctx.App.Quit() } catch {}
        }
    }
    exit 1
}
