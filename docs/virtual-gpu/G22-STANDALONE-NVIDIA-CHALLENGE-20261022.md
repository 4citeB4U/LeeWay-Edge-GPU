# G22 — Standalone LeeWay software compute versus NVIDIA

Date: 2026-10-22. Contributors: K1, K2, K1-H1. Local engineering evidence; no GitHub publication, production acceptance, or native virtual-device qualification.

## Acceptance and outcome

The Creator requested a standalone LeeWay GPU, using existing LeeWay systems, and proof of outperformance on large dense parallel workloads. The measured LeeWay lane used the existing CPU square-matrix worker through the existing admission bridge and Node host shim. It made no NVIDIA, Hugging Face, or cloud-GPU call. The NVIDIA implementation was a separate comparison process, never a provider for LeeWay results.

**The performance acceptance gate failed in both the original and repaired campaigns: NVIDIA was faster at every tested size.** Both implementations produced correct results for all retained samples. This is a useful component comparison and a reproducible failure record, not a completed standalone GPU product or a full-pipeline certification.

### Original campaign — run-01

| Dense square dimension | LeeWay CPU worker median (ms) | NVIDIA median (ms) | Numeric mismatches |
| ---: | ---: | ---: | ---: |
| 256 | 51.1769 | 0.5548 | 0 |
| 512 | 193.2628 | 1.3638 | 0 |
| 1024 | 2434.5051 | 4.0796 | 0 |
| 2048 | 30561.3279 | 13.0235 | 0 |

Three measured samples per lane per size, plus warmups. In every case, even the slowest recorded NVIDIA sample was faster than the fastest LeeWay sample. Total measured outputs: 24 files containing 33,423,360 Float32 values, all compared with separate retained references.

Host: Windows x64, Intel Core Ultra 9 275HX, 24 logical CPUs; Node v24.15.0. The current LeeWay square worker uses one CPU worker. Baseline: NVIDIA GeForce RTX 5060 Laptop GPU, cuBLAS version 120803, `CUBLAS_PEDANTIC_MATH`. The benchmark ran from 06:29:12Z to 06:31:44Z on 2026-10-22.

### Locality repair and retest — run-02-locality

K1 repaired only the existing worker's square matrix loop: a bounded 32-column block reads contiguous B values, uses Float64 scratch accumulators in ascending k order, and stores each final result to Float32 once. This preserves the reduction order and rounding behavior of the old JavaScript Number implementation. The worker also rejects nonfinite Float32 output rather than returning success. Its tensor path, maximum dimension, transient lifecycle, cancellation mechanism, and provider boundaries remain unchanged. No dependency, worker pool, shared input, or physical GPU provider was added.

K2 and K1-H1 independently reviewed the exact patch and found no blocking issue. The staged regression file's relative import was tested only after it was placed in its final `tests/virtual-gpu` directory. Nine new numeric tests, eight existing Node-host tests, and eighteen existing tensor tests passed: **35/35**, no failures. Tests include sizes 31/32/33/65, non-integer values, signed zero, cancellation-sensitive summation, overflow rejection, host timeout/cancellation, and cleanup failures. These are Node checks, not browser or cross-platform qualification.

| Dense square dimension | Original LeeWay median (ms) | Repaired LeeWay median (ms) | Fresh NVIDIA median (ms) | Numeric mismatches |
| ---: | ---: | ---: | ---: | ---: |
| 256 | 51.1769 | 36.8398 | 0.5378 | 0 |
| 512 | 193.2628 | 114.4982 | 1.0966 | 0 |
| 1024 | 2434.5051 | 738.8119 | 3.4318 | 0 |
| 2048 | 30561.3279 | 7598.0897 | 10.1847 | 0 |

The 2048 median was about 4.02 times faster than the original retained run, but NVIDIA remained faster in every repaired sample. The two campaigns occurred at different times; this before/after observation is not a controlled attribution of every timing difference to the patch. The fresh campaign used the same fixture-generation policy and exact matching input bytes, the same comparison operation and timing boundaries, and the same three-pair protocol. It completed at 13:12:34Z on 2026-10-22. A further 24 output files / 33,423,360 values passed full comparison. The existing AuditAgent again checked 90 artifacts with source integrity scope only.

Original worker SHA-256: `9fb37229a24e77477b6f9d5f0ed4181dc1d6d6f705fa1e8b09d1254fccc95c07`; retained unchanged at `repair-01/cpu.worker.before.js`. Repaired worker SHA-256: `1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c`. Each campaign's own source manifest identifies the version it measured. The original manifest is historical and does not assert that the current worker still has the old hash.

## Existing capabilities reused

- Arithmetic: `fallback/cpu.worker.js`, measured before and after the localized square-kernel repair; the existing tensor reference remains separate.
- Node adapter: `fallback/node-cpu.engine.mjs` and `fallback/node-cpu.worker.mjs`, added earlier in G22 to host that existing worker.
- Admission: `control/gpu.controller.bridge.js` `executeGPU`, using an explicit diagnostic allowlist. This callback is not Formula or a Runtime Fabric grant.
- Independent artifact auditor: existing Runtime Standards `AuditAgent.auditAssignments` from `pc-consciousness-live/runtime/standards/src/agents/governance/audit-agent.js`, with the existing compliance scorer. No replacement audit authority was introduced.
- Existing Formula, Runtime Fabric, LDWMD, Continuum, Device Bridge, Veritas, and ledgers retain their ownership. Unbound production interfaces were not replaced by synthetic successful callbacks.

New comparison glue is in `tests/virtual-gpu/run-nvidia-challenge.mjs`, `dense-challenge-fixtures.py`, `nvidia-cublas-baseline.py`, and `audit-nvidia-challenge.mjs`. Paths are supplied through arguments or resolved relative to the repository; the baseline's exact device constraint intentionally scopes this campaign to the observed NVIDIA adapter.

## Workload, correctness, and timing

The operation is dense row-major `C = A × B`. Every input element is nonzero, selected deterministically from `[-2, -1, 1, 2]` with seed `20261022 + dimension`. Identical raw Float32 input files feed both implementations. A separate Python/NumPy CPU float64 multiplication, cast to Float32, supplies the full-output oracle. Small integer products and bounded sums are exactly representable for these dimensions. This does not qualify general floating-point accuracy or other tensor operators.

The independent oracle is verification infrastructure, not LeeWay's runtime implementation. The existing CUDA DLLs in the workstation's Ollama installation were loaded only by the baseline process; no model, Ollama inference service, library download, or dependency installation was used. Python/NumPy and CUDA are not dependencies of the LeeWay CPU worker.

Inputs were generated before the timed work. Each size was warmed; measured pairs alternated NVIDIA-first, LeeWay-first, NVIDIA-first. No CPU and NVIDIA workload was launched concurrently by this harness. The source specification was written before execution, and selected source hashes were checked before and after the campaign.

Both timings are host API round trips. LeeWay includes per-call worker startup, input snapshot/copy, admission, multiplication, response and termination. NVIDIA includes allocation, upload, SGEMM, synchronization, readback and free, but excludes CUDA context/handle initialization. File I/O and correctness checking are excluded from both timings. **The lifecycles differ.** No kernel-only or equal-initialization-cost claim is made; three repetitions do not establish a universal ranking or endurance result.

The retained specification proposed a raw workload win only when the worst LeeWay sample beat the best NVIDIA sample and every numeric check passed. No such win occurred.

## Reproduce the finite comparison

Run from the GPU repository with existing Node, Python/NumPy, CUDA DLLs, and the existing Runtime AuditAgent available. Replace the workstation bindings with authorized host paths. The evidence directory must be new.

```powershell
node tests/virtual-gpu/run-nvidia-challenge.mjs `
  --gpu-root 'E:\LeeWay-Work\LeeWay-Edge-GPU' `
  --evidence 'E:\LeeWay-Work\LeeWay-Edge-GPU\evidence-staging\g22-nvidia-dense-challenge-20261022\run-NEW' `
  --dll-dir 'C:\Users\Leona\AppData\Local\Programs\Ollama\lib\ollama\cuda_v12' `
  --audit-agent 'E:\LeeWay-Work\pc-consciousness-live\runtime\standards\src\agents\governance\audit-agent.js'
```

This invocation deliberately runs NVIDIA as the comparison target. LeeWay's software lane remains a CPU computation. No claim of OS-wide network/GPU isolation is made from the worker's JavaScript fetch, WebSocket, and navigator guards.

## Evidence and independent review

Evidence roots: `evidence-staging/g22-nvidia-dense-challenge-20261022/run-01` and `run-02-locality` under the same parent. The sibling `repair-01` preserves original source and the regression log.

- `specification.json`: pre-execution operation, bounds, timing, order and acceptance rule.
- `source-manifest.json`: 10 selected local source hashes; local working bytes, not a published GitHub release or complete runtime attestation.
- `fixtures/fixtures.json`: seeds, input/reference hashes and raw files.
- `campaign.json`: all 24 measured samples, comparison outcomes, execution identity and open gates.
- `nvidia/`: baseline device/library identity, DLL hashes, timings and raw readbacks.
- `artifact-manifest.json` and `audit.json`: existing AuditAgent verification of 90 recorded artifacts.

The existing audit returned `SOURCE_VERIFIED_EXECUTION_UNVERIFIED` and `productionAccepted:false`. Scope is `ARTIFACT_INTEGRITY_ONLY`; authority binding is `CALLER_SELECTED_UNVERIFIED`; the manifest is self-recorded and not independently anchored. Hash equality is not a digital signature or trusted execution attestation.

K2 independently recomputed all 24 output hashes and four reference hashes, checked medians and the 90-entry audit record, and acknowledged the failure result. K1-H1 independently compared all 24 output files byte for byte to retained references, recalculated 24 output and 12 input/reference hashes, checked all 10 selected source hashes, and recalculated medians. Neither review reran the matrix calculation or independently observed GPU commands. Their saved reports are preserved separately from the original 90-artifact audit snapshot.

Both contributors also reviewed `run-02-locality`: K2 rehashed all 90 manifest artifacts and checked output/reference hashes and patch identity. K1-H1 compared all 24 new outputs byte for byte to retained references, checked all ten selected source hashes, and confirmed all twelve A/B/reference files were byte-identical between the two campaigns. Both acknowledged the same losing performance result. Those reviews are stored under sibling `review-01`; the finalization manifest binds them and this report without representing a canonical signed receipt.

## Canonical qualification still open

The measured lane is not the assembled governed product. These gates remain unbound for this campaign:

1. Request-specific Runtime Fabric execution grant.
2. Approved canonical Formula workload decision.
3. Independent Veritas PRE.
4. Production LDWMD memory lease.
5. Owner Continuum retention.
6. Canonical Veritas POST and receipt.
7. Receipt Ledger and Learning Ledger admission.
8. OS-visible virtual graphics/compute device implementation and isolated qualification.

The full intended chain remains Runtime Fabric → Formula → Veritas PRE → LDWMD → Compute → Independent Readback → Continuum → Veritas POST → Receipt Ledger → Learning Ledger. A new allowlist, file hash, or benchmark label does not close these gates. The canonical Formula v1 recovered here is 16×6; no verified canonical 16×16 replacement was found. Matrix workload sizes do not alter that authority.

Existing Audit Triad and Standards certification mechanisms were inventoried rather than recreated. The Triad requires real trusted host callbacks and authority bindings that this campaign does not provide. Existing survivability/enterprise policy gates do not certify this dense computation. LeeWay80 has no qualified binding to these samples. No certification was awarded.

Separate audit repair finding: `pc-consciousness-live/runtime/standards/scripts/Invoke-LeeWayRuntimeAttestationGate.ps1` uses SHA-256 fields labeled as receipt signatures and writes `signed:true` without demonstrating a digital-signature operation. That module was not used to attest this campaign and was not changed. Its owning contributor must repair the signature claim or bind a real trusted signer before it can serve as cryptographic evidence.

## Diagnosis, completed repair, and next gate

The original square kernel was a scalar `i,j,k` loop, reading B with a column stride in one transient worker. The repair improves that locality with a fixed column block, preserving Number accumulation. The repaired path still does not use CPU SIMD, multiple compute workers, or LDWMD-managed parallel scheduling. The result measures these actual implementations, not every possible LeeWay algorithm.

The first locality repair is implemented and retested. The next parallel execution change needs an explicit lifecycle and memory admission contract before a pool or multiworker split is introduced; the existing browser WorkerManager is not safe to adopt unchanged for concurrent Node requests. Production assembly also needs the real canonical authority bindings above. Preserve ordered reduction/precision, input snapshots, cancellation, memory limits, and truthful CPU identity. Keep both failed performance campaigns. Do not substitute cached outputs, sparse/structured work, reduced precision, or another GPU's arithmetic for the requested dense software workload.

4096/8192 were not executed because the existing square worker is capped at 2048. No 30-minute soak, large concurrent queue, other GPU model, graphics API compatibility, energy-efficiency comparison, or cross-platform product acceptance was measured. A CPU implementation can be independent of a physical GPU while still consuming host CPU, RAM and execution time. This evidence does not establish freedom from all physical resource constraints.

No host driver, signing key, firewall, security setting, reboot, Git commit, or push was performed. The success gate remains open; the current evidence does not prove LeeWay outperforms NVIDIA.
