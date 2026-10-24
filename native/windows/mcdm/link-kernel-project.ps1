# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.WINDOWS.MCDM_KMD_LINK
# TAG: LEEWAY_ORIGINAL_MCDM_KERNEL_PROJECT_LINK_CHECK_V1
# WHO: Creator-authorized LeeWay Windows engineering.
# WHAT: Build the vendored Microsoft WDM KMD through its original WDK project.
# WHY: Verify actual kernel-project linking after complete source compilation.
# WHERE: native/windows/mcdm. WHEN: 2026-10-24.
# HOW: MSBuild + installed WDK; output is isolated under TEMP.
# AUTHORITY: BUILD_ONLY. No signing, driver package, registration, or installation.
# LICENSE: LeeWay integration; Microsoft original source retains MIT.
[CmdletBinding()]
param([string]$OutputDirectory=(Join-Path $env:TEMP 'leeway-mcdm-kmd-msbuild-link'))

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$srcRoot = (Resolve-Path (Join-Path $repoRoot 'third_party/microsoft-graphics-driver-samples/compute-only-sample')).Path
$project = Join-Path $srcRoot 'coskmd/CosKmd.vcxproj'
if (-not (Test-Path -LiteralPath $project)) { throw 'LEEWAY_KMD_VENDOR_PROJECT_MISSING' }

$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
if (-not (Test-Path -LiteralPath $vswhere)) { throw 'LEEWAY_KMD_MSBUILD_DISCOVERY_MISSING' }
$vs = (& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1)
if (-not $vs) { throw 'LEEWAY_KMD_MSVC_TOOLCHAIN_MISSING' }
$msbuild = Join-Path $vs 'MSBuild/Current/Bin/MSBuild.exe'
if (-not (Test-Path -LiteralPath $msbuild)) { throw 'LEEWAY_KMD_MSBUILD_MISSING' }

$output = [IO.Path]::GetFullPath($OutputDirectory)
$intermediate = Join-Path $output 'obj'
New-Item -ItemType Directory -Path $output -Force | Out-Null
New-Item -ItemType Directory -Path $intermediate -Force | Out-Null
$outArg = $output.TrimEnd('\') + '\'
$intArg = $intermediate.TrimEnd('\') + '\'
$buildArgs = @(
    $project,
    '/nologo',
    '/m',
    '/t:Rebuild',
    '/p:Configuration=Release',
    '/p:Platform=x64',
    '/p:SignMode=Off',
    '/p:EnableInf2Cat=false',
    '/p:DisableSpecificWarnings=4996',
    ("/p:SolutionDir=$srcRoot/"),
    ("/p:OutDir=$outArg"),
    ("/p:IntDir=$intArg")
)
$previousCl = $env:CL
$env:CL = if ($previousCl) { ($previousCl + ' /DDBG=0').Trim() } else { '/DDBG=0' }
try {
    & $msbuild @buildArgs
    $buildExitCode = $LASTEXITCODE
} finally {
    $env:CL = $previousCl
}
if ($buildExitCode -ne 0) { throw "LEEWAY_KMD_PROJECT_LINK_FAILED: MSBuild exit $buildExitCode" }

$images = @(Get-ChildItem -LiteralPath $output -Filter '*.sys' -File -Recurse)
if ($images.Count -ne 1) { throw "LEEWAY_KMD_IMAGE_COUNT_MISMATCH: expected one unsigned .sys under TEMP, got $($images.Count)" }
$image = $images[0]
$signature = Get-AuthenticodeSignature -LiteralPath $image.FullName
if ($signature.Status -ne 'NotSigned') { throw "LEEWAY_KMD_BUILD_MUST_REMAIN_UNSIGNED: $($signature.Status)" }

$vcTools = Join-Path $vs 'VC/Tools/MSVC'
$vcVersion = Get-ChildItem -LiteralPath $vcTools -Directory | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
if (-not $vcVersion) { throw 'LEEWAY_KMD_DUMPBIN_TOOLSET_MISSING' }
$dumpbin = Join-Path $vcVersion.FullName 'bin/Hostx64/x64/dumpbin.exe'
if (-not (Test-Path -LiteralPath $dumpbin)) { throw 'LEEWAY_KMD_DUMPBIN_MISSING' }
$headers = (& $dumpbin /headers $image.FullName 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0 -or $headers -notmatch '(?i)subsystem\s*\(native\)') {
    throw 'LEEWAY_KMD_IMAGE_IS_NOT_A_NATIVE_KERNEL_IMAGE'
}
$imports = (& $dumpbin /imports $image.FullName 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) { throw 'LEEWAY_KMD_IMPORT_INSPECTION_FAILED' }
if ($imports -match '(?i)(ucrtbase|msvcrt|vcruntime|__stdio_common_vswprintf)') {
    throw 'LEEWAY_KMD_USERMODE_C_RUNTIME_IMPORT_FORBIDDEN'
}

$hash = (Get-FileHash -LiteralPath $image.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
[ordered]@{
    state = 'KMD_LINKED_UNSIGNED_BUILD_ONLY'
    imageName = $image.Name
    sha256 = $hash
    subsystem = 'NATIVE'
    signature = 'NOT_SIGNED'
    installed = $false
    registeredWithWindows = $false
    LeeWayExecutionIntegrated = $false
    outputDirectory = $output
} | ConvertTo-Json -Depth 4
