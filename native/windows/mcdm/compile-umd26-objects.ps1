# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.WINDOWS.MCDM_D3D12_USER_MODE
# TAG: LEEWAY_MCDM_UMD_26_REAL_OBJECTS_V1
# WHO: Creator-authorized LeeWay engineering.
# WHAT: Compile every original Microsoft D3D12 software compute UMD module.
# WHEN: 2026-10-24. WHERE: native/windows/mcdm.
# WHY: Verify all driver translation units, not only a harmless entry-point stub.
# HOW: Installed MSVC /c, WDK/SDK headers and original sample include tree.
# AUTHORITY: COMPILE_ONLY, not an installed device, vendor shader replacement or product.
# LICENSE: LeeWay build harness; unmodified upstream source retains MIT license.
[CmdletBinding()]
param([string]$OutputDirectory=(Join-Path $env:TEMP 'leeway-mcdm-umd26-objects'))
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../../../third_party/microsoft-graphics-driver-samples/compute-only-sample')).Path
$kitRoot=Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10/Include'
$kitDir=Get-ChildItem $kitRoot -Directory|Where-Object {$_.Name -match '^10\.\d+\.\d+\.\d+$'}|
 Sort-Object {[version]$_.Name} -Descending|Select-Object -First 1
if(!$kitDir){throw 'LEEWAY_UMD_SDK_MISSING'}
$kit=$kitDir.FullName
$vswhere=Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
$vs=(& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath|Select-Object -First 1)
if(!$vs){throw 'LEEWAY_UMD_MSVC_MISSING'}
$vcvars=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
$files=@(Get-ChildItem (Join-Path $root 'cosumd12') -Filter '*.cpp' -File|Sort-Object Name)
if($files.Count -ne 26){throw ("LEEWAY_UMD_ORIGINAL_SOURCE_COUNT_CHANGED: "+$files.Count)}
New-Item -ItemType Directory -Path $OutputDirectory -Force|Out-Null
$includes=@("$kit/um","$kit/shared","$kit/ucrt","$root/coscommon","$root/vpucommon","$root/cosumd12")
$inc=($includes|ForEach-Object {' /I"'+$_+'"'})-join''
$count=0
foreach($f in $files){
 $dest=Join-Path $OutputDirectory ($f.BaseName+'.obj')
 $cmd='"'+$vcvars+'" >NUL && cl /nologo /c /TP /W3 /EHsc /DWIN32 /D_WIN32_WINNT=0x0A00 /DNTDDI_VERSION=0x0A000000'+$inc+' /Fo"'+$dest+'" "'+$f.FullName+'"'
 & cmd.exe /d /s /c $cmd
 if($LASTEXITCODE -ne 0 -or !(Test-Path $dest)){throw ('LEEWAY_UMD_ORIGINAL_SOURCE_COMPILE_FAILED: '+$f.Name)}
 $count++
 Write-Output ('LEEWAY_D3D12_UMD_OBJECT_PASS: '+$f.Name)
}
if($count -ne 26){throw 'LEEWAY_UMD_COMPILATION_COUNT_MISMATCH'}
Write-Output 'LEEWAY_UMD_26_OBJECTS_PASS objects=26 linked=false signed=false installed=false shaderCompilerUnbound=true'
