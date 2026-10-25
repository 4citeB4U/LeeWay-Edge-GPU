# LEEWAY HEADER - DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.WINDOWS.MCDM_LINK
# TAG: LEEWAY_MCDM_UNSIGNED_KERNEL_LINK_V1
# WHO: Owner-authorized LeeWay GPU engineering.
# WHAT: Link exactly 11 existing Microsoft MCDM KMD objects.
# WHY: Prove kernel link while avoiding driver installation.
# WHERE: native/windows/mcdm. WHEN: 2026-10-24.
# HOW: MSVC + WDK native kernel libraries.
# AUTHORITY: LINK_ONLY; no signing, registration, loading or OS mutation.
# LICENSE: LeeWay integration; Microsoft source retains MIT license.
[CmdletBinding()]
param([string]$ObjectDirectory=(Join-Path $env:TEMP 'leeway-mcdm-all11-kmd-objects'),
[string]$OutputDirectory=(Join-Path $env:TEMP 'leeway-mcdm-kernel-link-test'))
$ErrorActionPreference='Stop'
$objects=@(Get-ChildItem $ObjectDirectory -Filter '*.obj' -File)
if($objects.Count -ne 11){throw 'LEEWAY_KMD_REQUIRE_EXACTLY_11_OBJECTS'}
$kitRoot=Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10'
$kit=Get-ChildItem (Join-Path $kitRoot 'Lib') -Directory|Where-Object {$_.Name -match '^10\.\d+\.\d+\.\d+$'}|Sort-Object {[version]$_.Name} -Descending|Select-Object -First 1
if(!$kit){throw 'LEEWAY_WDK_LIBRARIES_MISSING'}
$lib=Join-Path $kit.FullName 'km/x64'
$vswhere=Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
$vs=(& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath|Select-Object -First 1)
if(!$vs){throw 'LEEWAY_MSVC_MISSING'}
$vcvars=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
New-Item -ItemType Directory -Path $OutputDirectory -Force|Out-Null
$out=Join-Path $OutputDirectory 'leeway-mcdm-unsigned-test.sys'
$objectArgs=($objects|ForEach-Object {'"'+$_.FullName+'"'}) -join ' '
$libArgs=(@('ntoskrnl.lib','hal.lib','displib.lib','wpprecorder.lib','libcntpr.lib','BufferOverflowK.lib','ntstrsafe.lib')|ForEach-Object {'"'+(Join-Path $lib $_)+'"'}) -join ' '
$cmd='"'+$vcvars+'" >NUL && link /NOLOGO /DRIVER /SUBSYSTEM:NATIVE /MACHINE:X64 /ENTRY:DriverEntry /OUT:"'+$out+'" '+$objectArgs+' '+$libArgs
& cmd.exe /d /s /c $cmd
if($LASTEXITCODE -ne 0 -or !(Test-Path $out)){throw 'LEEWAY_MCDM_KERNEL_LINK_FAILED'}
$sha=[Security.Cryptography.SHA256]::Create()
$fs=[IO.File]::OpenRead($out)
try{$hash=[BitConverter]::ToString($sha.ComputeHash($fs)).Replace('-','').ToLowerInvariant()}
finally{$fs.Dispose();$sha.Dispose()}
Write-Output ('LEEWAY_KMD_KERNEL_LINK_PASS linked=true signed=false installed=false sha256='+$hash)
