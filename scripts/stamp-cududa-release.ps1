param(
    [string]$Remote = "origin",
    [string]$Lockfile = "codex-rs/Cargo.lock",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Run-Git {
    param(
        [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
        [string[]]$GitArgs
    )

    if ($DryRun) {
        Write-Host "git $($GitArgs -join ' ')"
        return
    }

    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE"
    }
}

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    throw "This script must be run from inside a git repository."
}

Set-Location $repoRoot

$remoteUrl = (& git remote get-url --push $Remote).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Could not read push URL for remote '$Remote'."
}

if ($remoteUrl -notmatch "github\.com[:/]cududa/codex(\.git)?$") {
    throw "Refusing to push: '$Remote' points at '$remoteUrl', not cududa/codex."
}

$lockfilePath = Join-Path $repoRoot $Lockfile
if (-not (Test-Path -LiteralPath $lockfilePath)) {
    throw "Could not find lockfile: $Lockfile"
}

$versions = New-Object System.Collections.Generic.List[version]
$currentPackageIsCodex = $false

foreach ($line in Get-Content -LiteralPath $lockfilePath) {
    if ($line -eq "[[package]]") {
        $currentPackageIsCodex = $false
        continue
    }

    if ($line -match '^name = "codex-.+"$') {
        $currentPackageIsCodex = $true
        continue
    }

    if ($currentPackageIsCodex -and $line -match '^version = "([0-9]+\.[0-9]+\.[0-9]+)"$') {
        $versions.Add([version]$Matches[1])
        $currentPackageIsCodex = $false
    }
}

$versions = @($versions | Sort-Object -Descending -Unique)

if ($versions.Count -eq 0) {
    throw "Could not find any package versions in $Lockfile."
}

$version = $versions[0].ToString()
$tag = "cududa-v$version"
$message = "chore: stamp $tag"
$headSubject = (& git log -1 --pretty=format:%s).Trim()
if ($LASTEXITCODE -ne 0) {
    throw "Could not read HEAD commit subject."
}

$status = (& git status --porcelain=v1)
if ($LASTEXITCODE -ne 0) {
    throw "Could not read git status."
}

if ($status -and $headSubject -ne $message) {
    throw "Refusing to stamp with a dirty working tree. Commit or stash changes first."
}
elseif ($status) {
    Write-Host "Working tree is dirty, but HEAD is already '$message'; continuing recovery."
}

& git rev-parse --verify --quiet "refs/tags/$tag" *> $null
if ($LASTEXITCODE -eq 0) {
    throw "Tag '$tag' already exists locally."
}

& git ls-remote --exit-code --tags $Remote "refs/tags/$tag" *> $null
if ($LASTEXITCODE -eq 0) {
    throw "Tag '$tag' already exists on '$Remote'."
}
elseif ($LASTEXITCODE -ne 2) {
    throw "Could not check whether '$tag' exists on '$Remote'."
}

Write-Host "Stamping $tag from $Lockfile version $version"
if ($headSubject -eq $message) {
    Write-Host "HEAD is already '$message'; reusing it."
}
else {
    Run-Git commit --allow-empty -m $message
}
Run-Git tag -a $tag -m $tag
Run-Git push $Remote HEAD
Run-Git push $Remote $tag
