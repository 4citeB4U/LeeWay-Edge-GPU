# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.WINDOWS.MCDM_REAL_KERNEL_BUILD
# TAG: LEEWAY_ORIGINAL_WDDM_KMD_ELEVEN_SOURCE_WPP_OBJECTS_V1
# WHO: Creator-authorized LeeWay Windows engineering.
# WHAT: Compile all eleven original Microsoft MCDM kernel translation units.
# WHY: Establish complete source compile before an authentic kernel link.
# WHERE: native/windows/mcdm. WHEN: 2026-10-24.
# HOW: WDK TraceWPP generated trace headers + reviewed ETW/WPP compatibility definitions.
# AUTHORITY: COMPILE_ONLY. No .sys/link/sign/INF/OS GPU installation.
# LICENSE: LeeWay integration; original upstream source retains MIT.
[CmdletBinding()]
param([string]$OutputDirectory=(Join-Path $env:TEMP 'leeway-mcdm-all11-kmd-objects'))
$ErrorActionPreference='Stop'
$srcRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../../third_party/microsoft-graphics-driver-samples/compute-only-sample')).Path
$kitRoot=Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10'
$kitDir=Get-ChildItem (Join-Path $kitRoot 'Include') -Directory|Where-Object {$_.Name -match '^10\.\d+\.\d+\.\d+$'}|
 Sort-Object {[version]$_.Name} -Descending|Select-Object -First 1
if(!$kitDir){throw 'LEEWAY_KMD_WDK_INCLUDE_MISSING'}
$ver=$kitDir.Name;$kit=$kitDir.FullName
$wpp=Join-Path $kitRoot "bin/$ver/x64/tracewpp.exe"
$cfg=Join-Path $kitRoot "bin/$ver/WppConfig/Rev1"
if(!(Test-Path $wpp) -or !(Test-Path $cfg)){throw 'LEEWAY_KMD_WPP_TOOLCHAIN_MISSING'}
$vswhere=Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
$vs=(& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath|Select-Object -First 1)
if(!$vs){throw 'LEEWAY_KERNEL_MSVC_MISSING'}
$vcvars=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
$compat=Join-Path $PSScriptRoot 'trace-compile-compat.h'
if(!(Test-Path $compat)){throw 'LEEWAY_WPP_COMPAT_HEADER_MISSING'}
$units=@(Get-ChildItem (Join-Path $srcRoot 'coskmd') -Filter '*.cpp' -File|Sort-Object Name)
if($units.Count -ne 11){throw ('LEEWAY_MCDM_KMD_SOURCE_COUNT_UNEXPECTED: '+$units.Count)}
New-Item -ItemType Directory -Path $OutputDirectory -Force|Out-Null
$includes=@("$kit/km","$kit/shared","$kit/um","$srcRoot/coscommon","$srcRoot/vpucommon","$srcRoot/coskmd",$OutputDirectory)
$inc=($includes|ForEach-Object{' /I"'+$_+'"'}) -join ''
$common=Join-Path $srcRoot 'coscommon/CosLogging.h'
$count=0
foreach($f in $units){
 if(Select-String -Path $f.FullName -Pattern '#include.*\.tmh' -Quiet){
   & $wpp "-cfgdir:$cfg" '-km' '-DENABLE_WPP_RECORDER=1' '-DWPP_EMIT_FUNC_NAME' "-scan:$common" "-odir:$OutputDirectory" $f.FullName
   if($LASTEXITCODE -ne 0){throw ('LEEWAY_KMD_REAL_WPP_GENERATION_FAILED: '+$f.Name)}
 }
 $obj=Join-Path $OutputDirectory ($f.BaseName+'.obj')
 $cmd='"'+$vcvars+'" >NUL && cl /nologo /c /TP /W3 /kernel /Zl /DWPP_TRACE_OPTIONS=43 /DENABLE_WPP_RECORDER=1 /FI"'+$compat+'" /D_AMD64_ /DAMD64 /D_WIN32_WINNT=0x0A00 /DNTDDI_VERSION=0x0A000000'+$inc+' /Fo"'+$obj+'" "'+$f.FullName+'"'
 & cmd.exe /d /s /c $cmd
 if($LASTEXITCODE -ne 0 -or !(Test-Path $obj)){throw ('LEEWAY_MCDM_KERNEL_OBJECT_FAILED: '+$f.Name)}
 $count++
 Write-Output ('LEEWAY_KMD_ORIGINAL_SOURCE_OBJECT_PASS: '+$f.Name)
}
if($count -ne 11){throw ('LEEWAY_MCDM_COMPLETE_SOURCE_COUNT_MISMATCH: '+$count)}
Write-Output 'LEEWAY_KMD_ELEVEN_OBJECTS_PASS objects=11 linked=false signed=false installed=false'
