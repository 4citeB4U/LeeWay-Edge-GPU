<#
Fix-ADB-Path PowerShell helper

What it does:
- Searches common Android SDK locations and environment variables for `adb.exe`.
- If found, it prepends the containing `platform-tools` folder to the current PowerShell session PATH.
- If run with `-Persist`, it will also add the path to the user's persistent PATH using `setx`.

Usage:
  .\scripts\fix-adb-path.ps1           # adjust PATH for current session only
  .\scripts\fix-adb-path.ps1 -Persist # also add to user PATH (requires no admin but will affect future sessions)
#>

param(
    [switch]$Persist
)

function Test-AdbPath {
    param([string]$candidate)
    $adb = Join-Path $candidate 'platform-tools\adb.exe'
    if (Test-Path $adb) { return (Get-Item $adb).Directory.FullName }
    return $null
}

$candidates = @()

# Environment variables commonly used
if ($env:ANDROID_SDK_ROOT) { $candidates += $env:ANDROID_SDK_ROOT }
if ($env:ANDROID_HOME) { $candidates += $env:ANDROID_HOME }

# Typical user locations on Windows
$candidates += "$env:LOCALAPPDATA\Android\Sdk"
$candidates += "$env:USERPROFILE\AppData\Local\Android\Sdk"
$candidates += "C:\Android\sdk"
$candidates += "C:\AndroidSDK"

Write-Host "Searching for adb.exe in common Android SDK locations..."

$found = $null
foreach ($c in $candidates | Where-Object { $_ -and ($_ -ne '') } ) {
    try {
        $p = Test-AdbPath -candidate $c
        if ($p) { $found = $p; break }
    } catch { }
}

# Also check if adb is already on PATH
if (-not $found) {
    $which = (Get-Command adb.exe -ErrorAction SilentlyContinue)
    if ($which) {
        $found = (Get-Item $which.Path).Directory.FullName
    }
}

if (-not $found) {
    Write-Host "adb.exe was not found in common locations or on PATH."
    Write-Host "You can install Android platform-tools and re-run this script, or set ANDROID_SDK_ROOT to your SDK path."
    exit 1
}

Write-Host "Found adb in: $found"

# Prepend to current session PATH if not present
if ($env:Path -notlike "*${found}*") {
    $env:Path = "$found;$env:Path"
    Write-Host "Prepended $found to current session PATH."
} else {
    Write-Host "$found is already in PATH."
}

if ($Persist) {
    try {
        # Read current user PATH
        $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($userPath -notlike "*${found}*") {
            $newPath = "$found;$userPath"
            # Use setx to persist to user PATH. setx has a 1024 character limit on older Windows,
            # but for modern Windows it's typically sufficient for typical PATH lengths.
            setx PATH "$newPath" | Out-Null
            Write-Host "Persisted $found to user PATH. Close and reopen shells for changes to take effect."
        } else {
            Write-Host "User PATH already contains $found. No changes made."
        }
    } catch {
        Write-Host "Failed to persist PATH: $_" -ForegroundColor Yellow
        Write-Host "You can add $found to your user PATH manually via System > Environment Variables."
        exit 2
    }
}

Write-Host "Done. Verify by running: adb version"
