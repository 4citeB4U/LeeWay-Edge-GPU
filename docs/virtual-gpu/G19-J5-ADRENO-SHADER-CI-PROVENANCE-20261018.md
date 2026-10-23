# G19 J-5 — Adreno shader build provenance diagnostic — 2026-10-18

## MASTER CHECKPOINT
Current gate: Fold6 Vulkan Q4_K model correctness BLOCKED. Continue J-5 Windows/Samsung only; J-7 Apple/Metal untouched. Creator requested documentation and issue/contributor synchronization. No production or driver changes authorized for this diagnostic.

## INVESTIGATE
- Inspected successful GitHub Actions run 39057469074 with `gh run view --log`, not merely the workflow source.
- Observed host package `libshaderc1` / `glslc` shaderc **2023.8-1build1** in the run log (2026-10-17T18:18:06Z).
- Log displays Ubuntu SPIR-V packages (spirv-headers 1.6.1+1.4.309.0-1~ubuntu0.24.04.2 and spirv-tools 2025.1~rc1-1~ubuntu0.24.04.2), with `glslc --version` printing `spirv-tools 2023.6~rc1-2` in the toolchain description. These should not be conflated.
- Android cross compiler logged Clang 18.0.3. Upstream llama.cpp pinned source HEAD c0fd78626405c6d9b934efef0ec7291fcc20e3d6.
- Workflow installs `glslc` via apt without a fixed package version. The historical run's resolved shaderc version is now established; a repeat runner may differ.
- Device `ro.gfx.driver.0` reports `com.samsung.gamedriver.sm8650`; this is a package identifier, not sufficient evidence of a Vulkan compiler internal version.
- Windows console `glslc` is not on PATH; that result does not prove its binary is absent elsewhere.
- Local Edge-GPU working tree has 109 porcelain status entries; preserved without cleanup or rewriting.

## DIAGNOSE
Qwen3 0.6B Q4_K_M on Fold6: CPU known-answer 2+2=4 PASS. Vulkan aborts in `ggml_vk_create_pipeline` for `mul_mat_vec_q4_k_f32_f32` with `vk::Device::createComputePipeline: ErrorUnknown`. Prior `GGML_VK_DISABLE_MMVQ=1` experiment failed identically. Thus generic MMVQ route suppression is not an effective repair. Compiler-produced SPIR-V / Adreno driver feature incompatibility is a hypothesis, NOT root-cause proof.

## PLAN / NEXT GATE
1. Capture and hash shader SPIR-V embedded in the exact CI-produced `libggml-vulkan.so`, or regenerate deterministically with the resolved shaderc version. Preserve exact source/build/compiler hashes.
2. Query physical Adreno Vulkan subgroup properties, extensions, workgroup and shader capabilities and compare them with the Q4_K pipeline specialization parameters. Gather shader creation diagnostic evidence if available.
3. In an isolated reversible branch/build only, change one proven failing shader generation dependency. Validate SPIR-V statically then on-device Qwen3 CPU/GPU exact-answer test, no CPU fallback.
4. Reconcile historical Formula VRAM working-set gains separately from any new speedup claim; bind canonical Runtime Fabric and Veritas only after correctness.

## TEST/VALIDATE
Earlier 8/8 G19 common GPU benchmark admission contract tests PASS; no new physical model run in this provenance diagnosis. Source/log evidence supports build provenance only.

## VERITAS
No production mutation, no driver or Apple changes, no canonical Formula evaluation, no governed Veritas PASS. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
