# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.MCDM_COMPILER
# TAG: REAL_MIT_KMD_SOURCE_VS_WDK_COMPILATION_NO_INSTALL_V1
# WHO: Owner-authorized LeeWay driver engineering.
# WHAT: Compile 2 actual Microsoft kernel source translation units to .obj only.
# WHY: Establish a working WDK kernel compiler route independent of missing VS WDK targets.
# WHEN: 2026-10-24. WHERE: native/windows/mcdm.
# HOW: MSVC /kernel /c with installed WDK KM headers, source pinned by integrity tests.
# AUTHORITY: COMPILE_ONLY; no .sys, linking, INF, signature, registry or PnP action.
# LICENSE: First-party build logic; original Microsoft's MIT source remains unchanged.
[CmdletBinding()]
param([string]$OutputDirectory = (Join-Path $env:TEMP 'leeway-mcdm-real-kernel-objects'))
$ErrorActionPreference='Stop'
$source=Join-Path $PSScriptRoot '..\..\..\third_party\microsoft-graphics-driver-samples\compute-only-sample'
$source=(Resolve-Path $source).Path
$kitRoot=Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\Include'
$kits=@(Get-ChildItem $kitRoot -Directory -ErrorAction Stop | Where-Object {$_.Name -match '^10\.\d+\.\d+\.\d+$'} | Sort-Object {[version]$_.Name} -Descending)
if(!$kits){throw 'LEEWAY_WDK_KERNEL_INCLUDE_MISSING'}
$kit=$kits[0].FullName
$vswhere=Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if(!(Test-Path $vswhere)){throw 'LEEWAY_VISUAL_STUDIO_DISCOVERY_MISSING'}
$vs=(& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1)
if(!$vs){throw 'LEEWAY_MSVC_COMPILER_MISSING'}
$vcvars=Join-Path $vs 'VC\Auxiliary\Build\vcvars64.bat'
if(!(Test-Path $vcvars)){throw 'LEEWAY_MSVC_X64_ENVIRONMENT_MISSING'}
New-Item -ItemType Directory -Force -Path $OutputDirectory |Out-Null
$files=@('CosKmdMetaCommand.cpp','CosKmdLogging.cpp')
$objs=@()
foreach($name in $files){
  $src=Join-Path (Join-Path $source 'coskmd') $name
  if(!(Test-Path $src)){throw ('SOURCE_MISSING: '+$name)}
  $dest=Join-Path $OutputDirectory ([IO.Path]::GetFileNameWithoutExtension($name)+'.obj')
  $includes=@("$kit\km","$kit\shared","$kit\um","$source\coscommon","$source\vpucommon","$source\coskmd")
  $incArgs=($includes|ForEach-Object {'/I"'+$_+'"'}) -join ' '
  $cmd='"'+$vcvars+'" >NUL && cl /nologo /c /TP /W3 /kernel /Zl /D_AMD64_ /DAMD64 /D_WIN32_WINNT=0x0A00 /DNTDDI_VERSION=0x0A000000 '+$incArgs+' /Fo"'+$dest+'" "'+$src+'"'
  & cmd.exe /d /s /c $cmd
  if($LASTEXITCODE -ne 0 -or !(Test-Path $dest)){throw ('LEEWAY_REAL_KMD_SOURCE_COMPILE_FAILED: '+$name)}
  $sha=[Security.Cryptography.SHA256]::Create()
  try{
    $hash=[BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($dest))).Replace('-','').ToLowerInvariant()
  } finally {$sha.Dispose()}
  Write-Output ('LEEWAY_MCDM_KMD_OBJECT_COMPILE_PASS source='+$name+' sha256='+$hash)
  $objs+= $dest
}
if($objs.Count -ne 2){throw 'KERNEL_OBJECT_COUNT_MISMATCH'}
Write-Output 'LEEWAY_MCDM_COMPILE_ONLY_COMPLETE objects=2 driverLinked=false driverSigned=false driverInstalled=false'
