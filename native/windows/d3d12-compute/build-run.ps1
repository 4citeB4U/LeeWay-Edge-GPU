param(
    [string]$EvidenceDirectory = '',
    [ValidateRange(1, 1048576)]
    [int]$ElementCount = 262144,
    [uint32]$Seed = 1013904223
)
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$sourcePath = Join-Path $PSScriptRoot 'prototype.cpp'
if (-not $EvidenceDirectory) { $EvidenceDirectory = Join-Path $repoRoot 'evidence-staging\native-gpu-readiness-g18\d3d12-compute' }
$EvidenceDirectory = [IO.Path]::GetFullPath($EvidenceDirectory)
[IO.Directory]::CreateDirectory($EvidenceDirectory) | Out-Null

$vswhere = 'C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe'
if (-not (Test-Path $vswhere)) { throw 'VSWHERE_NOT_FOUND' }
$vsPath = (& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1)
if (-not $vsPath) { throw 'MSVC_X64_TOOLSET_NOT_FOUND' }
$msvcVersion = Get-ChildItem (Join-Path $vsPath 'VC\Tools\MSVC') -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $msvcVersion) { throw 'MSVC_TOOLSET_DIRECTORY_NOT_FOUND' }
$compiler = Join-Path $msvcVersion.FullName 'bin\Hostx64\x64\cl.exe'
$kitsRoot = 'C:\Program Files (x86)\Windows Kits\10'
$includeRoot = Join-Path $kitsRoot 'Include'
$kit = Get-ChildItem $includeRoot -Directory |
    Where-Object { $_.Name -match '^\d+(\.\d+){3}$' } |
    Sort-Object { [version]$_.Name } -Descending |
    Select-Object -First 1
if (-not $kit) { throw 'WINDOWS_SDK_INCLUDE_NOT_FOUND' }
$libRoot = Join-Path (Join-Path $kitsRoot 'Lib') $kit.Name
$requiredLibraries = @(
    (Join-Path (Join-Path $libRoot 'um\x64') 'd3d12.lib'),
    (Join-Path (Join-Path $libRoot 'um\x64') 'dxgi.lib'),
    (Join-Path (Join-Path $libRoot 'um\x64') 'd3dcompiler.lib'),
    (Join-Path (Join-Path $libRoot 'ucrt\x64') 'ucrt.lib')
)
foreach ($required in $requiredLibraries) { if (-not (Test-Path $required)) { throw "SDK_LIBRARY_MISSING: $required" } }
foreach ($include in @('shared','ucrt','um','winrt')) {
    if (-not (Test-Path (Join-Path $kit.FullName $include))) { throw "SDK_INCLUDE_MISSING: $include" }
}
if (-not (Test-Path $compiler)) { throw 'MSVC_COMPILER_NOT_FOUND' }

$exePath = Join-Path $EvidenceDirectory 'leeway-d3d12-compute-prototype.exe'
$objPath = Join-Path $EvidenceDirectory 'prototype.obj'
$buildLogPath = Join-Path $EvidenceDirectory 'build.log'
$runtimeLogPath = Join-Path $EvidenceDirectory 'runtime.jsonl'
$evidencePath = Join-Path $EvidenceDirectory 'd3d12-compute-evidence.json'
$includes = @(
    (Join-Path $msvcVersion.FullName 'include'),
    (Join-Path $kit.FullName 'shared'),
    (Join-Path $kit.FullName 'ucrt'),
    (Join-Path $kit.FullName 'um'),
    (Join-Path $kit.FullName 'winrt')
)
$libraries = @(
    (Join-Path $msvcVersion.FullName 'lib\x64'),
    (Join-Path $libRoot 'um\x64'),
    (Join-Path $libRoot 'ucrt\x64')
)
$compilerArgs = @('/nologo','/std:c++17','/EHsc','/O2','/W4','/DUNICODE','/D_UNICODE',"/Fo$objPath",("/Fe:" + $exePath))
foreach ($include in $includes) { $compilerArgs += "/I$include" }
$compilerArgs += $sourcePath
$compilerArgs += '/link'
foreach ($libraryPath in $libraries) { $compilerArgs += "/LIBPATH:$libraryPath" }
$compilerArgs += @('d3d12.lib','dxgi.lib','d3dcompiler.lib')

$buildOutput = @(& $compiler @compilerArgs 2>&1 | ForEach-Object { $_.ToString() })
$buildExitCode = $LASTEXITCODE
[IO.File]::WriteAllText($buildLogPath, ($buildOutput -join [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
if ($buildExitCode -ne 0) { throw "MSVC_BUILD_FAILED: exit=$buildExitCode; see $buildLogPath" }

$runtimeOutput = @(& $exePath --elements $ElementCount --seed $Seed 2>&1 | ForEach-Object { $_.ToString() })
$runtimeExitCode = $LASTEXITCODE
[IO.File]::WriteAllText($runtimeLogPath, ($runtimeOutput -join [Environment]::NewLine), [Text.UTF8Encoding]::new($false))
$records = @($runtimeOutput | Where-Object { $_.TrimStart().StartsWith('{') } | ForEach-Object { $_ | ConvertFrom-Json })
$summary = $records | Where-Object { $_.summary -eq $true } | Select-Object -Last 1
$adapterResults = @($records | Where-Object { $_.PSObject.Properties.Name -contains 'adapterName' })
$sourceHash = (Get-FileHash $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
$exeHash = (Get-FileHash $exePath -Algorithm SHA256).Hash.ToLowerInvariant()
$evidence = [ordered]@{
    schema = 'leeway.gpu.d3d12.compute-prototype-evidence.v1'
    observedAt = [DateTime]::UtcNow.ToString('o')
    workload = [ordered]@{ operation = 'AFFINE_U32_V1'; elementCount = $ElementCount; seed = [uint32]$Seed }
    platform = [ordered]@{ caption = (Get-CimInstance Win32_OperatingSystem).Caption; build = (Get-CimInstance Win32_OperatingSystem).BuildNumber; architecture = 'x64' }
    build = [ordered]@{ compiler = $compiler; compilerVersion = (Get-Item $compiler).VersionInfo.FileVersion; visualStudio = $vsPath; windowsSdk = $kit.Name; command = 'MSVC direct invocation; exact argument vector follows'; commandArgv = @($compilerArgs); runner = $PSCommandPath; runnerSha256 = (Get-FileHash $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant(); exitCode = $buildExitCode; log = $buildLogPath }
    source = [ordered]@{ path = $sourcePath; sha256 = $sourceHash }
    executable = [ordered]@{ path = $exePath; sha256 = $exeHash }
    execution = [ordered]@{ api = 'D3D12'; runtimeLog = $runtimeLogPath; exitCode = $runtimeExitCode; physicalAdapterResults = $adapterResults; summary = $summary; leeWayMode = 'UNQUALIFIED_PROVIDER_PROTOTYPE'; runtimeFabricAuthorized = $false; leeWayOsNativeGpu = $false; cpuFallback = $false }
    qualification = if ($runtimeExitCode -eq 0 -and $summary -and $summary.hardwareAdapters -gt 0 -and $summary.passed -eq $summary.hardwareAdapters) { 'PASS_PHYSICAL_GPU_DISPATCH_AND_READBACK' } else { 'FAIL_OR_NO_QUALIFIED_HARDWARE_ADAPTER' }
}
$json = $evidence | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($evidencePath, $json, [Text.UTF8Encoding]::new($false))
$evidenceHash = (Get-FileHash $evidencePath -Algorithm SHA256).Hash.ToLowerInvariant()
[pscustomobject]@{ qualification = $evidence.qualification; workload = $evidence.workload; adapters = $adapterResults.Count; evidence = $evidencePath; evidenceSha256 = $evidenceHash; sourceSha256 = $sourceHash; executableSha256 = $exeHash; runtimeExitCode = $runtimeExitCode } | ConvertTo-Json -Compress
if ($evidence.qualification -ne 'PASS_PHYSICAL_GPU_DISPATCH_AND_READBACK') { exit 3 }
