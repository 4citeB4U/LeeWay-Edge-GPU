# K2 independent saved-evidence review — 2026-10-22

Reviewed `E:/LeeWay-Work/LeeWay-Edge-GPU/evidence-staging/g22-nvidia-dense-challenge-20261022/run-01` after execution. This review reads existing records and recomputes file hashes; it did not rerun the benchmark or independently observe execution.

The campaign contains exactly four sizes, with three recorded CPU worker and three separate NVIDIA baseline samples per size. I independently recomputed SHA-256 for all 24 output files and four saved references. Each output hash matches its case reference and its recorded hash; each recorded comparison says zero mismatches and reports the expected size-squared element count. This proves equality of the retained output bytes to the retained reference, not independent recomputation of the reference or GPU command attestation.

| Square size | CPU median ms | NVIDIA median ms | NVIDIA slowest ms | CPU fastest ms | Recorded winner |
| --- | ---: | ---: | ---: | ---: | --- |
| 256 | 51.1769 | 0.5548 | 0.7748 | 48.6063 | NVIDIA |
| 512 | 193.2628 | 1.3638 | 1.4431 | 191.7319 | NVIDIA |
| 1024 | 2434.5051 | 4.0796 | 4.2117 | 2109.5536 | NVIDIA |
| 2048 | 30561.3279 | 13.0235 | 13.0776 | 30324.9377 | NVIDIA |

Recomputed medians and the stated non-overlap rule agree with the recorded winners for all cases. These are recorded host timings for these inputs and distinct lifecycles, not a broad GPU or product ranking. The campaign separately labels the software lane as CPU workers and the baseline as a separate NVIDIA CUDA process.

The self-recorded artifact manifest contains 90 entries; the audit result contains 90 entries, all reporting `VERIFIED_ARTIFACT`. I recomputed the manifest hash and confirmed it matches `audit.json`. The 24 outputs and four reference hashes were independently recalculated as above; I did not independently rehash every other artifact. The audit scope is `ARTIFACT_INTEGRITY_ONLY`, authority binding `CALLER_SELECTED_UNVERIFIED`, assignment `SOURCE_VERIFIED_EXECUTION_UNVERIFIED`, and `productionAccepted:false`. These self-recorded hashes are not a trusted signature or an independent execution attestation.

`campaign.json` retains `canonicalPipelineVerified:false`, `osNativeDeviceVerified:false`, `productionAccepted:false`, and `broaderNvidiaSuperiorityProven:false`; it lists Runtime Fabric grant, Formula decision, Veritas pre/post, LDWMD, Continuum, receipt ledger and learning ledger among unbound gates. This review does not change those states or qualify an OS-visible LeeWay GPU. No certification or inference claim is supported.
