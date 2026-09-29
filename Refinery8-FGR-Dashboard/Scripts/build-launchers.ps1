# Builds the two portable launchers with no SDK required:
#   "Launch Offline Dashboard.exe"  (Dashboard.cs) - serves + opens the HTML page
#   "Launch Power BI Report.exe"    (PowerBI.cs)   - fixes the data path, syncs, opens the report
#
# Both link LauncherCommon.cs, which holds the location-independent root finding
# and the Power BI lookup, so that logic exists only once.
#
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File Scripts\build-launchers.ps1 [-OutDir <folder>]
#         -OutDir defaults to the dashboard folder (the parent of Scripts\).
#
# /codepage:65001 is required: the sources contain Persian message text and csc
# would otherwise decode them with the ANSI codepage.
param([string]$OutDir = "")

$ErrorActionPreference = 'Stop'

$here      = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboard = Split-Path -Parent $here
if (-not $OutDir) { $OutDir = $dashboard }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path $csc)) { throw "csc.exe not found - .NET Framework 4.x is required to build." }

$frameworkDir = Split-Path -Parent $csc
$forms  = Join-Path $frameworkDir 'System.Windows.Forms.dll'
if (-not (Test-Path $forms)) { throw "System.Windows.Forms.dll not found next to csc.exe" }
# UIAutomationClient/Types live in the WPF subfolder of the framework directory
$wpfDir = Join-Path $frameworkDir 'WPF'
$uia    = Join-Path $wpfDir 'UIAutomationClient.dll'
if (-not (Test-Path $uia)) { throw "UIAutomationClient.dll not found under $wpfDir" }
$uiat   = Join-Path $wpfDir 'UIAutomationTypes.dll'
if (-not (Test-Path $uiat)) { throw "UIAutomationTypes.dll not found under $wpfDir" }

$common  = Join-Path $here 'LauncherCommon.cs'
$targets = @(
    [pscustomobject]@{ Src = 'Dashboard.cs'; Out = 'Launch Offline Dashboard.exe' },
    [pscustomobject]@{ Src = 'PowerBI.cs';   Out = 'Launch Power BI Report.exe' }
)

foreach ($t in $targets) {
    $src = Join-Path $here $t.Src
    $out = Join-Path $OutDir $t.Out
    & $csc /nologo /target:winexe /optimize+ /platform:anycpu /codepage:65001 "/reference:$forms" "/reference:$uia" "/reference:$uiat" "/out:$out" $src $common
    if ($LASTEXITCODE -ne 0) { throw "compilation failed for $($t.Src) with exit code $LASTEXITCODE" }
    $size = [math]::Round((Get-Item -LiteralPath $out).Length / 1KB, 1)
    Write-Host "Built: $out ($size KB)"
}
