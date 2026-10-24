param(
    [string]$EvidenceDirectory = ''
)
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$buildRunner = Join-Path $PSScriptRoot 'build-run.ps1'
$sourcePath = Join-Path $PSScriptRoot 'prototype.cpp'
if (-not $EvidenceDirectory) {
    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
    $EvidenceDirectory = Join-Path $repoRoot (Join-Path 'evidence-staging\native-gpu-readiness-g20' ('workload-matrix-' + $stamp))
}
$EvidenceDirectory = [IO.Path]::GetFullPath($EvidenceDirectory)
[IO.Directory]::CreateDirectory($EvidenceDirectory) | Out-Null
$reportPath = Join-Path $EvidenceDirectory 'd3d12-workload-matrix.json'
$sourceHashBefore = (Get-FileHash $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
$workloads = @(
    [pscustomobject]@{ elements = 1; seed = [uint32]0 },
    [pscustomobject]@{ elements = 4097; seed = [uint32]42 },
    [pscustomobject]@{ elements = 262144; seed = [uint32]1013904223 },
    [pscustomobject]@{ elements = 1048576; seed = [uint32]20261021 }
)
$runs = [Collections.Generic.List[object]]::new()
$invalidInputs = [Collections.Generic.List[object]]::new()
$lastExecutable = $null
$expectedAdapters = @('NVIDIA GeForce RTX 5060 Laptop GPU', 'Intel(R) Graphics')

foreach ($workload in $workloads) {
    $attempt = Join-Path $EvidenceDirectory ('elements-' + $workload.elements + '-seed-' + $workload.seed)
    $runnerResult = & $buildRunner -EvidenceDirectory $attempt -ElementCount $workload.elements -Seed $workload.seed | ConvertFrom-Json
    $evidenceFile = Join-Path $attempt 'd3d12-compute-evidence.json'
    $evidence = Get-Content -Raw $evidenceFile | ConvertFrom-Json
    if ($runnerResult.qualification -ne 'PASS_PHYSICAL_GPU_DISPATCH_AND_READBACK') { throw ('WORKLOAD_RUN_FAILED: ' + $workload.elements) }
    if ($evidence.workload.elementCount -ne $workload.elements -or $evidence.workload.seed -ne $workload.seed) {
        throw ('WORKLOAD_EVIDENCE_BINDING_MISMATCH: ' + $workload.elements)
    }
    $summary = $evidence.execution.summary
    $adapterResults = @($evidence.execution.physicalAdapterResults)
    if (-not $summary -or $summary.hardwareAdapters -ne 2 -or $summary.passed -ne 2 -or $summary.failed -ne 0) {
        throw ('PHYSICAL_ADAPTER_SUMMARY_FAILED: ' + $workload.elements)
    }
    foreach ($requiredAdapter in $expectedAdapters) {
        if (-not ($adapterResults | Where-Object { $_.adapterName -eq $requiredAdapter -and $_.status -eq 'PASS' -and $_.readbackMatchesReference -eq $true })) {
            throw ('EXPECTED_PHYSICAL_ADAPTER_NOT_VERIFIED: ' + $requiredAdapter + ' / elements=' + $workload.elements)
        }
    }
    $lastExecutable = $evidence.executable.path
    $runs.Add([pscustomobject]@{
        elements = $workload.elements
        seed = $workload.seed
        adapterCount = $adapterResults.Count
        adapters = @($adapterResults | ForEach-Object {
            [pscustomobject]@{ name = $_.adapterName; api = $_.api; elementsWritten = $_.elementsWritten; mismatches = $_.mismatchCount; status = $_.status; softwareAdapter = $_.softwareAdapter }
        })
        evidencePath = $evidenceFile
        evidenceSha256 = $runnerResult.evidenceSha256
        executableSha256 = $runnerResult.executableSha256
    })
}

$invalidCases = @(
    [pscustomobject]@{ name = 'zero-elements'; arguments = @('--elements', '0', '--seed', '1') },
    [pscustomobject]@{ name = 'above-max-elements'; arguments = @('--elements', '1048577', '--seed', '1') },
    [pscustomobject]@{ name = 'unknown-argument'; arguments = @('--dispatch-anything') }
)
foreach ($case in $invalidCases) {
    $invalidArgs = $case.arguments
    $output = @(& $lastExecutable @invalidArgs 2>&1 | ForEach-Object { $_.ToString() })
    $exitCode = $LASTEXITCODE
    $combined = $output -join [Environment]::NewLine
    $passed = $exitCode -eq 2 -and $combined -match 'D3D12_WORKLOAD_INVALID' -and $combined -notmatch '"adapterName"|"summary"'
    if (-not $passed) { throw ('INVALID_WORKLOAD_WAS_NOT_FAIL_CLOSED: ' + $case.name + ' exit=' + $exitCode) }
    $invalidInputs.Add([pscustomobject]@{ name = $case.name; exitCode = $exitCode; dispatchStarted = $false; status = 'PASS_REJECTED_BEFORE_GPU_ENUMERATION' })
}

$sourceHashAfter = (Get-FileHash $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($sourceHashBefore -ne $sourceHashAfter) { throw 'SOURCE_CHANGED_DURING_QUALIFICATION' }
$report = [ordered]@{
    schema = 'leeway.gpu.d3d12.workload-matrix.v1'
    observedAt = [DateTime]::UtcNow.ToString('o')
    source = [ordered]@{ path = $sourcePath; sha256 = $sourceHashAfter }
    runnerSha256 = (Get-FileHash $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant()
    operation = 'AFFINE_U32_V1'
    workloadCount = $runs.Count
    physicalAdapterCount = 2
    runs = @($runs)
    invalidInputTests = @($invalidInputs)
    scope = 'Direct D3D12 compute dispatch/readback on enumerated existing physical adapters; not LeeWay Runtime Fabric admission, model inference, OS-native LeeWay adapter, Veritas acceptance, or production service readiness.'
    runtimeFabricAuthorized = $false
    modelInferenceExecuted = $false
    leeWayOsNativeGpu = $false
    canonicalVeritasReceipt = 'NOT_CREATED'
    learningLedger = 'NOT_UPDATED'
    outcome = 'PASS_PHYSICAL_GPU_WORKLOAD_VARIANTS'
}
[IO.File]::WriteAllText($reportPath, ($report | ConvertTo-Json -Depth 9), [Text.UTF8Encoding]::new($false))
$reportHash = (Get-FileHash $reportPath -Algorithm SHA256).Hash.ToLowerInvariant()
[pscustomobject]@{ outcome = $report.outcome; workloadCount = $report.workloadCount; adapters = $report.physicalAdapterCount; invalidInputTests = $invalidInputs.Count; report = $reportPath; sha256 = $reportHash; sourceSha256 = $sourceHashAfter } | ConvertTo-Json -Compress
