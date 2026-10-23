# G19 J-5 — Formula GPU reconciliation and correctness gate (2026-10-18)

## Authority
Creator directed engineering-loop continuation, measured acceleration as acceptance and contributor/issue sharing. J-5 Windows/Samsung only; J-7 Apple untouched. No production mutations.

## Investigate
- Existing Formula repo 4citeB4U/Leeway-formula-live, GPU-VRAM domain and September 22 GPU ladder report 11.182x GPU VRAM working-set reduction (3,191,582,227 to 285,411,901 bytes) at one GPU layer. Generation 137.37 → 20.94 tok/s. This is **not** model compression or inference acceleration.
- Historical paired closed-loop campaign reports 9.87% generation improvement; historical result, not reproduced in this G19 session.
- September 22 dual CPU/GPU record reports a distinct GPU warm case with lower client/load latency and generation -5.59%; do not substitute these modes or mix their denominators.
- Fold6 G19 actual CPU Qwen3 0.6B Q4_K_M correctly returned 2+2=4 with reasoning off. Adreno Vulkan Q4_K pipeline still aborts at `mul_mat_vec_q4_k_f32_f32` during vk::Device::createComputePipeline ErrorUnknown. Earlier physical Adreno kernel 256/256 readback proved physical compute, not model correctness.
- G19 draft PR #2 retains original build-only evidence and remains unmerged. Local Windows Edge-GPU working tree contains concurrent modifications; not cleaned or overwritten.

## Test
Reran existing `node --test contracts/g19-fold6-common-gpu-model-benchmark.test.mjs` on the live Windows workstation: **8/8 pass**, exit 0. These synthetic admission regressions reject missing physical GPU execution, mismatched model digest/binary, and unsupported comparative PASS. They are NOT a live GPU model success.

## Diagnosis
Formula repo contains decision mathematics and historical experimental results. Edge-GPU repo contains native physical execution providers and G19 evidence boundaries. Neither alone proves a single canonical governed GPU path. Current exact gate remains Vulkan Q4_K shader pipeline compilation, then correct generated answer; compiler-SPIR-V/adreno subgroup hypothesis still unverified.

## Plan / smallest next action
Recover exact glslc/shaderc/SPIR-V build provenance and physical Adreno subgroup requirements from successful CI and on-device observations. Isolate candidate shader fault; only then make a bounded patch in a separate build with rollback, exact engine/model/prompts and CPU reference. Once GPU correctness passes, rerun direct versus LeeWay governed comparisons using identical model bytes, engine, thermal conditions, GPU adapter, VRAM, load, prefill, generation, and latency. Canonical Runtime Fabric grant and Veritas issuer/reader remain to be bound.

## Receipt / restrictions
No new runtime Formula execution, canonical Veritas PASS, or Learning Ledger entry. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED. J-7 Apple, production Pocket, Voice, driver, Device Guard and production UI unchanged.
