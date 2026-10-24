<!--
REGION: LEEWAY.EDGE_GPU.ENGINEERING
TAG: LEEWAY.EDGE_GPU.LOCAL_BUILD_CHECKPOINT.G0
WHAT: Source-grounded local build handoff. WHY: Preserve actual progress without driver/Formula overclaims.
WHO: Creator-authorized Agent Lee. WHERE: Canonical Edge GPU repository. WHEN: 2026-10-15.
HOW: Pinned source, reproduced defects, repaired components, measured tests. LICENSE: MIT
-->
# LeeWay virtual GPU: local G0 checkpoint

## MASTER CHECKPOINT

Goal: a general-purpose virtual graphics/compute device, ultimately with native graphics API and OS driver integration. This step repairs the existing GPU execution foundation. It does **not** deliver an installed virtual GPU card, Vulkan ICD, WDDM driver, or a complete virtual command device.

Canonical source: `4citeB4U/LeeWay-Edge-GPU`.
Baseline: `df5196f15df0843b30e6368724f9cf1756447f9f`.
Local branch: `build/local-virtual-gpu-g0`.
Local host binding: `E:\LeeWay-Work\LeeWay-Edge-GPU`.
Root identity remains repository/authority based, not drive based.

The existing Runtime Fabric remains the owner of production execution. No competing runtime, identity, Formula evaluator, or memory database was created. C3 remains OPEN.

## AUTHORITY AND EVIDENCE

The host's canonical-authorities.csv identifies Edge GPU, Formula, Runtime, and Skills source ownership. The live Runtime Fabric is a dirty checkout at 4eb6c0ae1dad2ea259ab376919832d7e278e477d and was not modified by this work. A separate local development checkout of the existing GPU repository was created. 672 tracked source files were hashed.

The operating system enumerated Intel integrated graphics and NVIDIA GeForce RTX 5060 Laptop GPU. The actual browser qualification selected Intel / xe-lpg with isFallbackAdapter=false. NVIDIA execution is NOT claimed.

## REPRODUCED FAILURES

The real-browser baseline reported 0/8 passing: seven failed checks plus a readback check blocked by shader rejection.

1. The tiled matrix shader returned some invocations before workgroup barriers. The actual compiler reported: 'workgroupBarrier' must only be called from uniform control flow.
2. Buffer pooling reused an object across different GPU devices.
3. Pipeline caching reused objects across devices.
4. Pipeline caching ignored changed shader source.
5. A Promise resolving to false was treated as approval.
6. A truthy object was treated as approval.
7. The QuadPipeline accepted a result without an independent reference. Its old checksum string was randomly generated, not SHA-256.

Two initial test-harness attempts failed before source qualification (page-readiness race and a consumed adapter request). Both were corrected and retained as failed attempts. A syntax-checker attempt used a Node option unavailable on this host; the checker now parses explicit module input via stdin.

## IMPLEMENTATION

Changed existing files: app.js, buffers/buffer.pool.js, control/gpu.controller.bridge.js, core/quad.pipeline.js, dispatch/compute.dispatch.js, package.json, pipeline/pipeline.cache.js, shaders/matmul.wgsl.js.

- Shader: guarded loads and stores, uniform barriers, safe partial tiles.
- Buffer pool: device ownership, explicit release/discard, bounded idle retention and device-loss cleanup. This is the existing GPU buffer pool, NOT a replacement LDWMD.
- Pipelines: device + shader-content identity and bounded cache entries.
- Dispatcher: shape/finite-value/budget checks, input snapshots, per-device error-scope sequencing, cleanup on failure and actual readback.
- Admission: await the controller and require literal boolean true.
- Verification: require a supplied reference checker and hash the actual output bytes. Reject missing/mismatching references and result mutation. No canonical Veritas claim.
- Application: repair the task-tag allowlist mismatch and supply the existing CPU worker as its numerical reference. Full dashboard interaction remains UNVERIFIED.
- Build command: replace echo-only success with 12 actual JavaScript/module syntax checks. This does not compile a native driver.

Added tests/virtual-gpu/local-acceptance.mjs, browser-tests.js, formula-binding-check.mjs and source-check.mjs. The runner uses an isolated Chromium profile, a loopback-only allowlisted source server, and a real browser GPU. It closes its own browser/server; it does not change normal browser profiles or disable sandboxing.

## TEST AND VALIDATION

Final run: **24/24 local component tests PASS**. Source syntax: **12/12 PASS**. git diff --check: PASS.

GPU matrix sizes: 1, 7, 8, 9, 17, 32, 64. All 5,604 returned values matched the existing CPU worker with maximum absolute error 0 for these fixed representable test fixtures. This is not a universal floating-point equivalence claim or speed benchmark.

Additional tests cover concurrent submissions, immutable prepared inputs, async denial/approval, reference mismatch, real SHA-256, invalid data, and returned buffer leases. Final leasedBytes=0; retained idle buffers are intentional cache residency, not leaked active leases.

## FORMULA

Recovered via the SHA-256-pinned owner host-read binding, not by selecting an arbitrary copied file. Source root resolves to the existing canonical Formula checkout; commit 7fae63185a4cbd4dd631ba13114e4d27accba52b.

Engine SHA-256:
6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e

Engine/input/raw-adapter/service hashes match recorded authority. Imported dependencies match their tracked source. The actual engine executed its golden fixture and returned [4,50,63,59,48,69]; the canonical service health endpoint also reported PASS.

State: EXECUTED_GOLDEN_FIXTURE_ONLY. GPU-workload mapping and Formula-directed optimization: NOT_QUALIFIED / NOT_EXECUTED. No workload efficiency gain is claimed from this self-test. The Formula was neither copied into the GPU project nor replaced.

## BLOCKERS

- The tool blocked the write of core/virtual-gpu-device.js. A subsequent filesystem check confirmed the file does not exist. No alternative write route was used for that module.
- Native API frontend, logical device/resource command layer, driver compilation, installation, graphics conformance, and system enumeration remain incomplete.
- Historical LDWMD databases/proof artifacts were found, but a current authorized implementation/provider binding for this GPU build was not established. LDWMD was not rewritten, deleted, or substituted.
- The 16x6 GPU-domain mapping and interpretation require their actual authority and qualification; no mapping or ranking was invented.
- Remote/Hugging Face execution remains disabled; no cloud resource was allocated.

## RECEIPTS AND ARTIFACTS

Local diagnostic observations and test evidence exist. These are NOT canonical C3/Veritas acceptance receipts. Learning Ledger NOT UPDATED.

Build script: `E:\LeeWay-Work\Invoke-LeeWayVirtualGpuBuild.ps1`.
Final evidence: `E:\LeeWay-Work\evidence-staging\virtual-gpu-g0-20261015T232635850Z`.
Baseline: `E:\LeeWay-Work\evidence-staging\virtual-gpu-g0-20261015-baseline-r3`.
Formula: `E:\LeeWay-Work\evidence-staging\virtual-gpu-g0-20261015-formula`.

Final local-build-observation.json SHA-256:
177f863321aab8856066190b0ca87baf82b6d4886b539b100c52ffc13a4b4fd9

Build script SHA-256 before and after the final run matched:
5444971b6b805a1156b2094046b1e23fc9f525ffe9bfbbc7437c828fae317802

Formula observation SHA-256:
479d17cc090fdc82710ba2aecb41133b31c772032905c335865873771e93a10c

## REPRODUCE AND ROLLBACK

From this source checkout: `npm run build` checks syntax; `npm run test:gpu` executes isolated GPU qualification. The PowerShell authority script's Test stage validates the source origin/baseline and records a new evidence directory.

Rollback is limited to this new development checkout. Preserve its patch, notes, and evidence first; review current hashes before reverting the eight changed tracked paths to the baseline and removing only newly created test/documentation paths. Do not reset the dirty production Runtime Fabric or change system GPU drivers. No GitHub push, commit, system driver installation, service replacement, or paid resource action occurred.

## NEXT SMALLEST ACTION

Resolve the permitted virtual-device source-write path and the canonical LDWMD provider binding. Then implement and qualify the logical resource/command/fence layer on top of these repaired components; connect the real Formula mapping through the existing C3 chain before production promotion.
