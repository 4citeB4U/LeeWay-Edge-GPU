# LeeWay GPU

**Software-defined graphics/tensor execution research — local candidate, not an installed graphics card.**

Creator: Leonard Lee / LeeWay Industries. Source owner: `4citeB4U/LeeWay-Edge-GPU` (edge backend engineering). The official product is **LeeWay GPU**; the Windows execution backend is **LeeWay GPU — D3D12**. The separately installed LeeWay GPU service contract is provided by Device Bridge at `127.0.0.1:4178`. This repository's candidate tensor/browser paths do not establish service dispatch, a virtual OS GPU adapter, or production readiness.

This repository is being rebuilt around real computation, explicit admission, reference-checked results, and recoverable working state. Runtime Fabric remains execution authority; the canonical LeeWay Formula remains mathematical authority. Cesium and selected Three.js/TSL capabilities are complementary integration targets, not governing layers.

## Current local capability

The G2 candidate extends the existing WebGPU/CPU paths with:

- Rectangular row-major matrix multiplication, column bias, and optional ReLU in one fixed tiled WGSL kernel.
- GPU-to-CPU recovery for that pure operation after explicit unavailability, device loss, allocation failure, or an application byte-budget rejection.
- Separate approval for the fallback route; denial, cancellation, invalid inputs and reference mismatches are not silently converted into successful fallback.
- A CPU worker with cancellation and bounded lifetime, result snapshots, numerical reference checks, and real SHA-256 digests.
- Comparison-only incremental frequency, column, occurrence, and co-occurrence statistics for a canonical 16x6 history. This is not another Formula evaluator or a redefinition of its Golden fixture.
- An optional bounded integration probe using the **real external LDWMD implementation** and real WebGPU buffers. LDWMD code is not copied into this repository.

See [the G2 checkpoint](docs/virtual-gpu/TENSOR-G2-CHECKPOINT.md) and [reviewed evidence](qualification/tensor-g2/local-evidence.json) for measured results and source hashes. The earlier [G0 checkpoint](docs/virtual-gpu/LOCAL-BUILD-CHECKPOINT.md) records the execution-core repairs.

## What is not claimed

This candidate is not a WDDM driver, Vulkan ICD, virtual PCI device, CUDA compatibility layer, Google TPU, quantum processor, or general replacement for NVIDIA hardware. It has no published cross-vendor superiority benchmark or enterprise failover SLA. A controlled release of a test-owned GPUDevice is not a physical GPU outage test.

The tensor operation is a usable component interface, not transparent interception of arbitrary existing applications. Full Formula-directed workload routing, production LDWMD binding, Cesium/TSL composition, native driver integration, cross-platform qualification, and C3 closure remain open. No remote provider is activated by these tests.

## Execute locally

Node.js 24 and an installed compatible Chromium browser are used by the qualification scripts. No new runtime dependency is needed for these tests.

```powershell
npm run build
npm run test:tensor
npm run test:gpu -- --evidence <LOCAL_EVIDENCE_DIRECTORY>
```

`build` checks the listed JavaScript/module sources; it does not compile a native driver. `test:tensor` uses labeled injected faults and actual CPU calculations. `test:gpu` starts an isolated loopback-only browser test, runs real GPU work, and closes only its own browser/profile session.

Use `--browser <INSTALLED_BROWSER_PATH>` when default browser discovery does not apply. This does not establish every operating system as tested.

The existing PowerShell authority script supports a combined run:

```powershell
pwsh -NoProfile -File scripts/Invoke-LeeWayVirtualGpuBuild.ps1 `
  -Stage Tensor -WorkRoot <RESOLVED_WORK_ROOT> -GpuRoot <THIS_CHECKOUT> `
  -LdWmdRoot <QUALIFIED_RUNTIME_FABRIC_CANDIDATE_CHECKOUT>
```

This script resolves the owner's source registry and Formula binding, verifies source identity, runs the original and new tests, and rehashes sources. It requires the existing owner environment/bindings rather than inventing a new root. Source and raw evidence stay local unless explicitly published.

## Tensor component interface

The operation is `MATMUL_BIAS_RELU_V1` with `m`, `k`, `n`, Float32Array inputs `A`/`B`, an optional length-`n` bias, and `identity` or `relu` activation. Dimensions and total work are bounded in `dispatch/tensor-contract.mjs`; shared mutable input buffers are rejected.

```javascript
import { HybridDispatcher } from './core/hybrid.dispatcher.js';
import { prepareTensorTask } from './dispatch/tensor.dispatch.mjs';
import { cpuTensor } from './fallback/cpu.engine.js';
import { cpuTensorReference, compareTensorResults } from './fallback/tensor-reference.mjs';

// device, input, and controller come from the authorized host/application.
const dispatcher = new HybridDispatcher({
  webgpu: { run: (task, context) => prepareTensorTask(device, task.input, {
    signal: context.signal
  }).run() },
  cpu: { run: (task, context) => cpuTensor(task.input, { signal: context.signal }) }
});
const result = await dispatcher.dispatch({ type: 'TENSOR', input }, {
  capability: device ? 'WEBGPU' : 'UNAVAILABLE',
  allowCpuFallback: true,
  controller,
  verify: async (actual, snapshot) =>
    compareTensorResults(actual, cpuTensorReference(snapshot))
});
```

This example deliberately requires an injected controller and verifier. A test callback returning approval is not a production Runtime Fabric or Veritas binding. Full scalar verification adds cost; it must be included in end-to-end performance measurements.

## Mathematical and memory boundaries

TPU-inspired locality and fusion describe a software technique, not hardware Tensor Core/MXU instructions. WGSL tile sizes are independent of the Formula's 16x6 history semantics.

The state helper preserves exact integer aggregates and is compared with the actual hash-verified canonical source. Ranking, normalization, certified evaluator identity, and policy authority stay with `4citeB4U/Leeway-formula-live`.

LDWMD means **LeeWay Device Working-Memory Database**. Its source owner remains `4citeB4U/Leeway-Runtime-Fabric`. API allocation/readback proof and application byte budgets are not exact physical VRAM attribution, enlarged VRAM, or total-model compression.

## Publication and governance

Development publication is through a feature branch and review PR. `main` has a pre-existing Fly.io deployment workflow; it is not advanced automatically. No driver installation, security-setting changes, paid resource acquisition, or production runtime restart is part of the local build.

[GPU build mission](https://github.com/4citeB4U/LeeWay-Edge-GPU/issues/1) · [Contributor hub](https://github.com/4citeB4U/LeeWay-Agent-Skills/issues/22) · [C3 authority](https://github.com/4citeB4U/Leeway-Runtime-Fabric/issues/21)
