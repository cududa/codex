[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$codexRs = Join-Path $RepoRoot 'codex-rs'
if (-not (Test-Path -LiteralPath $codexRs)) {
    throw "Could not find codex-rs at $codexRs"
}

$outDir = Join-Path $env:TEMP 'codex-command-output'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stdout = Join-Path $outDir "cargo-metadata-guard-test-$stamp.stdout.txt"
$stderr = Join-Path $outDir "cargo-metadata-guard-test-$stamp.stderr.txt"

$pwsh = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
if (-not $pwsh) {
    $pwsh = (Get-Command powershell -ErrorAction Stop).Source
}

$command = @"
Set-Location -LiteralPath '$($codexRs.Replace("'", "''"))'
Remove-Item Env:\CODEX_ALLOW_RAW_CARGO_METADATA -ErrorAction SilentlyContinue
cargo metadata --no-deps --format-version 1
"@

& $pwsh -NoLogo -Command $command *> $stdout 2> $stderr
$exitCode = $LASTEXITCODE

$stdoutInfo = Get-Item -LiteralPath $stdout
$stderrInfo = Get-Item -LiteralPath $stderr
$preview = Get-Content -LiteralPath $stdout -Raw

if ($exitCode -ne 0) {
    throw "cargo metadata guard test failed with exit code $exitCode. stdout=$stdout stderr=$stderr"
}

if ($stdoutInfo.Length -gt 4096) {
    throw "cargo metadata guard leaked too much output ($($stdoutInfo.Length) bytes). stdout=$stdout stderr=$stderr"
}

if ($preview -notmatch 'cargo metadata output captured:' -or
    $preview -notmatch 'packages:' -or
    $preview -notmatch 'workspace_root:') {
    throw "cargo metadata guard summary was not detected. stdout=$stdout stderr=$stderr"
}

if ($preview -match '"packages"\s*:' -or $preview -match '"workspace_members"\s*:') {
    throw "cargo metadata guard appears to have leaked raw JSON. stdout=$stdout stderr=$stderr"
}

Write-Host 'cargo metadata guard: PASS'
Write-Host "stdout: $stdout"
Write-Host "stderr: $stderr ($($stderrInfo.Length) bytes)"
