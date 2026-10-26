# K1-H1 Dense Software Bottleneck Review — 2026-10-22

**Work ID:** `K1-H1-DENSE-BOTTLENECK-20261022`  
**Scope:** read-only source and evidence review of `E:\LeeWay-Work\LeeWay-Edge-GPU`. No benchmark, install, source edit, commit, GPU invocation, cloud call, or external model provider was used for this review.

## Acceptance boundary

The candidate remains the existing LeeWay square CPU worker. The NVIDIA result is an authorized comparison baseline only; it is not a LeeWay execution, a desired outcome, or a reason to add a physical-GPU dependency. This review proposes a bounded software-only repair and does not claim a performance result.

## Investigate

| Area searched | Source evidence | Finding |
|---|---|---|
| Square CPU operation | `fallback/cpu.worker.js:13-19` | The implementation creates `Float32Array(size*size)` and computes each output with a scalar `i → j → k` triple loop. Its maximum size is 2048. |
| Node host path | `fallback/node-cpu.engine.mjs:4-46,54-62` and `fallback/node-cpu.worker.mjs:1-29` | One Node worker is created per call, inputs are finite-checked and copied with `slice()`, then structured-cloned to the worker. The worker is terminated after each result, error, cancellation, or timeout. |
| Browser host path | `fallback/cpu.engine.js:10-28` | The browser path has the same transient-worker lifetime. |
| Existing CPU reference | `fallback/tensor-reference.mjs:11-19` | The fixed tensor operation is also scalar `row → col → k`; it has bias and optional ReLU and is not a high-performance square GEMM engine. |
| Existing worker reuse | `workers/worker.manager.js:5-27` | Browser-only general helper. It creates a browser `Worker`, overwrites a single `onmessage` handler for each `run`, and has no request identity, queue, cancellation, or Node adapter. It is not safe to reuse for concurrent Node matmul jobs unchanged. |
| Existing tiling | `shaders/matmul.wgsl.js:14-29`; `dispatch/tensor.dispatch.mjs:43-49` | The only inspected tiled GEMM is the WebGPU `TILE=8` shader. It is a physical/WebGPU route and is ineligible for the requested standalone software repair. |
| WASM/native CPU candidate | `package.json:6-23`; repository file inventory | No `.wasm` or `.wat` files, CPU SIMD implementation, native CPU GEMM source, or declared GEMM dependency was found. The native source inventory is Vulkan-layer, Android Vulkan probe, and Windows D3D12 prototype code; none supplies a standalone CPU matrix engine. |
| Governance boundary | `core/hybrid.dispatcher.js:41-93,95-132`; `CONTRIBUTORS.md:13` | `AI_INFERENCE` requires `WEBGPU` plus the Runtime Fabric binding. CPU tensor dispatch is explicitly a local reference check and says Formula is not executed by the dispatcher. A raw CPU matrix repair cannot be presented as governed inference or as a new authority. |

## Diagnose

### Observed primary bottleneck

`fallback/cpu.worker.js:16-18` performs `N³` JavaScript multiply-adds. In its innermost loop it reads `B[k * size + j]`: a column walk through a row-major matrix. That stride defeats contiguous row access and has no cache block, transpose, SIMD, or parallel partition.

The retained campaign specification identifies this exact candidate as `EXISTING_LEEWAY_SQUARE_CPU_WORKER_WITH_NO_GPU_OR_REMOTE_PROVIDER` and says its sample time includes worker startup, input copy, and termination: `evidence-staging/g22-nvidia-dense-challenge-20261022/run-01/specification.json:13-21`. The campaign's existing CPU medians increased from 51.1769 ms (256) to 30,561.3279 ms (2048). That scaling supports the scalar arithmetic and memory-access path as the dominant large-size concern, but the campaign has no stage-by-stage profiler. It therefore does **not** measure the exact percentage attributable to worker startup, cloning, validation, or matrix arithmetic.

### Secondary overheads

`cpuMatMulNode` validates every element and makes two explicit input copies before the worker message (`fallback/node-cpu.engine.mjs:56-61`). Node structured-clones the message, and the result returns through another message before the worker is terminated (`:23,42`). These costs matter particularly at small sizes. At 2048, each input and output Float32 matrix is 16 MiB; the code path therefore requires multiple copies in addition to the 8,589,934,592 multiply-add iterations. The precise allocation count and time split are unmeasured in the current evidence.

### What the result does and does not show

The retained output review establishes byte-for-byte output agreement for the tested fixtures and that NVIDIA won the four reported comparison cases. It does not establish a broad hardware ranking, a full governed-pipeline timing, or failure of standalone software computation. The comparison also intentionally has a lifecycle difference: a transient CPU worker versus CUDA context initialization outside baseline sample time (`specification.json:19-21`).

## Plan — smallest eligible repair

**Repair one function, keep its public interface.** Replace only the square-matmul loop behind the existing worker message in `fallback/cpu.worker.js`; preserve the existing `cpuMatMulNode(A, B, size, options)` interface, `size <= 2048` boundary, `Float32Array` inputs/results, Node worker shim, cancellation/timeout cleanup, and no-provider worker guard.

Use a **software-only row-major blocked loop** inside the CPU worker:

1. Process a bounded output-column block for one input row.
2. Maintain one JavaScript Number accumulator per output in that block (for example a bounded `Float64Array` scratch), while processing `k` strictly in ascending order.
3. For each `k`, multiply the row value from `A` across contiguous `B[k * size + j]` values in the column block.
4. Write each output to the `Float32Array` only after all `k` values for that output have been accumulated.

This improves locality without GPU, WebGPU, CUDA, cloud, Hugging Face, model runtime, new package, or another arithmetic provider. It targets the observed stride defect before adding worker pooling or WASM.

## Numerical and interface constraints

The present algorithm accumulates in JavaScript Number and rounds once when assigning to `Float32Array` (`cpu.worker.js:15-18`). A common tiled GEMM pattern that adds each partial tile directly into a Float32 output would round after each tile and can change non-integer results. The proposed blocked implementation must preserve ascending `k` summation per output and perform one final Float32 write. Any intentional change to that rounding contract must be separately specified, independently tested, and must not reuse the current expected output as its only oracle.

The existing campaign fixtures used an independent NumPy float64-matmul then float32-cast oracle (`run-01/specification.json:16`), and all retained output bytes match it. That is useful regression evidence for those fixtures, not proof of bitwise equivalence for all Float32 inputs. Qualification must include non-integer, signed, zero, rectangular-tensor, cancellation, timeout, invalid-input, and upper-bound tests. The `TENSOR` operation must remain separately verified because it includes bias/ReLU semantics (`fallback/tensor-reference.mjs:11-19`).

## Review boundaries and order of work

1. **Implementation review:** change only the CPU-worker square kernel. Do not import the GPU tile shader, native probes, ggml DLLs, model runtimes, or external packages.
2. **Correctness review:** preserve raw input snapshots and prove full-output agreement against an independently generated reference for declared test inputs. Record whether comparison is byte-exact or tolerance-based before measuring.
3. **Resource review:** retain the current failure-before-dispatch behavior for invalid/aborted inputs and terminate workers on every settled path. Do not transfer caller-owned input buffers; transfer would detach them and changes the snapshot contract.
4. **Performance review:** rerun the same stated CPU-only lane and record cold transient-worker timing separately from any future persistent-worker timing. A persistent worker pool is a later, separate repair because `workers/worker.manager.js` cannot safely supply it unchanged.
5. **Governance review:** keep raw-matrix result scope local. Do not advance Formula, Runtime Fabric, Veritas, Device Bridge, Diagnostics, model inference, or virtual-adapter status from this repair alone.

## Status

- **Observed:** the existing CPU square kernel is scalar and cache-unfriendly; no eligible CPU tiled/WASM/parallel GEMM is already implemented.
- **Diagnosed with evidence:** CPU worker lifecycle and data copies are additional overhead; their individual timing contribution is not measured.
- **Planned:** a localized, software-only blocked row-major replacement preserving the existing call interface and numerical semantics.
- **Not executed:** implementation, benchmark, canonical Formula evaluation, Runtime Fabric authorization, Veritas verification, governed model inference, and any performance claim.
