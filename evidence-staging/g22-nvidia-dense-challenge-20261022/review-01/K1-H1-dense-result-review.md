# K1-H1 — dense NVIDIA result independent recheck

Date: 2026-10-22. Read-only inspection of `E:/LeeWay-Work/LeeWay-Edge-GPU/evidence-staging/g22-nvidia-dense-challenge-20261022/run-01`. No workload or oracle was recomputed.

## Retained evidence verification

- Measured output files: 24/24; exact raw-byte comparison against retained NumPy-reference files; output samples contain 33,423,360 float32 values in total.
- Input and reference SHA-256: 12 files checked; sample SHA-256: 24 files checked.
- Source bytes: 10/10 match the retained local working-tree source manifest. This does not establish a GitHub release or runtime attestation.
- Errors: 0.

| Square dimension | CPU median ms | NVIDIA median ms | NVIDIA / CPU time | CPU / NVIDIA time |
| ---: | ---: | ---: | ---: | ---: |
| 256 | 51.1769 | 0.5548 | 0.010841 | 92.24× |
| 512 | 193.2628 | 1.3638 | 0.007057 | 141.71× |
| 1024 | 2434.5051 | 4.0796 | 0.001676 | 596.75× |
| 2048 | 30561.3279 | 13.0235 | 0.000426 | 2346.63× |

Medians and ratios were independently recalculated from the three retained samples per lane and checked against the recorded ratios. All output bytes matched their retained reference, and all recorded NVIDIA sample times were below all CPU sample times for each dimension.

## Boundaries

The NumPy float64 reference is a separate implementation recorded by the campaign. This audit compared retained bytes and hashes; it did not independently rerun NumPy or recompute the matrix products. The CPU measurement includes a transient worker lifecycle; the NVIDIA measurement uses a warmed CUDA context and excludes context initialization. These are host round-trip timings, not equal-lifecycle kernel-only comparisons. This component comparison does not establish Formula, Runtime Fabric, LDWMD, Continuum, Veritas, receipt-ledger or Learning Ledger execution, OS-native virtual GPU, or broad superiority across workloads.

## Errors

None.
