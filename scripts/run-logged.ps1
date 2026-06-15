[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$CommandLine,

    [string]$WorkingDirectory = (Get-Location).Path,

    [string]$LogDirectory = (Join-Path $env:TEMP 'codex-command-output'),

    [string]$Label = 'command',

    [int]$Tail = 40,

    [int]$MaxLineLength = 240,

    [switch]$AlwaysTail
)

$ErrorActionPreference = 'Stop'

$resolvedWorkingDirectory = (Resolve-Path -LiteralPath $WorkingDirectory).Path
New-Item -ItemType Directory -Force -Path $LogDirectory | Out-Null

$safeLabel = $Label -replace '[^A-Za-z0-9_.-]', '-'
if ([string]::IsNullOrWhiteSpace($safeLabel)) {
    $safeLabel = 'command'
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stdout = Join-Path $LogDirectory "$safeLabel-$stamp.stdout.log"
$stderr = Join-Path $LogDirectory "$safeLabel-$stamp.stderr.log"

function Write-LogTail {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [int]$LineCount,

        [Parameter(Mandatory = $true)]
        [int]$LineLength
    )

    Get-Content -LiteralPath $Path -Tail $LineCount | ForEach-Object {
        $line = $_
        if ($line.Length -gt $LineLength) {
            Write-Host "$($line.Substring(0, $LineLength))..."
        } else {
            Write-Host $line
        }
    }
}

$pwsh = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
if (-not $pwsh) {
    $pwsh = (Get-Command powershell -ErrorAction Stop).Source
}

Write-Host "run-logged: $CommandLine"
Write-Host "working directory: $resolvedWorkingDirectory"
Write-Host "stdout log: $stdout"
Write-Host "stderr log: $stderr"

$process = Start-Process `
    -FilePath $pwsh `
    -ArgumentList @('-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $CommandLine) `
    -WorkingDirectory $resolvedWorkingDirectory `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -NoNewWindow `
    -PassThru `
    -Wait

$stdoutInfo = Get-Item -LiteralPath $stdout
$stderrInfo = Get-Item -LiteralPath $stderr

Write-Host "exit code: $($process.ExitCode)"
Write-Host "stdout bytes: $($stdoutInfo.Length)"
Write-Host "stderr bytes: $($stderrInfo.Length)"

if ($AlwaysTail -or $process.ExitCode -ne 0) {
    if ($stdoutInfo.Length -gt 0) {
        Write-Host "stdout tail:"
        Write-LogTail -Path $stdout -LineCount $Tail -LineLength $MaxLineLength
    }

    if ($stderrInfo.Length -gt 0) {
        Write-Host "stderr tail:"
        Write-LogTail -Path $stderr -LineCount $Tail -LineLength $MaxLineLength
    }
}

exit $process.ExitCode
