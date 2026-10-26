# K2 locality campaign review — 2026-10-22

Reviewed saved evidence only: `E:/LeeWay-Work/LeeWay-Edge-GPU/evidence-staging/g22-nvidia-dense-challenge-20261022/run-02-locality`. No benchmark, test, GPU operation, or source modification was performed by K2.

## Repair identity and regression evidence

The saved source manifest identifies `fallback/cpu.worker.js` SHA-256 `1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c`. It matches the staged repair and the present promoted worker byte-for-byte. The prior staging import concern is resolved in the saved regression log: it imports and runs `E:/LeeWay-Work/LeeWay-Edge-GPU/fallback/cpu.worker.js`, its intended final location. `repair-01/regression-tests.log` records 35 tests passed, 0 failed, including the new 32-column boundary, ordered-rounding, signed-zero, nonfinite-result, host cancellation, timeout, and tensor checks. This is retained test evidence, not a new K2 execution.

## Saved component comparison

| Size | Run-01 CPU median ms | Locality CPU median ms | Reduction | Locality NVIDIA median ms | Saved winner |
| ---: | ---: | ---: | ---: | ---: | --- |
| 256 | 51.1769 | 36.8398 | 28.01% | 0.5378 | NVIDIA |
| 512 | 193.2628 | 114.4982 | 40.76% | 1.0966 | NVIDIA |
| 1024 | 2434.5051 | 738.8119 | 69.65% | 3.4318 | NVIDIA |
| 2048 | 30561.3279 | 7598.0897 | 75.14% | 10.1847 | NVIDIA |

The four expected sizes each retain three CPU samples and three NVIDIA samples. I recomputed SHA-256 for all 24 output files and four reference files. Every output equals its saved reference and saved sample hash; all saved mismatch counts are zero and element counts equal size squared. NVIDIA's slowest saved sample remains below the CPU's fastest saved sample for every size, agreeing with every bounded winner. This is a host round-trip comparison for the recorded dense workload and distinct lifecycles only.

## Audit and claim boundary

The artifact manifest has 90 entries and all current entries rehash to their saved values. `audit.json` has 90 `VERIFIED_ARTIFACT` outcomes, `SOURCE_VERIFIED_EXECUTION_UNVERIFIED`, `scope: ARTIFACT_INTEGRITY_ONLY`, and `productionAccepted: false`. Source hashes cover selected working bytes and remain self-recorded, not a trusted release pin or signature.

The campaign retains `canonicalPipelineVerified:false`, `osNativeDeviceVerified:false`, `productionAccepted:false`, and `broaderNvidiaSuperiorityProven:false`, with Formula, Runtime Fabric, Veritas, LDWMD, Continuum, receipt, and learning gates listed unbound. The CPU lane remains `NODE_CPU_WORKERS_ONLY`; the NVIDIA lane remains a separate Python CUDA baseline. The repair therefore qualifies only the retained local software-component improvement and output agreement. It does not qualify a product pipeline, a native OS adapter, model inference, or a broad NVIDIA claim.
