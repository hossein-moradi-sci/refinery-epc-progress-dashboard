<#
.SYNOPSIS
  Registers "Sync with MS Project" as an External Tool in Power BI Desktop.

.DESCRIPTION
  Creates Refinery8FGRSync.pbitool.json in Power BI Desktop's documented
  External Tools folder. After a Power BI Desktop restart, a "Sync with
  MS Project" button appears in the External Tools ribbon. Clicking it runs
  the MSP -> CSV sync; then press Refresh in Power BI Desktop to load the
  fresh data.

  This uses Microsoft's documented .pbitool.json mechanism:
  https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-external-tools-register
#>
$ErrorActionPreference = 'Stop'

# Portable: the sync script sits next to this one, wherever the project lives.
$scriptPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "export-msp-data.ps1"
$toolName   = "Sync with MS Project"

# Documented External Tools locations (64-bit preferred)
$folders = @(
    "${env:ProgramFiles(x86)}\Common Files\Microsoft Shared\Power BI Desktop\External Tools",
    "$env:CommonProgramFiles\Microsoft Shared\Power BI Desktop\External Tools"
)

$json = [ordered]@{
    name        = $toolName
    description = "Syncs the project dashboard data with MS Project (run this first, then press Refresh)."
    path        = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    arguments   = ("-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"" + $scriptPath + "`"")
}

$installed = $false
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        try { New-Item -Path $folder -ItemType Directory -Force | Out-Null } catch { continue }
    }
    $file = Join-Path $folder "Refinery8FGRSync.pbitool.json"
    # UTF-8 WITHOUT BOM - a BOM can make strict JSON parsers reject the manifest.
    [IO.File]::WriteAllText($file, ($json | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Registered: $file"
    $installed = $true
    break
}

if (-not $installed) {
    throw "Could not create the External Tools folder."
}

Write-Host ""
Write-Host "Done. Restart Power BI Desktop, then use:"
Write-Host "  External Tools -> 'Sync with MS Project'  ->  Refresh"
