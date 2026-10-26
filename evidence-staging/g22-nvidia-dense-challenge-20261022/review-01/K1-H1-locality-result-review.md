# K1-H1 Run-02 Locality Result Review — 2026-10-22

**Work ID:** `K1-H1-LOCALITY-RESULT-REVIEW-20261022`  
**Reviewed evidence:** `E:\LeeWay-Work\LeeWay-Edge-GPU\evidence-staging\g22-nvidia-dense-challenge-20261022\run-02-locality`  
**Method:** read-only file hashing, chunked byte comparison, and median recomputation from saved timing samples. No benchmark, numerical oracle recomputation, source edit, GPU invocation, dependency install, or commit was performed.

This is K1-H1's independent evidence recheck. It is separate from the repository's existing `audit.json`/auditor result and does not rely on that auditor's conclusion.

## Acceptance result

| Check | Independent result |
|---|---|
| Current source manifest entries | 10/10 SHA-256 values match the files named in `source-manifest.json` |
| Patched worker source | `fallback/cpu.worker.js` SHA-256 `1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c` — matches expected |
| Run-01 versus Run-02 input/reference fixtures | 12/12 files byte-identical: A, B, and NumPy reference for four sizes |
| Measured raw outputs vs saved reference | 24/24 output files byte-identical to their same-size saved reference; 33,423,360 Float32 values compared |
| Measured raw output hashes vs saved `campaign.json` | 24/24 match |
| Run status | `COMPONENT_COMPARISON_COMPLETE_CANONICAL_PRODUCT_QUALIFICATION_OPEN` |

## Rechecked workload identity

The two runs used the same raw A, B, and reference bytes for all sizes. The four shared reference SHA-256 values are:

| Size | Reference SHA-256 |
|---:|---|
| 256 | `e2d4bfb54815597efd5cf30265829c99da8a88e9f2f95a51cc287295f83d09a1` |
| 512 | `ecbe7501144caee40e74c547ad30702e58f45789d072592e29481b4ecea1f9c7` |
| 1024 | `e92827a4b0a29c92d70df4bcfdd590cf137ea61c00736302ec111c8dcd807153` |
| 2048 | `6afb01515cd69ccdecc5ad2159b6d0b920b329dec874c7d6f9f0376b0419f48c` |

The saved specification declares dense row-major square `C = A × B`, Float32 input/output, signed small-integer fixtures, three measured repetitions, one warmup, and exact Float32 equality to a separate NumPy float64-matmul then float32-cast reference (`run-02-locality/specification.json:5-21`). The exact selected fixtures avoid an inference from this result to arbitrary Float32 rounding cases.

## Independent byte recheck

For each size, three LeeWay worker outputs and three NVIDIA baseline outputs were compared directly with the associated saved reference file. All 24 files had both matching SHA-256 and byte-for-byte equality.

| Size | Values per output | LeeWay outputs | NVIDIA outputs | Mismatching bytes/values observed |
|---:|---:|---:|---:|---:|
| 256 | 65,536 | 3/3 | 3/3 | 0 / 0 |
| 512 | 262,144 | 3/3 | 3/3 | 0 / 0 |
| 1024 | 1,048,576 | 3/3 | 3/3 | 0 / 0 |
| 2048 | 4,194,304 | 3/3 | 3/3 | 0 / 0 |

The 33,423,360 value count is the total across both lanes and all three measured samples. This review did not recalculate the independent oracle; it verified the retained bytes already produced by it.

## Median timing recheck

I recomputed the median of each three-sample set in `campaign.json`, rather than accepting its printed comparison fields.

| Size | LeeWay CPU worker median (ms) | NVIDIA cuBLAS median (ms) | LeeWay / NVIDIA time ratio | Observed winner |
|---:|---:|---:|---:|---|
| 256 | 36.8398 | 0.5378 | 68.501× | NVIDIA for this workload and lifecycle |
| 512 | 114.4982 | 1.0966 | 104.412× | NVIDIA for this workload and lifecycle |
| 1024 | 738.8119 | 3.4318 | 215.284× | NVIDIA for this workload and lifecycle |
| 2048 | 7,598.0897 | 10.1847 | 746.030× | NVIDIA for this workload and lifecycle |

Against Run-01's saved CPU medians on the same fixtures, Run-02's measured CPU medians are lower by factors of 1.389×, 1.688×, 3.295×, and 4.022× at 256, 512, 1024, and 2048 respectively. This is an observed run-to-run comparison after the locality patch. It does not isolate host scheduling, power state, JIT behavior, worker initialization, or other environmental effects, so it is not a general CPU performance claim.

## Source binding

The retained Run-02 source manifest uses `pinType: LOCAL_WORKING_BYTES_NOT_GITHUB_RELEASE`. At review time every one of its 10 listed source files matched its saved hash, including the Node worker engine/shim, patched CPU worker, tensor reference/contract, controller bridge, fixture generator, NVIDIA baseline helper, auditor, and campaign runner. It establishes the bytes used for this local campaign only; it is not a release, commit, or complete host attestation.

## Boundaries that remain

- The software candidate remains `NODE_CPU_WORKERS_ONLY`; the saved metadata says no Hugging Face or cloud GPU was used.
- NVIDIA is an authorized external comparison lane, not LeeWay execution. NVIDIA won every measured Run-02 case.
- The timing contract includes CPU worker startup/copy/termination, while CUDA context/handle initialization is excluded from baseline sample time. Both lanes include their stated transfer/readback lifecycle. This asymmetry is recorded in `specification.json:19-21`.
- The result is a raw dense-matrix component comparison. It does not verify the full Formula, Runtime Fabric, LDWMD, Continuum, canonical Veritas, receipt, Learning Ledger, production acceptance, OS-native device, virtual adapter, or model inference pipeline. The saved campaign explicitly marks all of those gates open/false.

## Evidence conclusion

**Verified for the stated fixture set:** the locality-patched CPU worker produced exact retained reference bytes at all four sizes, and the retained output and source records are internally consistent under this recheck.

**Not established:** broad speed superiority, arbitrary-Float32 equivalence, a governed LeeWay execution, or an Apple/Windows/Linux device-provider qualification.
