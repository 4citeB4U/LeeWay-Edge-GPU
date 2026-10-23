# G19 J-5 — Q4_K SPIR-V generation and validation — 2026-10-18

## Investigate → Diagnose
Pinned llama.cpp shader generator exists, source mul_mat_vec_q4_k.comp exists. Audited CI uses shaderc 2023.8-1build1 while local Vulkan SDK glslc reports shaderc v2026.4. Local generator can produce comparison candidates only; they cannot be described as byte-identical CI SPIR-V.

## Plan → Implement
Invoked pinned host vulkan-shaders-gen.exe in an isolated workstation folder E:\LeeWay-Work\evidence-staging\g19-q4k-spirv-candidate-20261018 with explicit --glslc pointing to C:\VulkanSDK\1.4.363.0\Bin\glslc.exe, --source pointing to pinned mul_mat_vec_q4_k.comp, --output-dir and --target-hpp/--target-cpp confined to that folder. Generator exit 0; nine .spv files produced (q4k f32/f16 and ID flavors, with shared memory, subgroup and subgroup_no_shmem variants).

## Test → Diagnose → Repair → Retest
First spirv-val command used --target-env vulkan1.1. It failed 9/9 with explicit error: SPIR-V version 1.5 exceeds Vulkan 1.1 environment SPIR-V 1.3. This was a validation-command environment mismatch, not proof shader binaries were bad.
Retested all nine with spirv-val --target-env vulkan1.2: 9/9 VALID, zero invalid.
Disassembled mul_mat_vec_q4_k_f32_f32_subgroup.spv. Capabilities include Shader, Int8, GroupNonUniform, GroupNonUniformArithmetic, StorageBuffer16BitAccess and StorageBuffer8BitAccess. Specialization IDs 0, 1, 2 observed.
SHA256:
- mul_mat_vec_q4_k_f32_f32.spv ab0d087f463e87e21cefb8707b0cd41a452074492293263db66cc642b32b48b4
- mul_mat_vec_q4_k_f32_f32_subgroup.spv 625771c9f05548d74b72bd2793d9d6d7afe1d31d44c8850e347e206e98c1068b
- mul_mat_vec_q4_k_f32_f32_subgroup_no_shmem.spv 85bf7a2555dfb3567377f91bba4a1011ba24ba65c5243a9cf5575b862d4a19e6

## Verify / evidence boundary
SPIR-V static validation PASSED for new shaderc 2026.4 candidate variants. Not a physical Vulkan pipeline creation test, not proof of existing CI shader identity, not successful Qwen3 generation, and not measured Formula acceleration. Next gate extract or regenerate with audited shaderc 2023.8 and hash/compare, then try one reversible isolated pipeline repair backed by exact evidence.

## Scope
Windows evidence-only outputs. Existing Fold6 runtime, models, drivers, Pocket and J-7 Apple untouched. No canonical Veritas receipt or Learning Ledger entry.
