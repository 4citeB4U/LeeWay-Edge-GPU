# LeeWay Edge GPU

**One standalone LeeWay GPU product for Windows, Linux, Samsung/Android, macOS, iPhone and iPad.**

Creator: Leonard Lee / LeeWay Industries. Source owner: `4citeB4U/LeeWay-Edge-GPU`. Product identity: `leeway.gpu.service`. Applications submit work through the existing Device Bridge GPU service and SDK. Device execution APIs are implementation adapters beneath this shared product identity.

The LeeWay-owned model graph includes GGUF reading, tokenization, quantized mathematics, normalization, attention, KV state and token generation. Runtime Fabric owns authorization, Formula governs decisions, LDWMD owns active buffers, Continuum owns durable state, and Veritas plus both ledgers retain verified outcomes. Cesium and Three.js mathematics support the spatial capability plane.

Agent Lee remains the LeeWay Machine Consciousness runtime identity. Models are task capabilities. Speech is delivered through the existing LeeWay Voice Fabric.

**Implementation status:** the portable runtime connections are being integrated and tested. Each platform still requires its own build, real device execution and complete governed acceptance. The implemented shader graph currently supports bounded Qwen2 and Gemma4 text profiles. Qwen3 multi-token parity remains unresolved.

See [portable runtime implementation](docs/virtual-gpu/PORTABLE-GPU-IMPLEMENTATION-20261023.md) for the exact architecture, source recovery, interfaces and remaining gates.

## Shared application interface

- `GET /v1/capabilities`: qualified provider identities and model capabilities.
- `POST /v1/models/activate`: select an admitted local model for an authenticated client.
- `POST /v1/generate`: execute through that client's Runtime Fabric binding.
- `sdk/model-resource.mjs`: device-local bounded model reading through file, Blob or native storage adapters.
- `contracts/gpu-platform-contract.mjs`: one product identity and six platform targets.

The existing service receives the SDK's `createLeeWayGpuInferenceProvider` at trusted startup. Requests carry model/task data; authorization and execution providers come from the deployment. Model bytes, grants, actual LDWMD buffers, session state and results retain matching request identities. Missing authority or final audit evidence withholds output.

## Retained tensor component capability

The G2 candidate extends the existing WebGPU/CPU paths with:

- Rectangular row-major matrix multiplication, column bias, and optional ReLU in one fixed tiled WGSL kernel.
- GPU-to-CPU recovery for that pure operation after explicit unavailability, device loss, allocation failure, or an application byte-budget rejection.
- Separate approval for the fallback route; denial, cancellation, invalid inputs and reference mismatches are not silently converted into successful fallback.
- A CPU worker with cancellation and bounded lifetime, result snapshots, numerical reference checks, and real SHA-256 digests.
- Comparison-only incremental frequency, column, occurrence, and co-occurrence statistics for a canonical 16x6 history. This is not another Formula evaluator or a redefinition of its Golden fixture.
- An optional bounded integration probe using the **real external LDWMD implementation** and real WebGPU buffers. LDWMD code is not copied into this repository.

See [the G2 checkpoint](docs/virtual-gpu/TENSOR-G2-CHECKPOINT.md) and [reviewed evidence](qualification/tensor-g2/local-evidence.json) for measured results and source hashes. The earlier [G0 checkpoint](docs/virtual-gpu/LOCAL-BUILD-CHECKPOINT.md) records the execution-core repairs.

## Governed model performance campaign

Use the existing authenticated Device Bridge GPU service for model inference. This runner accepts only a loopback service URL, checks qualified model capability, activates the selected local model, and measures repeated `/v1/generate` requests. Each result must contain the LeeWay GPU execution identity and request-bound Formula, LDWMD, Continuum, Veritas, Receipt Ledger and Learning Ledger evidence. It never calls `runModel` directly, starts a model server, or contacts an outside inference provider. Missing Runtime/provider authority records a blocked run before inference.

The service must expose the governed inference routes and be active for the qualified model. The historical listener that exposes only `/v1/status`, `/v1/manifest` and denied `/v1/execute` is not sufficient; the runner will stop before activation or generation when those bindings are absent.

```powershell
$env:LEEWAY_GPU_BENCH_SERVICE_URL = 'http://127.0.0.1:4178'
$env:LEEWAY_GPU_BENCH_AUTHORIZATION = '<authorization from the existing local Device Bridge adapter>'
$env:LEEWAY_GPU_BENCH_MODEL_ID = '<qualified local model id>'
npm run bench:governed -- --runs 10 --max-new-tokens 8 --evidence C:\LeeWay-Evidence\gpu-run-01
```

The report separates whole-request latency from model-graph load, prefill, decode and token timing. First-token latency is reported as unavailable because this service endpoint returns a complete, non-streaming response. Correctness is checked against the supplied expected answer. The harness reports measured LeeWay execution only; it does not compare against another provider or certify production enrollment or platform coverage.
## Qualification boundaries

Standalone product acceptance covers installation, public API, lifecycle, governed computation and application use. Native operating-system GPU enumeration has its own driver/API qualification. Platform target declarations and passing contract tests cannot establish physical device execution.

The current D3D12, Vulkan and Metal diagnostics retain their measured scope. Each native implementation must qualify the full operator and resource interfaces before it can execute the shared model workload. Protected production enrollment, inference-domain Formula policy, complete device buffer planning and end-to-end acceptance remain open.

## Execute locally

The portable contract suites use Node.js 22 or later; the retained local run used Node.js 24. Browser GPU qualification additionally requires a compatible installed browser. Tests use existing dependencies.

```powershell
npm run build
npm run test:portable
npm run test:software
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
