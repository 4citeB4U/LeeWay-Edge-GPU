// Read-only Windows native GPU driver toolchain discovery. Checks installed paths as well as PATH.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';

const script = String.raw`
$ErrorActionPreference = 'Stop'
$vswhere = 'C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe'
$vsPath = $null
if (Test-Path $vswhere) {
  $vsPath = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
}
$msvcRoot = if ($vsPath) { Join-Path $vsPath 'VC\Tools\MSVC' } else { $null }
$compiler = if ($msvcRoot -and (Test-Path $msvcRoot)) {
  Get-ChildItem $msvcRoot -Directory | Sort-Object Name -Descending | ForEach-Object {
    $candidate = Join-Path $_.FullName 'bin\Hostx64\x64\cl.exe'
    if (Test-Path $candidate) { Get-Item $candidate }
  } | Select-Object -First 1
} else { $null }
$msbuild = if ($vsPath) { Join-Path $vsPath 'MSBuild\Current\Bin\MSBuild.exe' } else { $null }
$kitsRoots = @('C:\Program Files (x86)\Windows Kits\10','C:\Program Files\Windows Kits\10') | Where-Object { Test-Path $_ }
$infverif = $null; $signtool = $null; $wdmHeader = $null; $wdkTargets = $null
foreach ($root in $kitsRoots) {
  if (-not $infverif) { $infverif = Get-ChildItem (Join-Path $root 'bin') -Filter infverif.exe -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 }
  if (-not $signtool) { $signtool = Get-ChildItem (Join-Path $root 'bin') -Filter signtool.exe -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 }
  if (-not $wdmHeader) { $wdmHeader = Get-ChildItem (Join-Path $root 'Include') -Filter wdm.h -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 }
  if (-not $wdkTargets) { $wdkTargets = Get-ChildItem $root -Include WindowsKernelModeDriver*.props,WindowsKernelModeDriver*.targets -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 }
}
$cmake = Get-Command cmake.exe -ErrorAction SilentlyContinue
$pnputil = Get-Command pnputil.exe -ErrorAction SilentlyContinue
$dotnet = Get-Command dotnet.exe -ErrorAction SilentlyContinue
$tools = @(
  [pscustomobject]@{name='cl.exe';available=[bool]$compiler;path=if($compiler){$compiler.FullName}else{$null};version=if($compiler){$compiler.VersionInfo.FileVersion}else{$null};discovery='Visual Studio instance via vswhere; installed MSVC toolset path'},
  [pscustomobject]@{name='MSBuild.exe';available=[bool]($msbuild -and (Test-Path $msbuild));path=if($msbuild -and (Test-Path $msbuild)){$msbuild}else{$null};version=$null;discovery='Visual Studio instance via vswhere; installed MSBuild path'},
  [pscustomobject]@{name='cmake.exe';available=[bool]$cmake;path=if($cmake){$cmake.Source}else{$null};version=$null;discovery='PATH'},
  [pscustomobject]@{name='infverif.exe';available=[bool]$infverif;path=if($infverif){$infverif.FullName}else{$null};version=if($infverif){$infverif.VersionInfo.FileVersion}else{$null};discovery='Windows Kits bin directories'},
  [pscustomobject]@{name='signtool.exe';available=[bool]$signtool;path=if($signtool){$signtool.FullName}else{$null};version=if($signtool){$signtool.VersionInfo.FileVersion}else{$null};discovery='Windows Kits bin directories'},
  [pscustomobject]@{name='wdm.h';available=[bool]$wdmHeader;path=if($wdmHeader){$wdmHeader.FullName}else{$null};version=$null;discovery='Windows Kits Include directories'},
  [pscustomobject]@{name='WindowsKernelModeDriver targets';available=[bool]$wdkTargets;path=if($wdkTargets){$wdkTargets.FullName}else{$null};version=$null;discovery='Windows Kits installed targets'},
  [pscustomobject]@{name='pnputil.exe';available=[bool]$pnputil;path=if($pnputil){$pnputil.Source}else{$null};version=$null;discovery='PATH'},
  [pscustomobject]@{name='dotnet.exe';available=[bool]$dotnet;path=if($dotnet){$dotnet.Source}else{$null};version=$null;discovery='PATH'}
)
$os = Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture
[pscustomobject]@{visualStudioPath=$vsPath;vswherePath=$vswhere;windowsKitsRoots=$kitsRoots;tools=$tools;os=$os} | ConvertTo-Json -Depth 5 -Compress
`;

const raw = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {encoding:'utf8', timeout:30000});
const info = JSON.parse(raw);
const has = name => info.tools.some(tool => tool.name === name && tool.available);
const result = {
  schema:'leeway.gpu.windows.driver-toolchain-readiness.v2',
  observedAt:new Date().toISOString(),
  os:info.os,
  discovery:{visualStudioPath:info.visualStudioPath,vswherePath:info.vswherePath,windowsKitsRoots:info.windowsKitsRoots,method:'installed locations and PATH; PATH absence alone is not treated as missing'},
  tools:info.tools,
  prerequisites:{msvc:has('cl.exe'),msbuild:has('MSBuild.exe'),wdkInfVerifier:has('infverif.exe'),wdkSigner:has('signtool.exe'),wdkKernelHeader:has('wdm.h'),wdkBuildTargets:has('WindowsKernelModeDriver targets'),deviceInspection:has('pnputil.exe')},
  driverCompilationReady:has('cl.exe') && has('MSBuild.exe') && has('infverif.exe') && has('wdm.h') && has('WindowsKernelModeDriver targets'),
  nextAction:'Acquire and verify the compatible official WDK components if missing; use isolated VM qualification before any host driver installation.',
  noDriverInstallationPerformed:true
};
const output = process.argv[2];
if (!output) throw Error('OUTPUT_PATH_REQUIRED');
fs.writeFileSync(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify({driverCompilationReady:result.driverCompilationReady,prerequisites:result.prerequisites,sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),output}));
