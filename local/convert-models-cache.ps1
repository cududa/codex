param(
    [Parameter()]
    [string] $InputPath = (Join-Path $env:USERPROFILE ".codex\models_cache.json"),

    [Parameter()]
    [string] $OutputPath = (Join-Path $env:USERPROFILE ".codex\models_catalog.json")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputPath)) {
    throw "Models cache not found: $InputPath"
}

$cache = Get-Content -LiteralPath $InputPath -Raw | ConvertFrom-Json

if (-not ($cache.PSObject.Properties.Name -contains "models")) {
    throw "Input file does not contain a top-level 'models' property: $InputPath"
}

$models = @($cache.models)
if ($models.Count -eq 0) {
    throw "Input file contains an empty 'models' array: $InputPath"
}

$catalog = [ordered]@{
    models = $models
}

$parent = Split-Path -Parent $OutputPath
if ($parent) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
}

$json = $catalog | ConvertTo-Json -Depth 100
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutputPath, $json, $utf8NoBom)

Write-Output "Wrote ModelsResponse catalog with $($models.Count) model(s): $OutputPath"
