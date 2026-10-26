# G19 J-5 shader generator compiler mismatch checkpoint — 2026-10-18

## Investigate
Connected Agent-Lee and Fold6 ADB. Pinned host shader generator at E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\build-android-vulkan\Release\vulkan-shaders-gen.exe exists (314368 bytes). Pinned shader GLSL mul_mat_vec_q4_k.comp is present.

## Diagnose
The local C:\VulkanSDK\1.4.363.0\Bin\glslc.exe reports shaderc v2026.4 (SPIR-V 1.0 target). Audited successful GitHub Actions run 39151783855 used shaderc 2023.8-1build1. A local rebuild with the SDK compiler would be a cross-compiler comparison, NOT a binary-equivalent reconstruction of CI-embedded SPIR-V. A change in output could not be attributed solely to Adreno without controlled conditions.

## Plan
First recover generated Q4_K shader bytes from matching 2023.8-1build1 CI or reproducible isolated environment, or extract embedded bytes from the verified CI library; hash/disassemble/spirv-val. Only then compare with 2026.4 as controlled difference. Preserve original runtime and Qwen3 reference.

## Test / Verify
Read-only local compiler version probe and generator file checks PASS. No SPIR-V regenerated, no phone binary changes, no new GPU model test. Vulkan correctness remains BLOCKED.

## Evidence and ownership
J-5 Windows/Samsung, J-7 Apple untouched. No production/security/driver changes, canonical Veritas receipt or Learning Ledger entry.
