<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.PRODUCT_AND_RELEASE_GOVERNANCE
TAG: LEEWAY.G39.CROSS_PR_PRODUCT_ACCEPTANCE
5WH:
WHAT = Reconcile GPU compute, Runtime Fabric authority and original LDWMD into one product acceptance matrix.
WHY = Component proofs do not establish usable standalone GPU API, protected release, OS-adapter status or Nvidia competitiveness.
WHO = Creator-authorized LeeWay engineering; no production issuer or independent signer claim.
WHERE = LeeWay-Edge-GPU/docs/virtual-gpu/G39-PRODUCT-ACCEPTANCE-MATRIX-20261022.md
WHEN = 2026-10-22
HOW = Read-only source and evidence review, blocked release assertions, separate platform and performance gates.
LICENSE: MIT
-->
# G39 — LeeWay GPU product and release acceptance matrix

**Product-first target:** a self-contained LeeWay software-defined compute
application/service with one identity `leeway.gpu.service`, a usable
local execution API and SDK, and a true LeeWay-owned HOST_RAM software
compute backend. This v1 target **does not require a physical GPU or
external GPU service for LeeWay calculations**. Host CPU and RAM remain
the real execution hardware.

**Separate qualification:** OS-visible graphics/GPU adapter support via
WDDM/DXGI, Vulkan ICD, Metal, or other platform interfaces. Successfully
shipping an independent service is not evidence that Windows lists LeeWay
as a graphics adapter or that unmodified graphics applications can select
it. Do not hold the first app release hostage to native OS-driver work,
but never label the two milestones equivalent.

Companion machine-enforceable review ledger:
`G39-PRODUCT-ACCEPTANCE-MATRIX-20261022.json`.
Every release-gate item has explicit status, objective acceptance evidence
and named source. No gate status implies a cryptographic certificate.

## 1. Reconcile the original three draft PRs

| Reviewed PR | Original owner and passing evidence | Necessary integration / missing product proof |
| --- | --- | --- |
| [Edge GPU #11](https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/11) | G22 repaired software CPU worker, correct dense matrix results; G32 measured Formula resource envelope; G36 real 256² same-request Formula and original G22/LDWMD code | Publish real governed local `POST /v1/execute`, SDK and actual user-app example; policy must be signed and entire source closure authenticated |
| [Runtime Fabric #77](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/77) | G27–G38 signed-source checks, replay candidate, scoped Veritas PRE/POST consumer, Continuum readback and ledger correlation; original physical D3D12 LocalService verifier proven separately | Create **new** signed software-scope LocalService provider + installer, independent owner/issuer enrollment, verified live PRE/POST and exact same-request durable receipt/learning provider registration |
| [Runtime Fabric #78](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/78) | G29 real host buffers and G30 original worker reading/writing LDWMD-owned A/B/C buffers; zeroized release checks | Bind protected lease to the exact production request; measure and account for original worker internal copies; no mislabelled physical VRAM |
| [Runtime Fabric #76](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/76) | Ancillary G25 133-entry historical Learning Ledger preservation + one later appended entry | Verify and admit a **new** authorized software-compute Learning event; historical readback is not this |

All four are draft/unmerged in the inspected PR metadata. **Do not
merge an authority PR merely because its source-contract CI passed.**
One production result must match the *same request, source, policy,
input, output, Veritas PRE/POST, Continuum content, Receipt and Learning*
identifiers and hashes and pass the original Audit Triad.

## 2. Current application/SDK surface versus target

Existing owner-owned service and discovery assets:

- `LEEWAY-DEVICE-BRIDGE/packages/leeway-gpu-service`: Windows localhost
  `GET /`, `GET /v1/status`, `GET /v1/manifest`, dashboard, identity
  and Node `client.mjs`.
- `POST /v1/execute` currently **denies** execution; that is a
  correct protection, **not a shipping compute API**.
- Windows `Use LeeWay GPU` preference switch and Android companion
  `industries.leeway.gpu` switch already exist, but switch ON is a
  request preference only. Neither enables canonical governed dispatch.
- The explicit Windows Vulkan opt-in layer candidate currently forwards
  to system Vulkan; it is not a LeeWay software renderer, ICD or general
  GPU driver.

**Minimum v1 functional API target, not currently implemented:**

1. `GET /v1/manifest` reports canonical service ID, version, supported
   operation list, backend, CPU/RAM origin and explicit admission status.
2. `POST /v1/execute` accepts a bounded `matmul-f32` job with a unique
   request ID and authenticated grant. It returns either a durable proof
   reference or an exact rejection reason; it must not accept a
   caller-supplied fake signed authority.
3. `GET /v1/requests/{requestId}` and a receipt endpoint report only
   authenticated, correctly scoped results (including denied, pending,
   and actually committed states).
4. An official LeeWay application performs 256² math through **this
   exact published endpoint**. A separate opt-in third-party example
   uses the same SDK and receives the real result and a traceable
   receipt. Both run without NVIDIA/cloud services in
   `LEEWAY_SOFTWARE_HOST_CPU` mode.

Backend reporting must distinguish at least `engine`, `resourceKind`,
`hardwareGpuUsed`, `externalProviderUsed`, `executionAllowed`,
scope and evidence state. The LeeWay CPU backend is **not** an external
fallback. An explicitly selected optional `SYSTEM_NATIVE` or physical
GPU acceleration path is a *different* backend and may not substantiate
standalone software-only benchmark or certification claims. No silent
fallback on failed Veritas checks.

## 3. Production authority and one-request execution

**Required atomic evidence chain (one fresh request):**

Owner/issuer-approved workload and Formula policy →
independently signed Veritas PRE →
original LDWMD genuine allocated HOST_RAM A/B/C lease →
original LeeWay G22 CPU operation and independent numeric check →
original Continuum durable write/readback of exact content →
independently signed Veritas POST referring to PRE and Continuum hash →
exactly one original Receipt Ledger append →
exactly one original Learning Ledger outcome →
original Audit Triad and restart/readback verification.

G36 genuinely crossed Formula and LDWMD/G22 on one diagnostic request;
it did NOT write a software-only Continuum/Receipt/Learning production
result or obtain a software-scoped protected Veritas signature. G37 found
10 installed C3 task directories, six D3D12-scope public trust records
and zero software-only scopes. The remote Windows operator shell was not
elevated; the software-specific signer and installer remain absent.
Do not copy the existing physical D3D12 private key, retrofit its
signed scope or bypass protected replay/issuer gates.

## 4. Packaging acceptance

A product ZIP/MSIX/installer or supported app bundle must contain
everything needed to run LeeWay's documented CPU backend and local API,
with no hard dependency on the E: development drive and no external
GPU provider service. Pass a clean-machine/offline install, version
report, startup/shutdown, corrupted/expired-grant rejection, multiple
concurrent client requests, signed update verification, rollback,
uninstall/reinstall, durable receipt readback and clean recovery.
No standalone downloadable **production** package has qualified these
requirements yet.

## 5. Windows, Android, Apple and Linux gates remain separate

- **Windows:** latest G19 J-7 evidence confirms WDK
  10.1.26100.6584 and SDK headers/tools installed; this supersedes
  earlier G18 findings that the WDK was missing. No isolated Windows
  guest qualification, original LeeWay WDDM KMD/UMD, signed INF, or
  enumerated LeeWay DXGI/PnP adapter is proven. IddCx describes virtual
  monitors, not a universal GPU replacement.
- **Android:** G19 Oct 17 Android ARM64 Vulkan *llama binary* was built
  and independently hashed but not deployed/run on Fold6 in that
  checkpoint. A **different** separate LeeWay GPU companion Android
  debug APK was installed Oct 19 and bound to its read-only service;
  UI tap and governed computation were not qualified. Do not collapse
  these into one "Vulkan compute deployed" claim.
- **Apple:** J-7 LeeWay-owned Swift/Metal provider source was staged.
  Build/real iPhone execution was not established by that checkpoint.
  Metal is a separate optional physical backend, not a way to register
  a new Apple hardware GPU. LeeWay software execution needs a
  platform-owned local runtime and independent tests.
- **Linux:** user service installer script passes syntax only; no
  Linux device deployment or verified service compute. Vulkan
  software ICD/layer and OS enumeration require separate Linux
  qualification. Do not reuse a Windows Vulkan DLL as an ELF driver.

## 6. NVIDIA challenge — retained failing evidence is a release input

G22 repaired dense Float32 2048×2048 campaign:
`LeeWay 7598.0897 ms` vs `RTX 5060 10.1847 ms`.
All measured outputs match separate references, but **no speedup
over NVIDIA** was observed. This is a three-pair campaign with
different launch-context lifecycles, not universal performance ranking.
Qualify GPU competition *per operation and size* with honest timings,
correctness, resource usage, power where measured, concurrency, latency,
warm/cold starts, and actual in-app results. Do not interpret Formula
state-domain counts as proof of throughput or OS virtual-adapter status.

## Release naming and truthful acceptance

- **Today:** `LEEWAY_SOFTWARE_COMPUTE_DIAGNOSTIC` with partial original
  protected-pipeline components, tests and an existing denied API.
- **First release gate:** `LEEWAY_STANDALONE_SOFTWARE_GPU_SERVICE_V1`
  only when P01/P02/A01/A02/C01/C02/C03/R01 machine ledger gates all
  pass with genuine installed/runtime evidence.
- **Separate OS adapter gate:** `LEEWAY_OS_ENUMERATED_GPU_ADAPTER`
  only when a signed, native adapter enumerates and passes applicable
  app/API conformance on the target OS.
- **Independent comparative claim:** `LEEWAY_BEATS_NVIDIA_ON_X`
  only for the concrete workload X under a reviewed repeatable benchmark
  that actually shows that result. No general claim from passing one test.

The source-acceptance matrix is the **release decision record**, not a
license to bypass the creator's original safety and evidence authorities.
