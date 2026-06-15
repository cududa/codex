[CmdletBinding()]
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\codex-rs\target\aarch64-pc-windows-msvc\local-release\codex.exe'),
    [string]$Destination = 'C:\Program Files\CodexPinned\bin\codex.exe',
    [string]$LogDirectory = (Join-Path $env:TEMP 'codex-command-output'),
    [switch]$WaitForRunningCodex
)

$ErrorActionPreference = 'Stop'

$resolvedSource = (Resolve-Path -LiteralPath $Source).Path
$resolvedDestination = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Destination)
$destinationDirectory = Split-Path -Parent $resolvedDestination
$destinationName = Split-Path -Leaf $resolvedDestination

New-Item -ItemType Directory -Force -Path $LogDirectory | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$staged = Join-Path $destinationDirectory "$destinationName.pending-$stamp"
$backup = Join-Path $destinationDirectory "$destinationName.backup-$stamp"
$log = Join-Path $LogDirectory "install-codex-local-release-$stamp.log"

function Write-InstallLog {
    param([Parameter(Mandatory = $true)][string]$Message)
    $line = "$(Get-Date -Format o) $Message"
    Add-Content -LiteralPath $log -Value $line
    Write-Host $Message
}

function Get-RunningDestinationCodex {
    Get-Process -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -eq $resolvedDestination }
}

Write-InstallLog "source: $resolvedSource"
Write-InstallLog "destination: $resolvedDestination"
Write-InstallLog "staged: $staged"
Write-InstallLog "backup: $backup"

Copy-Item -LiteralPath $resolvedSource -Destination $staged -Force

if ($WaitForRunningCodex) {
    while ($true) {
        $running = @(Get-RunningDestinationCodex)
        if ($running.Count -eq 0) {
            break
        }
        Write-InstallLog "waiting for Codex processes to exit: $($running.Id -join ', ')"
        Start-Sleep -Seconds 2
    }
} else {
    $running = @(Get-RunningDestinationCodex)
    if ($running.Count -gt 0) {
        throw "Codex is still running from $resolvedDestination (PIDs: $($running.Id -join ', ')). Re-run with -WaitForRunningCodex or close Codex first."
    }
}

Copy-Item -LiteralPath $resolvedDestination -Destination $backup -Force
Move-Item -LiteralPath $staged -Destination $resolvedDestination -Force

$installed = Get-Item -LiteralPath $resolvedDestination
Write-InstallLog "installed: $($installed.FullName) ($($installed.Length) bytes, $($installed.LastWriteTime))"
Write-InstallLog "previous backup: $backup"
