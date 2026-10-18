# G19 J-5 — Pinned shaderc CI build acceptance (2026-10-18)

## Investigate and validate
Run [39151783855](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39151783855) concluded SUCCESS on head commit `3f15de46b70a8662e89ff028348c6595b4e762d8`. Exact compiler packages `glslc=2023.8-1build1`, `libshaderc1=2023.8-1build1` installed and assertions passed. The build produced Android arm64 Vulkan runtime and uploaded its review-only artifact.

## Evidence hashes
- `/usr/bin/glslc` SHA256 `71d72c98dc379daa3a7727740fcdd418e6f0426c8f8662b32018eba7e699bbc7`
- Build `g19-fold6-arm64-vulkan-build.tar.gz` SHA256 `8161b70af0b0e56b79b74dc19a202ed7abb177f2e12c636d4f8a558f1cc91116`
- Uploaded artifact ZIP SHA256 `84dfd7d39b88de04798531870c2c891135de144bc196d8ade8217b9dd7a20ea9`

## Diagnosis
The missing shader compiler pin is repaired and qualified by actual CI execution. The prior Fold6 Adreno Q4_K `mul_mat_vec_q4_k_f32_f32` pipeline creation ErrorUnknown remains unresolved. Successful build does not imply GPU model correctness, correct SPIR-V runtime behavior, Formula-governed acceleration, or Veritas receipt.

## New local-state discrepancy
Desktop Commander remains online but `Test-Path E:\LeeWay-Work\LeeWay-Edge-GPU` returned False in this session, despite earlier successful writes to that location. The attempt to append to local `CONTRIBUTORS.md` returned ENOENT. Do not recreate/move/overwrite directories without local path rediscovery. GitHub PR issue discussion is the current surviving shared contributor ledger for this checkpoint.

## Next smallest action
Confirm currently mounted Windows workspace and locate existing checkout non-destructively. Inspect binary-embedded SPIR-V/Adreno subgroup requirements using captured CI artifacts, then conduct isolated physical-device correctness test once runtime staging and authority are re-established. No production GPU provider, drivers, Phone Pocket, Apple J-7, or security changes.

## Governance
No canonical Veritas execution receipt. Learning Ledger not updated.
