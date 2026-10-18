# G19 J-5 — Physical Fold6 Adreno subgroup capabilities — 2026-10-18

## Authority and loop
Owner directed begin Vulkan subgroup diagnosis for failing Q4_K inference. J-5 Windows/Samsung only. Investigate → Diagnose → Plan → Implement → Test → Validate → Verify → Evidence. No production runtime, driver, system security, Voice, Pocket, or J-7 Apple modifications.

## Source diagnosis
Pinned llama.cpp `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`, `ggml/src/ggml-vulkan/ggml-vulkan.cpp` near lines 2888–2904 and 2941. Q4_K mat-vec pipeline uses `arr_dmmv_q4_k_f32_f32[reduc16]` and subgroup-derived workgroup specialization `{wg_size_subgroup16,rm_kq,i+1}`. The selection `use_subgroups16` requires device subgroup arithmetic and viable subgroup size at least 16; exact `force_subgroup_size16` depends on that path. Inference previously failed during Vulkan pipeline creation with ErrorUnknown.

## Isolated implementation and physical test
Created `E:\LeeWay-Work\evidence-staging\g19-pinned-shaderc-20261018\subgroup-probe.cpp`, compiled with NDK 27.2.12479018 `aarch64-linux-android28-clang++.cmd -std=c++17 -O2 ... -lvulkan`. Standalone app calls `vkCreateInstance`, enumerates physical Vulkan devices, requires Qualcomm vendor 0x5143, calls `vkGetPhysicalDeviceProperties2` with `VkPhysicalDeviceSubgroupProperties`, prints reported capabilities, destroys instance.
- Probe executable SHA256 on Windows and Fold6: `7362d37211a8ac0fd11cac4e25454f427797057d9c37546082310efa78d201cf` (MATCH).
- Physical stdout: `vendor=20803 device=1124406273 name=Adreno (TM) 750 api=4206720 subgroupSize=64 supportedStages=0x30 supportedOperations=0xbf quadOperationsInAllStages=0`.
- Exit 0. `supportedStages=0x30` includes Vulkan compute stage; `supportedOperations=0xbf` includes subgroup arithmetic (0x04).
- Removed only the isolated probe executable. `PROBE_CLEANUP_VERIFIED`. Existing `llama-cli`, model and libggml-vulkan unchanged.

## Validate and diagnosis
Real Adreno 750 subgroup size is 64 and compute subgroup arithmetic supported. Therefore missing basic arithmetic support is not established as root cause. The test **does not** query Vulkan subgroup-size-control extension feature or min/max properties; it does not test the exact Q4_K SPIR-V pipeline. Driver compilation, required subgroup size and specialization remain open. No performance or inference PASS asserted.

## Next smallest action
Inspect subgroup-size-control support and pipeline specialize/create flags, workgroup size limits, and compiled Q4_K SPIR-V variant. Build a single reversible isolated shader path correction only after unsupported assumption is proven; compare GPU to previously passing CPU exact-answer Qwen3 test with same GGUF digest, seed and settings and explicit physical-GPU attribution.

## Veritas
No runtime Formula grant or canonical Veritas receipt. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
