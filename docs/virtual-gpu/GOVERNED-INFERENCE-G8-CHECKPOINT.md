<!--
REGION: LEEWAY.EDGE_GPU.ENGINEERING
TAG: LEEWAY.EDGE_GPU.GOVERNED_INFERENCE.G8
WHAT: Repair checkpoint for exclusive, ecosystem-bound model execution.
WHY: A standalone model runtime or self-declared device name cannot qualify the requested LeeWay GPU.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS EXECUTE VERIFY.
WHERE: Existing Edge GPU development checkout; existing Formula/Runtime/LDWMD/Continuum source owners retained.
WHEN: 2026-10-16. HOW: Recover > back up > repair > regress > inspect real sources/models > rehash > preserve.
LICENSE: MIT
-->
# G8: exclusive inference boundary and model-profile repair

## Master checkpoint

Source: `4citeB4U/LeeWay-Edge-GPU`, branch `build/local-virtual-gpu-g0`, baseline `df5196f15df0843b30e6368724f9cf1756447f9f`.

**SOURCE REPAIRED / CONTRACT TESTED / FULL GOVERNED INFERENCE BLOCKED. C3 OPEN.**

Creator permits physical hardware as an execution substrate underneath LeeWay. Standalone Ollama/llama-server inference, remote inference, and CPU neural fallback are excluded from the requested model path. The CPU still executes ordinary host control, file parsing, hashing, tokenization and Formula arithmetic; those are not represented as GPU neural execution.

No native GPU driver was installed. OS enumeration and full model inference are separate acceptance gates. Renaming an object or altering reported capabilities will not count as either.

## Recovered work, not rewritten

The local G7 source already contained `sdk/gguf-reader.mjs`, a tokenizer, quantized-weight WGSL, transformer operators, and `core/transformer-inference.mjs`. Their hashes matched the retained Qwen run `lee-only-inference-g7-20261016T171549720Z`, which produced `4` through LeeWay WGSL. That was historical component evidence with Formula NOT_EXECUTED and production LDWMD unbound; it is not this turn's integrated acceptance.

The G7 Gemma attempt stopped at `GEMMA4_PER_LAYER_PROFILE_UNSUPPORTED`. It was not evidence that the hardware could not run the model.

## Repairs made

1. `core/hybrid.dispatcher.js`: AI_INFERENCE no longer silently selects a CPU route. It requires a constructor-injected Runtime Fabric binding, a request/model/tokenizer/implementation identity, and an admitted exclusive WGSL execution lease. The generic TENSOR capability retains its earlier independent contract; it is not used as a neural fallback.
2. `core/inference-contract.mjs`: consumer-side subject, expiry, budget, Formula source/mapping/receipt, pre-Veritas, LDWMD lease, Continuum session and local weight-source validation. This is NOT another authority, token issuer, registry or model harness.
3. `core/transformer-inference.mjs`: remove the diagnostic always-true admission path; defer all GPU allocations until admitted; require current execution context before loading, weight-range reads and token work; bind the read-only loopback model source; bound range fetches by lease/cancellation and reject redirects.
4. `dispatch/model-ops.mjs`: inference allocations use the admitted LDWMD buffer-lease interface rather than silently creating a separate inference allocator. The standalone operator-test pool remains explicitly diagnostic. The actual Runtime/LDWMD provider implementing this lease is still UNBOUND.
5. Correct Gemma's actual metadata key from `embedding_length_per_layer` to `embedding_length_per_layer_input`; validate required tensor shapes. Compute text-graph data requirements from tensor metadata, not model filenames or a fixed 512 MB/4 GB guess.
6. Require correlated result verification and durable-state readback before output release. Invalidate completed execution contexts, reject replay, close model resources before releasing the parent lease, and require verified rollback when durable commit was attempted but the request fails.
7. The existing PowerShell authority script gained the `Governance` stage. `Infer` stops explicitly while the canonical binding is unqualified. It no longer runs the old local-only approval path as if it met the new requirement.

**Trust boundary:** required object fields, hashes and callback shapes are consumer checks, not cryptographic authentication of arbitrary JavaScript. Runtime Fabric must independently load, authenticate and qualify the supplying providers. Unit stubs do not establish that authority.

## Actual model inspection

Both existing model files were read-only and fully SHA-256 checked against their inspected inventory. Header parsing used the existing GGUF reader; no external inference engine was launched.

| Model | File bytes | Text-graph data floor at 128-token context | Qualification |
|---|---:|---:|---|
| qwen2.5:0.5b | 397,807,936 | 396,317,708 | Metadata plan only |
| gemma4:e4b | 9,608,338,848 | 2,951,393,460 | Metadata plan only |

Gemma plan: 42 layers, hidden width 2,560, per-layer input width 256, 18 shared-KV layers, 665 required text tensors. Packed resident text weights 2,934,097,064 bytes; KV 14,680,064; working activations 2,616,328; dummy buffer 4. Existing paging reads a 21,504-byte per-layer embedding row per token instead of retaining its entire table.

These are source-derived data requirements, not measured physical VRAM, achieved compression, model-fit proof, performance measurements, multimodal support or full-context qualification. Transient uniforms, staging, readback, browser and driver allocations are excluded. Unsupported model architectures remain explicit errors.

Model hashes:
- Qwen: `c5396e06af294bd101b30dce59131a76d2b773e76950acc870eda801d3ab0515`
- Gemma: `4c27e0f5b5adf02ac956c7322bd2ee7636fe3f45a8512c9aba5385242cb6e09a`

## Tests actually executed

- 43/43 exclusive-inference consumer-contract regressions: PASS.
- 18/18 existing tensor contract regressions: PASS.
- Six changed/added JavaScript/module files parsed successfully.
- Actual canonical Formula engine and authority-pinned files matched SHA-256; imported dependencies matched tracked source.
- Actual Formula Golden self-check: PASS. **No inference-domain Formula decision was executed.**
- Both models passed read-only hash and current metadata preflight.
- Current six-file code hashes matched the final test manifest after execution.
- Authority script hash matched before/after. Tracked `git diff --check` passed, with existing line-ending warnings only.

The 43 tests use explicitly synthetic provider stubs for lifecycle/failure paths, plus actual model metadata for allocation-free preflight. They are not 43 real model runs, GPU tests, Formula-issued authorizations or canonical C3 acceptance.

No new neural model execution occurred after the Creator's complete-governance requirement. No audio, cloud inference, model server, driver install or source push occurred.

## Exact open dependencies

1. A qualified inference-domain interpretation owned by canonical Formula. Its current executable registry has `raw-base64-v1` and `runtime-state-v1`; input encoding alone does not define a valid inference allocation policy. Host-read calibration is not reused as inference authority.
2. A Runtime Fabric inference binding that validates actual Formula evidence and supplies the request-scoped execution lease.
3. An actual LDWMD provider bridge that issues and releases the admitted GPU buffers under that lease.
4. A model/tokenizer/session-scoped Continuum binding, with independently verified write/readback/rollback.
5. Native graphics/compute driver integration and OS/runtime enumeration qualification. Read-only Win32_VideoController inspection listed Intel and NVIDIA, not a LeeWay display adapter.

Existing Runtime Fabric LDWMD and Continuum implementations were located and hashed, not duplicated or promoted. No new root, ModelHarness, Formula evaluator, memory database or Continuum registry was created.

## Evidence and rollback

Scoped pre-edit backups:
`E:\LeeWay-Work\evidence-staging\governed-inference-g8-20261016T174431113Z`

Final combined run (legacy runner directory name retained):
`E:\LeeWay-Work\evidence-staging\lee-only-inference-g7-20261016T180021359Z`

Readiness SHA-256:
`89b7fa6240e04e79ccef8131962b8c4204efee7a5704224492ad3a0e55201d8a`

Build observation SHA-256:
`3b074a18e43a7115076d9a64ccbfcc532014bfea507988d5609f873d8f9bbdf8`

Authority script before/after:
`f1ae97194f44e1384e32a736e6aa1126f026d7289576973b9b14edd22ce1843c`

Rollback is scoped to the backed-up files and explicitly added G8 files. Preserve all prior G0-G7 changes and evidence; never reset the dirty checkout or production runtime. The older raw inference test is historical and does not satisfy the current acceptance rule.

**Local diagnostic observations CREATED. Canonical execution receipt NOT CREATED. Learning Ledger NOT UPDATED.**

## Next smallest action

Implement and qualify the missing inference-domain interpretation in the existing Formula authority, then the corresponding Runtime/LDWMD/Continuum provider binding. Supply measured state and explicit calibration; do not invent a canonical mapping or treat a Golden fixture as an execution permit. Only then run the admitted LeeWay-owned graph, starting with correctness and proceeding to the largest inspected model. Native device enumeration remains a separate real-driver gate.
