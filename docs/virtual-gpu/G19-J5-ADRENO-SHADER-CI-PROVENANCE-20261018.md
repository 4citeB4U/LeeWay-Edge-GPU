# G19 J-5 — Adreno shader compiler provenance (2026-10-18)

## Scope
Creator directed continued inspection and contributor synchronization. J-5 owns Windows/Samsung. J-7 Apple untouched. No production, driver, phone application or security modifications.

## New verified build provenance
Read successful GitHub Actions run 39057469074 directly via `gh run view --log` on connected Windows workstation. Ubuntu runner installed host shaderc/glslc **2023.8-1build1**; logged Android target compiler Clang 18.0.3. SPIR-V headers apt package 1.6.1+1.4.309.0-1~ubuntu0.24.04.2. Installed spirv-tools apt package 2025.1~rc1-1~ubuntu0.24.04.2, while `glslc --version` advertises spirv-tools 2023.6~rc1-2 as build component; do not conflate those versions. Workflow obtains glslc from apt without an exact package pin, so future builds need provenance lock or artifact comparison. Pinned upstream llama.cpp commit `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`.

Device graphics driver package property `ro.gfx.driver.0=com.samsung.gamedriver.sm8650` is a package identifier; not enough to prove driver internal compiler version. Windows shell cannot find `glslc` on PATH, which does not imply absent SDK compiler.

## Persistent failure
Fold6 Qwen3-0.6B Q4_K_M CPU known answer 2+2=4 PASS, Vulkan Q4_K `mul_mat_vec_q4_k_f32_f32` compute pipeline creation `vk::Device::createComputePipeline: ErrorUnknown` FAIL. Existing `GGML_VK_DISABLE_MMVQ=1` experiment failed identically. SPIR-V/driver compatibility remains HYPOTHESIS, not verified root cause.

## Engineering loop / next smallest action
Investigated CI logs, source and device identification; diagnosed exact pipeline boundary. Next inspect and hash embedded SPIR-V from known CI `libggml-vulkan.so`, capture Adreno subgroup/feature properties, compare against shader specialization. Only then alter one isolated reversible shader generation variable; validate SPIR-V and run GPU known-answer correctness with CPU reference and no CPU fallback. Existing G19 synthetic admission test 8/8 PASS is not a live GPU receipt.

## Evidence and restrictions
Full local record in `E:\LeeWay-Work\LeeWay-Edge-GPU\docs\virtual-gpu\G19-J5-ADRENO-SHADER-CI-PROVENANCE-20261018.md`. Contributor ledger appended without modifying its prior entries. Local Edge-GPU worktree had 109 git porcelain entries and was not cleaned. No canonical Formula/Runtime Fabric execution or Veritas PASS. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
