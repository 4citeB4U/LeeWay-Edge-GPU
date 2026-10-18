# G19 J-5 — Fold6 Vulkan subgroup-size-control physical evidence — 2026-10-18

## Engineering loop
Investigate: prior Q4_K pipeline failure and confirmed subgroup 64. Diagnose: previously unmeasured subgroup-size-control properties may affect forced subgroup shader. Plan: create additive read-only isolated Vulkan properties/feature probe. Implement: compiled Android ARM64 probe with NDK r27c in Windows evidence staging. Test: physically run on Fold6. Validate: Windows/device SHA256 match; output and successful process exit. Verify: remove isolated executable and confirm cleanup. Evidence: this checkpoint.

## Actual measurement
Physical adapter: Adreno (TM) 750, vendor 20803, device 1124406273.
- subgroupSize=64, supportedOperations=0xbf, supportedStages=0x30.
- VK_EXT_subgroup_size_control extension present (ext=1).
- subgroupSizeControl feature=1, computeFullSubgroups feature=1.
- minSubgroupSize=64, maxSubgroupSize=128.
- maxComputeWorkgroupSubgroups=16.
- requiredSubgroupSizeStages=0x20 (compute).
- maxComputeWorkGroupInvocations=1024.
Probe hash Windows/phone: `4081df32e1080378640501f2d870f230a46fcf34601ed91a550bb7abe872efd8`. Output obtained via ADB; isolated probe deleted; PROBE_CLEANUP_VERIFIED.

## Diagnosis / bounds
Adreno 750 supports the native subgroup width 64 and Vulkan subgroup-size-control for compute. These results reject generic absence of subgroup size control as explanation for Q4_K pipeline creation failure. They do not prove exact specialization dimensions, compiled Q4_K SPIR-V validity under Adreno driver, shader operation compatibility, or model correctness. Prior pinned Qwen3 GPU attempt `mul_mat_vec_q4_k_f32_f32` `createComputePipeline ErrorUnknown` still BLOCKED.

## Smallest next action
Inspect pinned `ggml-vulkan.cpp` Q4_K pipeline specialization constants, reduction shader SPIR-V and relevant maxComputeWorkGroupSize[]/shared-memory limits. If all limits fit, isolate the actual driver/shader compiler failure and choose one reversible shader reduction fallback. Do not make unsupported speedup claims or modify production driver/Pocket/J-7 Apple. Require physical GPU known-answer PASS before acceleration tests.

## Governance
No runtime Formula grant, canonical Veritas receipt, or Learning Ledger update.
