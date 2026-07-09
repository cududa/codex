[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$shimBin = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'bin')).Path
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$entries = @()

if (-not [string]::IsNullOrWhiteSpace($userPath)) {
    $entries = $userPath -split ';' |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Where-Object { -not [string]::Equals($_.TrimEnd('\'), $shimBin.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase) }
}

$newPath = (@($shimBin) + $entries) -join ';'
[Environment]::SetEnvironmentVariable('Path', $newPath, 'User')

$processEntries = @()
if (-not [string]::IsNullOrWhiteSpace($env:Path)) {
    $processEntries = $env:Path -split ';' |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Where-Object { -not [string]::Equals($_.TrimEnd('\'), $shimBin.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase) }
}
$env:Path = (@($shimBin) + $processEntries) -join ';'

Write-Host "Prepended build priority shim to user PATH:"
Write-Host "  $shimBin"
Write-Host 'Open a new terminal or Codex session for inherited PATH changes to take effect.'
