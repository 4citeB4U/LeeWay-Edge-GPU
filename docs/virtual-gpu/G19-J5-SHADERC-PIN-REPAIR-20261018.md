# G19 J-5 — Audited shaderc CI pin repair — 2026-10-18

## MASTER CHECKPOINT
Current G19 physical Fold6 GPU model correctness: BLOCKED. Creator authorized repairing the identified reproducibility gap; only isolated G19 CI branch touched. J-5 Windows/Samsung; J-7 Apple untouched.

## INVESTIGATE
Successful October 17 CI run 39057469074 logged glslc/shaderc 2023.8-1build1. The workflow installed unversioned glslc and libshaderc1 via apt, while target NDK Clang was pinned. Qwen3 Fold6 CPU known-answer 2+2=4 previously PASS; Adreno Vulkan Q4_K mul_mat_vec_q4_k_f32_f32 pipeline creation ErrorUnknown previously FAIL. Build compiler drift was a reproducibility defect, not a proven root cause.

## DIAGNOSE / PLAN
Expected: build reproduces audited shader compiler and records compiler binary identity. Observed: apt could select latest available unpinned build. Smallest repair: require exact observed glslc and libshaderc1 package versions and fail closed if unavailable; emit glslc executable SHA256. No driver, shaders, model, memory policy, production source, security, or phone mutation.

## IMPLEMENTATION
Updated only `.github/workflows/g19-fold6-android-vulkan.yml` on `g19/fold6-vulkan-android-ci-20261017` with exact apt package constraints, dpkg version assertions, `glslc --version`, and `sha256sum $(command -v glslc)`.
Commit `a9e936beeae48b264327daf571a76b71966f5268`.

## TEST / VALIDATE
Read back GitHub workflow at branch and confirmed pin, assertions, and checksum line. CI run 39151675715 triggered for exact commit and was in progress during checkpoint. A pending run is not PASS. Earlier synthetic model benchmark admission tests 8/8 PASS but do not establish GPU inference success.

## NEXT GATE
Inspect CI run conclusion and actual compiler checksum. If build passes, compare shader SPIR-V and physical Adreno subgroup limits, then one isolated, reversible runtime correctness test. If fails, diagnose exact dependency error, repair only that. No performance or Formula-governed speedup assertion before correct GPU response.

## VERITAS
No canonical Veritas execution receipt and no Learning Ledger entry. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
