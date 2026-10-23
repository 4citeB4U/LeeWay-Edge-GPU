<!--
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.APPLICATION_COMPARISON.G3
WHAT: Actual application-test checkpoint, including negative outcomes.
WHY: Do not promote tensor correctness into application-speedup claims.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS VERIFY.
WHERE: Existing GPU candidate; actual app worktrees, not substitute scenes.
WHEN: 2026-10-16. HOW: Pinned source, matched local conditions, pixel/matrix comparisons, preserved raw reports.
LICENSE: MIT
-->
# G3 — real application comparison

**Verdict: APPLICATION SPEEDUP NOT DEMONSTRATED. C3 remains OPEN.**

Local benchmark root: `E:\LeeWay-Work\gpu-application-benchmark-g3`.

## Actual source and runtime

- Leola: `4citeB4U/leolasliabrary` at `46e3ab4e9924d9960a4957013fe510a0d6f72c04`.
- Maps: `4citeB4U/Leeway-Maps` at `ba492f3f1e9a7b65c04dae28e318495e14775bf3`.
- Headful Chrome 155, 1280x720, DPR1, Intel Graphics / Xe-LPG; native rendering remained enabled. No NVIDIA execution claim.
- Both detached application worktrees have no tracked modifications. Published applications, system drivers and production Runtime Fabric were not changed.

## Leola Grand Hall

Used the actual onboarding/Grand Hall navigation. Scene: 6,160 meshes. Roughly 4,600 draw calls were observed in the measured interior frames.

A local reversible exact-transform reuse candidate was installed in the real render call. Three synchronous cases (current state, changed boat, changed camera) matched 3,686,400 RGBA bytes and 105,072 world-matrix values per case, with nonzero pixels and matching draw/triangle counts. This is bounded snapshot evidence, not universal correctness.

Eight alternating windows, four per mode: median per-window render-call rates 23.9117 baseline vs 23.9749 candidate; median of render-call duration medians 41.4 vs 41.5 ms. ABBA block changes -1.497% and +2.225%, opposite signs. No consistent improvement. These are main-thread call wall durations and render-call rates, NOT device GPU time or presented FPS.

The separate 3,202-vertex street tensor-fit test was mathematically correct but its world transform proved to be identity. Native approximately 0.108 ms vs checked GPU roundtrip 342.7 ms. Do not offload this no-op. This is not a dense-tensor throughput comparison or a claim about general GPU performance.

## Maps

Final valid baseline used the actual keyless globe at fixed Milwaukee Earth view, after correcting the test server's Cesium asset-root and the initial camera view. Failed zero-render attempts were excluded.

110 tile-boundary/centre points from 22 actual rendered tiles: native transform approximately 0.004 ms vs checked GPU roundtrip 17.2 ms. Maximum absolute error against native double arithmetic 0.718586 metres. Failed the 0.01-metre DIAGNOSTIC target (not an existing product SLA). The candidate result was not fed to the renderer. Live Logistics/traffic/provider stress remains untested.

## Scope and decisions

The GPU roundtrip includes preparation, copies, admission, upload, dispatch, readback, comparison and hashing; it is not kernel-only time. Native timing close to browser resolution must not become a general speed ratio.

Do not default-enable the candidate as an accelerator. No full Formula/LDWMD/Cesium/Three.js composition, production memory binding, native driver, enterprise fallback, or NVIDIA superiority was tested. Formula-directed routing NOT_EXECUTED. Local diagnostic reports exist; canonical Veritas/C3 acceptance NOT_CREATED; Learning Ledger NOT_UPDATED.

## Evidence

`application-comparison-summary.json` SHA256:
`64e42940edffb52c6bbf20c47b6af7014d0e4fe4e69d031cb9a8ce328696d800`

Leola raw `runs/run-2026-10-16T07-19-47-637Z/application-results.json`:
`32f1951bdd938ade44d87b312e00e5f339cd29d2b374bc26c2bcc6826278e77c`

Maps raw `runs/run-2026-10-16T07-16-42-990Z/application-results.json`:
`2a16473372018c164b266fe91417b772fe2ff660ea3fc9abad2141c749428132`

Screenshots are beside each raw report. An export bundle is at `application-evidence-export.json.gz`. All own test browser/server sessions were closed. No source commit, push or deployment occurred. Coordination note: GPU issue #1 comment 6210368825.

## Reproduce and next gate

Host authority script: `Invoke-LeeWayApplicationBenchmark.ps1`. Runner: `tests/virtual-gpu/application-benchmark.mjs --config <verified application-source-observation.json> --app leola|maps`. Summarizer retains exact run identities. Candidate: `core/scene-transform-reuse.mjs` (default off, local experiment).

Next: profile the actual Grand Hall frame to attribute the roughly 41 ms render-call duration before modifying the next bottleneck. Qualify a precision-preserving Maps representation before any coordinate replacement. Preserve current quality, existing renderer, and source authorities. Do not repeat a tensor demo and call it application acceleration.
