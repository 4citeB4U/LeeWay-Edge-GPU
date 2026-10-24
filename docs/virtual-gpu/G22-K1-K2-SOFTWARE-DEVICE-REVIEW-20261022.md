# G22 — K1/K2 standalone LeeWay software compute review

Date: 2026-10-22. Scope: the existing `4citeB4U/LeeWay-Edge-GPU` local working tree. Local development and evidence only; no Git publication or driver installation.

## Product requirement recovered

The Creator explicitly requests an intentional LeeWay software compute mode that works without a physical graphics accelerator, Hugging Face GPU quota, a cloud GPU, or a paired GPU computer. The longer-term product includes a genuine virtual graphics/compute device interface. Those requirements are recorded separately so a working scalar calculation cannot be mistaken for OS driver qualification.

The previous G19 acceptance classifier required `hardwareBacked=true` for its component outcome. That historical classifier addresses the hardware/native-adapter campaign and cannot judge the new intentional software-only requirement. It has been preserved; software mode now has a separate execution diagnostic rather than a fabricated physical-adapter identity.

## Source review and actual repair

| Item | Inspected state | Change / next gate |
| --- | --- | --- |
| `fallback/cpu.worker.js` | Existing LeeWay square matrix and fixed tensor computation in a browser worker. | Reused unchanged. |
| `fallback/tensor-reference.mjs` | Existing scalar matrix multiply, column bias, identity/ReLU. | Reused unchanged as arithmetic, with an independent BigInt oracle for integer test inputs. |
| `fallback/node-cpu.engine.mjs`, `fallback/node-cpu.worker.mjs` | New host adapter for the existing worker. | Runs through Node worker threads without a browser, GPU service, external package, or remote compute provider; bounded cancellation/timeout/cleanup. |
| `core/hybrid.dispatcher.js` | Existing explicit CPU tensor route, local controller admission, reference check, and SHA-256 result. | Reused unchanged; diagnostic controller is expressly not Runtime Fabric or Formula authorization. |
| `core/state-window-statistics.mjs` | Enforces sixteen rows of six integer states. | This is the current 16×6 history representation. No new canonical 16×16 Formula mapping was located in the inspected source. |
| `core/scene-transform-reuse.mjs` | Reuses unchanged Three.js local transforms. | It calls the original library matrix update when needed; it is not a complete software rasterizer. |
| Native/API registration | D3D12 pilot uses physical adapters; Vulkan layer forwards calls; no qualified independent WDDM implementation found in reviewed native source. | A real driver/API implementation and isolated platform qualification remain open. |

The host adapter is a capability within the existing GPU repository. It creates no separate Formula, memory authority, registry, service listener, or receipt authority. It does not change the installed 4178 service or enable its production execution route.

## Executed software diagnostic

Run from the GPU repository with Node 24:

```text
node --test tests/virtual-gpu/software-cpu-host.test.mjs
node tests/virtual-gpu/software-only-acceptance.mjs --evidence <owner-selected-evidence-directory>
```

The first reviewed run used a byte-preserved source snapshot in the current authorized workspace. Promotion includes a repeat against the actual GPU checkout; preserve both reports.

- Eight host-adapter tests cover known answers, immutable input snapshots, invalid/pre-cancelled requests, timeout, cancellation after dispatch, injected termination failure, and cancellation after result arrival while termination is pending.
- Seven real tensor variants include two distinct 16×16×16 cases, rectangular tensors, and 32×32 and 64×64 products.
- The oracle independently uses BigInt integer arithmetic in reverse inner-loop order. For these bounded small integer fixtures, outputs are exactly representable as Float32.
- Each returned value is checked; expected mismatches are zero. Actual results, timings, source hashes, and the outcome are written to `software-only-acceptance.json`.
- Three negative checks cover denied admission before computation, cancellation before computation, and independent reference rejection after computation.
- No WebGPU, WebGL, ML engine, Hugging Face, cloud-GPU SDK, or graphics driver is selected for this calculation. Main JavaScript and worker fetch/WebSocket/WebGPU entry points are guarded. These guards are not an OS sandbox or a machine-wide device/network trace.
- Timings include worker startup, copying, admission, calculation, reference comparison, hashing, and cleanup. They are not a GPU superiority benchmark.

## Full governed pipeline gate

The requested product pipeline remains:

> Runtime Fabric → Formula → Veritas PRE → LDWMD → Compute → Independent Readback → Continuum → Veritas POST → Receipt Ledger → Learning Ledger

This increment exercises **Compute and independent numeric readback** through the existing dispatcher. The diagnostic uses ordinary JavaScript worker memory; it does not claim an LDWMD lease. Current production Runtime Fabric issuance, approved workload Formula mapping, PRE/POST verification, owner Continuum retention, canonical receipt, and Learning Ledger admission remain unbound or unverified by this run. Existing hardware-based diagnostic receipts cannot qualify those software-mode bindings.

Next integration work must bind those existing authorities to this explicit software execution mode, with request/source/result correlation, cancellation, memory release, durable readback, and independently validated receipts. No new issuer or replacement Formula is authorized by this repair.

## Research and feasibility boundaries

Software rendering and compute without a dedicated graphics accelerator are established engineering approaches. Microsoft's [WARP documentation](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/directx-warp) describes software rasterization and DXGI software-adapter enumeration; it provides an architectural precedent, not a LeeWay implementation or benchmark result.

The official [Three.js WebGLRenderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html) states that its renderer uses WebGL 2. [Cesium Scene](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html) likewise exposes WebGL context creation. Their JavaScript geometry mathematics can inform LeeWay computation, but a full replacement for the graphics API still needs an actual renderer/driver implementation.

[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) publishes static HTML/CSS/JavaScript. It can deliver LeeWay's software to a browser; the browser or installed runtime executes that code on its host. A continuously running installed worker needs the host runtime to remain active. This requires no Hugging Face service but does not create unlimited CPU time, RAM, or execution while the host is suspended.

The 16×16 tensor calculation verified here is distinct from a 16×16 Formula state organization. A layout alone does not prove more arithmetic throughput, unlimited memory, or superiority to every physical GPU. Those claims need matched workload, precision, output-quality, latency, throughput, memory, and power comparisons. The existing G5 application evidence found no repeatable speedup and a blocked Maps readiness case; it must remain in the record.

## K1/K2 handoff

K1-H1 audited software source and authored the Node host shim. K2 audited device/API implementation and reviewed worker lifecycle and diagnostic-guard limits. K1 repaired termination-failure handling, ensured cancellation is rechecked before result settlement, supplied independent arithmetic verification, and executed the targeted tests. K2's alternate metadata-only acceptance classifier remains staged and unpromoted because it used a different affine workload and an unbound trace-verifier callback.

Outcome: real software-only tensor component qualified on this Windows Node host; full governed product execution, OS-native virtual GPU registration, cross-platform qualification, and performance superiority remain open. No canonical Veritas receipt or Learning Ledger entry was created.
