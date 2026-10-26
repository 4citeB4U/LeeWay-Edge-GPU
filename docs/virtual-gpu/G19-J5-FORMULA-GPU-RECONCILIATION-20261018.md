# G19 J-5 — Formula GPU reconciliation and next correctness gate — 2026-10-18

## Master checkpoint / authority
Creator requires measured acceleration, engineering loop, written evidence, collaborator synchronization. J-5 Windows NVIDIA/Intel and Samsung Adreno; J-7 Apple/Metal unchanged. Scope: inspect and run existing read-only contract tests; no production source/driver/security/phone application changes.

## Investigate / evidence
1. Formula research repository 4citeB4U/Leeway-formula-live, docs/domains/GPU-VRAM.md and experiments/real-model-qwen3-v1/GOLDEN-FORMULA-GPU-ACHIEVEMENT-LADDER-20260922.json: documented 11.182x GPU-resident VRAM working-set reduction (3,191,582,227 to 285,411,901 bytes), at 1 GPU layer. This is NOT model-size reduction and NOT inference speedup. Throughput dropped from 137.37 to 20.94 gen tokens/s in that ladder.
2. Same domain documentation reports one paired window +9.87% generation and +15.67% client improvement, historical result not rerun this session.
3. Formula dual CPU/GPU 20260922 record distinguishes CPU/GPU lanes and notes warm GPU policy reduced latency but generation throughput dropped 5.59% in its dual-lane sample. Historical experiments are not universal claims.
4. LeeWay-Edge-GPU G19 Fold6 live evidence: SmolLM2 Q8_0 CPU answered correctly with explicit prompt but GPU output malformed; Qwen3 0.6B Q4_K_M same-GGUF CPU with reasoning off answered 2+2=4; Vulkan GPU aborts on mul_mat_vec_q4_k_f32_f32 createComputePipeline ErrorUnknown. Physical Adreno 750 kernel readback previously PASS. No LeeWay-governed Fold6 run.
5. Windows local Edge GPU Git tree remains dirty and concurrent. E:\LeeWay-Work\Leeway-formula-live folder absent. Avoid replacing or merging either canonical authority based on filenames.
6. G19 draft PR #2 exists and prior CI artifact comment #6238366183 is historical build-only evidence.
7. Executed unchanged node --test contracts/g19-fold6-common-gpu-model-benchmark.test.mjs on Windows: 8/8 PASS, exit 0; these are synthetic admission tests, NOT GPU inference or Formula acceleration verification.

## Diagnose
Two distinct layers: Formula mathematical decisions and historical experimental policy evidence, versus Edge-GPU physical execution/adapters. Neither substitutes for canonical Runtime Fabric grant or Veritas signed receipt. Present G19 gate blocked at Adreno Vulkan Q4_K pipeline creation and GPU response correctness. A speculative shader compiler/SPIR-V incompatibility is NOT confirmed as root cause.

## Plan
A. Preserve J-5/J-7 ownership and old research evidence.
B. Obtain shader build provenance: exact glslc/shaderc/SPIR-V binary hashes, physical Adreno subgroup properties, and pipeline creation diagnostics, without changing GPU provider.
C. Rebuild ONLY an isolated pinned shader/artifact after cause is supported and rollback is simple; compare CPU/GPU deterministic response to 2+2=4 under matching model bytes/context/seed/sampling and no CPU fallback.
D. Only after correctness passes compare native versus Formula-governed paths with identical engine/model/thermal conditions, report latency, tokens/s, memory residency, transfer burden and variability.
E. Connect real Formula execution and Runtime Fabric/Veritas issuer/reader before any governed PASS.

## Test / validate / verify
8/8 existing benchmark contract tests PASS; GitHub historical research and PR inspected; production inference gate still FAIL/BLOCKED. The 11.18x result must only be labeled GPU VRAM working-set reduction, and +9.87% generation is a historical study window, not G19 or Fold6 acceleration.

## Receipt
No canonical Veritas receipt. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
