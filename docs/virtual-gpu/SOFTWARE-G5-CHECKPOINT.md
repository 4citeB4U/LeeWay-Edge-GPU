<!--
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.SOFTWARE_COMPARISON.G5
WHAT: CPU-only application-test checkpoint. WHY: Do not credit hardware or upstream software rendering as a LeeWay speedup.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS VERIFY.
WHERE: Existing GPU benchmark and pinned application worktrees. WHEN: 2026-10-16.
HOW: Actual renderer/backend gates, matched local modes, unchanged quality, output comparisons, source hashes.
LICENSE: MIT
-->
# G5 — CPU/software-only versus the current LeeWay candidate

**CPU-only capability observed; application speedup NOT demonstrated. Maps comparison BLOCKED. C3 OPEN.**

The real Leola Grand Hall rendered at 1280x720/DPR1 using ANGLE/Google/SwiftShader (Subzero). WebGPU requestAdapter returned null. The existing LeeWay dispatcher was set to CPU; 13 actual worker calls and zero WebGPU task calls were observed. SwiftShader is Chromium's software renderer, not a LeeWay-authored renderer. Physical GPUs were not disabled system-wide; only the test application's render/compute backend was software-only. No unsafe SwiftShader opt-in, sandbox bypass, global graphics change, driver change, or remote compute.

Application: leolasliabrary 46e3ab4e9924d9960a4957013fe510a0d6f72c04, 6,160 meshes. Eight alternating windows/four per mode. Existing renderer median per-window rate 0.925926 calls/sec; with unchanged local transform-reuse candidate 0.928836 calls/sec. Median of render-call duration medians 1069.95 versus 1069.40 ms. Only 16 measured calls per mode. ABBA block changes +0.1986% and -0.9945%; no repeatable advantage. Durations/rates are not independent presented-FPS or pure CPU instruction time.

Three snapshot comparisons passed: 3,686,400 RGBA bytes and 105,072 world-matrix values per case with zero differences and matching draw/triangle counts. Nonzero pixel content and same-mode pixel controls checked. This is snapshot evidence only.

Separate application-data computation: 3,202-vertex street mesh, identity world transform, correct CPU result, hash 5c18bc40e589e591ef6e31ab60c870e92385815f52b273b8bbe1d48fc5d12d3d. Native median ~0.132 ms; checked worker roundtrip 4342.3 ms during CPU rendering. The roundtrip includes preparation/messaging/admission/reference/hash and active-render interference, not 4.3 seconds of arithmetic. It remains a poor offload target, not a dense-tensor benchmark. Worker result not substituted into renderer.

Maps source ba492f3f1e9a7b65c04dae28e318495e14775bf3 was attempted at the same fixed Earth view. No rendered globe tiles met the readiness gate within 25 seconds. No valid CPU-only Maps comparison; not a zero-FPS or numerical-failure result. Failed attempt retained; no lower-quality/replacement scene.

## Evidence

Root: E:\LeeWay-Work\gpu-application-benchmark-g3\software-g5

Full summary CPU-only-comparison-results.json SHA256:
429726e34a58c3d8099a7ddf0ce41c8f57765e29e64ed8a8054393e96ef8f304

Compact download CPU-only-download-summary.json SHA256:
73ba02860d29150d14602bec5489d146f3694257a76994577ab2101c6df7ee28

Leola raw runs/run-2026-10-16T08-22-00-289Z/application-results.json SHA256:
ca420a05c5bac6dce75819463a0399ec17a1ef8788bd519a38568add21d081d8

Maps raw runs/run-2026-10-16T08-24-58-684Z/application-results.json SHA256:
93dbf0c58a8b4b88a19aa46133a2720f97513aa204c63cbcca6cff1fea541a87

Owner test script: Invoke-LeeWayCpuComparison.ps1. It validates the source owner/app pins, executes the existing benchmark, checks actual CPU-only execution and rehashes sources. Benchmark scripts gained a software selection mode; compute/reuse source stayed unchanged from G4. Both app worktrees stayed clean. Test-owned browsers/servers closed. No commit/push/deployment.

## Unchanged gates

Full virtual graphics driver not implemented; Formula-directed routing and production LDWMD composition not exercised. Local diagnostic evidence CREATED; canonical C3/Veritas receipt NOT_CREATED; Learning Ledger NOT_UPDATED.

Next: repair the previously isolated asynchronous-completion bottleneck without dropping validation, and repeat the active-rendering comparisons. Do not default-enable the unproven transform-reuse candidate. Maps first needs stable rendered-tile readiness.
