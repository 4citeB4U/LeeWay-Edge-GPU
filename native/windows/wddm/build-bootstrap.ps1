# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.WDDM
# TAG: LEEWAY_WDK_REAL_DDI_COMPILE_ONLY
# WHO: Creator-authorized LeeWay engineering.
# WHAT: Compile typed graphics kernel entrypoint against installed WDK.
# WHY: Prove WDK ABI signatures before a real, reviewed WDDM implementation.
# WHERE: native/windows/wddm. WHEN: 2026-10-24.
# HOW: VS Build Tools + WDK, output only to temp; no kernel-driver deployment.
# AUTHORITY: COMPILE-ONLY. LICENSE: Existing LeeWay terms.
[CmdletBinding()]
param([string] $OutputDirectory = (Join-Path $env:TEMP 'leeway-wddm-bootstrap-build'))
$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot 'leeway-wddm-bootstrap.c'
$kit = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\Include'
$versions = @(Get-ChildItem $kit -Directory -ErrorAction Stop | Where-Object { $_.Name -match '^10\.\d+\.\d+\.\d+$' } | Sort-Object { [version]$_.Name } -Descending)
if (-not $versions) { throw 'LEEWAY_WDK_INCLUDE_MISSING' }
$include = $versions[0].FullName
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if (-not (Test-Path $vswhere)) { throw 'LEEWAY_VSWHERE_MISSING' }
$vs = (& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1)
if (-not $vs) { throw 'LEEWAY_MSVC_TOOLSET_MISSING' }
$vcvars = Join-Path $vs 'VC\Auxiliary\Build\vcvars64.bat'
if (-not (Test-Path $vcvars)) { throw 'LEEWAY_VCVARS_MISSING' }
New-Item -ItemType Directory -Force $OutputDirectory | Out-Null
$out = Join-Path $OutputDirectory 'leeway-wddm-bootstrap.obj'
# This does not link a .sys, register a service, create an INF, or alter signing.
$command = '"' + $vcvars + '" >NUL && cl /nologo /c /TC /W4 /WX /kernel /Zl /D_AMD64_ /DAMD64 /D_WIN32_WINNT=0x0A00 /DNTDDI_VERSION=0x0A000000 /I"' + $include + '\km" /I"' + $include + '\shared" /I"' + $include + '\um" /Fo"' + $out + '" "' + $src + '"'
& cmd.exe /d /s /c $command
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $out)) { throw 'LEEWAY_WDK_BOOTSTRAP_COMPILE_FAILED' }
$sha = [System.Security.Cryptography.SHA256]::Create()
try { $hash = [System.BitConverter]::ToString($sha.ComputeHash([System.IO.File]::ReadAllBytes($out))).Replace('-', '') }
finally { $sha.Dispose() }
Write-Output ('LEEWAY_WDDM_TYPED_BOOTSTRAP_COMPILE_PASS sha256=' + $hash + ' object=' + $out + ' registered=false driverCreated=false')
