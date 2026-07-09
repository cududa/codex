[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('bazel', 'cargo', 'just', 'rustc', 'rustdoc')]
    [string]$CommandName,

    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArgs
)

$ErrorActionPreference = 'Stop'

function ConvertFrom-WindowsCommandLine {
    param([AllowNull()] [string]$CommandLine)

    if ([string]::IsNullOrEmpty($CommandLine)) {
        return @()
    }

    if (-not ('CodexBuildPriority.NativeCommandLine' -as [type])) {
        Add-Type @'
namespace CodexBuildPriority {
    using System;
    using System.Runtime.InteropServices;

    public static class NativeCommandLine {
        [DllImport("shell32.dll", SetLastError = true)]
        public static extern IntPtr CommandLineToArgvW(
            [MarshalAs(UnmanagedType.LPWStr)] string lpCmdLine,
            out int pNumArgs);

        [DllImport("kernel32.dll")]
        public static extern IntPtr LocalFree(IntPtr hMem);
    }
}
'@
    }

    $argumentCount = 0
    $argv = [CodexBuildPriority.NativeCommandLine]::CommandLineToArgvW($CommandLine, [ref]$argumentCount)
    if ($argv -eq [IntPtr]::Zero) {
        throw "Could not parse command line arguments: $CommandLine"
    }

    try {
        $arguments = [string[]]::new($argumentCount)
        for ($index = 0; $index -lt $argumentCount; $index += 1) {
            $argumentPointer = [System.Runtime.InteropServices.Marshal]::ReadIntPtr($argv, $index * [IntPtr]::Size)
            $arguments[$index] = [System.Runtime.InteropServices.Marshal]::PtrToStringUni($argumentPointer)
        }
        return $arguments
    } finally {
        [void][CodexBuildPriority.NativeCommandLine]::LocalFree($argv)
    }
}

if ($CommandArgs.Count -eq 0 -and $null -ne $env:CODEX_BUILD_PRIORITY_SHIM_ARGS) {
    $CommandArgs = ConvertFrom-WindowsCommandLine $env:CODEX_BUILD_PRIORITY_SHIM_ARGS
}

if ($CommandArgs.Count -gt 0 -and $CommandArgs[0] -eq '--') {
    if ($CommandArgs.Count -eq 1) {
        $CommandArgs = @()
    } else {
        $CommandArgs = $CommandArgs[1..($CommandArgs.Count - 1)]
    }
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
$shimBin = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'bin')).Path
$currentDirectory = (Resolve-Path -LiteralPath (Get-Location)).Path

function Test-IsUnderPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Root
    )

    $normalizedPath = $Path.TrimEnd('\')
    $normalizedRoot = $Root.TrimEnd('\')

    return [string]::Equals($normalizedPath, $normalizedRoot, [StringComparison]::OrdinalIgnoreCase) -or
        $normalizedPath.StartsWith("$normalizedRoot\", [StringComparison]::OrdinalIgnoreCase)
}

function Get-RealCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,

        [Parameter(Mandatory = $true)]
        [string]$ShimDirectory
    )

    if ($Name -eq 'bazel') {
        $pathEntries = $env:Path -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        foreach ($pathEntry in $pathEntries) {
            if (-not (Test-Path -LiteralPath $pathEntry -PathType Container)) {
                continue
            }

            $directory = (Resolve-Path -LiteralPath $pathEntry).Path
            if ([string]::Equals($directory.TrimEnd('\'), $ShimDirectory.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) {
                continue
            }

            foreach ($executableName in @('bazel.exe', 'bazelisk.exe')) {
                $candidate = Join-Path $directory $executableName
                if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                    return $candidate
                }
            }
        }
    }

    $extensions = if ([System.IO.Path]::HasExtension($Name)) {
        @('')
    } elseif ([string]::IsNullOrWhiteSpace($env:PATHEXT)) {
        @('.COM', '.EXE', '.BAT', '.CMD')
    } else {
        $env:PATHEXT -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    }

    $pathEntries = $env:Path -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    foreach ($pathEntry in $pathEntries) {
        if (-not (Test-Path -LiteralPath $pathEntry -PathType Container)) {
            continue
        }

        $directory = (Resolve-Path -LiteralPath $pathEntry).Path
        if ([string]::Equals($directory.TrimEnd('\'), $ShimDirectory.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) {
            continue
        }

        foreach ($extension in $extensions) {
            $candidate = Join-Path $directory "$Name$extension"
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                return $candidate
            }
        }
    }

    throw "Could not find real '$Name' command outside $ShimDirectory"
}

function Start-PriorityWatcher {
    param(
        [Parameter(Mandatory = $true)]
        [int]$ParentProcessId,

        [Parameter(Mandatory = $true)]
        [string]$Priority
    )

    $watcher = @'
param(
    [int]$ParentProcessId,
    [string]$Priority
)

function Get-DescendantProcessIds {
    param([int]$RootProcessId)

    $processes = Get-CimInstance Win32_Process |
        Select-Object ProcessId, ParentProcessId
    $childrenByParent = @{}
    foreach ($process in $processes) {
        $parent = [int]$process.ParentProcessId
        if (-not $childrenByParent.ContainsKey($parent)) {
            $childrenByParent[$parent] = [System.Collections.Generic.List[int]]::new()
        }
        $childrenByParent[$parent].Add([int]$process.ProcessId)
    }

    $descendants = [System.Collections.Generic.List[int]]::new()
    $queue = [System.Collections.Generic.Queue[int]]::new()
    $queue.Enqueue($RootProcessId)

    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        if (-not $childrenByParent.ContainsKey($current)) {
            continue
        }

        foreach ($child in $childrenByParent[$current]) {
            $descendants.Add($child)
            $queue.Enqueue($child)
        }
    }

    return $descendants
}

while (Get-Process -Id $ParentProcessId -ErrorAction SilentlyContinue) {
    try {
        foreach ($processId in Get-DescendantProcessIds -RootProcessId $ParentProcessId) {
            try {
                $process = Get-Process -Id $processId -ErrorAction Stop
                if ($process.PriorityClass -ne $Priority) {
                    $process.PriorityClass = $Priority
                }
            } catch {
            }
        }
    } catch {
    }

    Start-Sleep -Milliseconds 500
}
'@

    $encodedWatcher = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($watcher))
    $powershell = (Get-Command powershell.exe -ErrorAction Stop).Source
    Start-Process `
        -FilePath $powershell `
        -ArgumentList @(
            '-NoLogo',
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-EncodedCommand',
            $encodedWatcher,
            '-ParentProcessId',
            $ParentProcessId,
            '-Priority',
            $Priority
        ) `
        -WindowStyle Hidden | Out-Null
}

function Invoke-RealCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [string[]]$Arguments = @(),

        [AllowNull()]
        [string]$Priority
    )

    if ($Priority) {
        Start-PriorityWatcher -ParentProcessId $PID -Priority $Priority
    }

    & $Path @Arguments
    return $LASTEXITCODE
}

$realCommand = Get-RealCommand -Name $CommandName -ShimDirectory $shimBin
$insideRepo = Test-IsUnderPath -Path $currentDirectory -Root $repoRoot
$requestedPriority = if ([string]::IsNullOrWhiteSpace($env:CODEX_BUILD_PRIORITY)) {
    'AboveNormal'
} else {
    $env:CODEX_BUILD_PRIORITY
}

if (-not $insideRepo -or $requestedPriority -match '^(?i:off|disable|disabled|normal)$') {
    exit (Invoke-RealCommand -Path $realCommand -Arguments $CommandArgs -Priority $null)
}

if ($requestedPriority -notin @('AboveNormal', 'High')) {
    throw "Unsupported CODEX_BUILD_PRIORITY '$requestedPriority'. Use AboveNormal, High, or Off."
}

exit (Invoke-RealCommand -Path $realCommand -Arguments $CommandArgs -Priority $requestedPriority)
