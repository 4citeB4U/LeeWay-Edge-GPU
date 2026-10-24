# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.WINDOWS.MCDM_KERNEL_SOURCE
# TAG: LEEWAY_MCDM_KMD_FIVE_WPP_OBJECTS_V1
# WHO: Creator-authorized LeeWay driver engineering.
# WHAT: Compile five genuine upstream Microsoft KMD sources, with authentic WPP headers.
# WHY: Real kernel-source build progress, not fabricated device registration.
# WHERE: native/windows/mcdm. WHEN: 2026-10-24.
# HOW: WDK TraceWPP, MSVC vcvars64, /kernel /c; objects only.
# AUTHORITY: COMPILE_ONLY. No driver link/sign/install/PNP/boot changes.
# LICENSE: LeeWay integration; original Microsoft MIT source unchanged.
[CmdletBinding()]
param([string]$OutputDirectory=(Join-Path $env:TEMP 'leeway-mcdm-five-kernel-objects'))
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../../../third_party/microsoft-graphics-driver-samples/compute-only-sample')).Path
$kitRoot=Join-Path ${env:ProgramFiles(x86)} 'Windows Kits/10'
$kitDirs=@(Get-ChildItem (Join-Path $kitRoot 'Include') -Directory |
 Where-Object {$_.Name -match '^10\.\d+\.\d+\.\d+$'} |
 Sort-Object {[version]$_.Name} -Descending)
if(!$kitDirs){throw 'LEEWAY_KMD_WDK_NOT_FOUND'}
$ver=$kitDirs[0].Name;$kit=$kitDirs[0].FullName
$wpp=Join-Path $kitRoot "bin/$ver/x64/tracewpp.exe"
$cfg=Join-Path $kitRoot "bin/$ver/WppConfig/Rev1"
if(!(Test-Path $wpp) -or !(Test-Path $cfg)){throw 'LEEWAY_WPP_GENERATOR_MISSING'}
$vswhere=Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
$vs=(& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath|Select-Object -First 1)
if(!$vs){throw 'LEEWAY_MSVC_NOT_FOUND'}
$vcvars=Join-Path $vs 'VC/Auxiliary/Build/vcvars64.bat'
New-Item -ItemType Directory -Force -Path $OutputDirectory|Out-Null
$names=@('CosKmdMetaCommand.cpp','CosKmdLogging.cpp','CosKmdAcpi.cpp','CosKmdDdi.cpp','CosKmdSoftAdapter.cpp')
$included=@("$kit/km","$kit/shared","$kit/um","$root/coscommon","$root/vpucommon","$root/coskmd",$OutputDirectory)
$incArgs=($included|ForEach-Object {' /I"'+$_+'"'})-join''
$count=0
foreach($name in $names){
 $source=Join-Path $root "coskmd/$name"
 if(!(Test-Path $source)){throw "LEEWAY_KMD_SOURCE_MISSING: $name"}
 if(Select-String -Path $source -Pattern '#include.*\.tmh' -Quiet){
   $log=Join-Path $root 'coscommon/CosLogging.h'
   & $wpp "-cfgdir:$cfg" '-km' "-scan:$log" "-odir:$OutputDirectory" $source
   if($LASTEXITCODE -ne 0){throw "LEEWAY_KMD_WPP_FAILED: $name"}
 }
 $target=Join-Path $OutputDirectory ([IO.Path]::GetFileNameWithoutExtension($name)+'.obj')
 $cmd='"'+$vcvars+'" >NUL && cl /nologo /c /TP /W3 /kernel /Zl /DWPP_TRACE_OPTIONS=43 /D_AMD64_ /DAMD64 /D_WIN32_WINNT=0x0A00 /DNTDDI_VERSION=0x0A000000'+$incArgs+' /Fo"'+$target+'" "'+$source+'"'
 & cmd.exe /d /s /c $cmd
 if($LASTEXITCODE -ne 0 -or !(Test-Path $target)){throw "LEEWAY_KMD_OBJECT_BUILD_FAILED: $name"}
 $count++
 Write-Output ("LEEWAY_KMD_OBJECT_PASS: "+$name)
}
if($count -ne 5){throw 'LEEWAY_KMD_OBJECT_COUNT_MISMATCH'}
Write-Output 'LEEWAY_KMD_FIVE_OBJECTS_PASS objects=5 linked=false signed=false installed=false'
