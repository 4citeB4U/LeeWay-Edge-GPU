# G19 J-5 — Adreno Q4_K subgroup diagnostic checkpoint — 2026-10-18

## Investigate
Physically connected Fold6 ADB confirmed. Existing library in isolated phone test directory retained, no binary replacement. Inspected pinned llama.cpp source c0fd78626405c6d9b934efef0ec7291fcc20e3d6 at `ggml/src/ggml-vulkan/ggml-vulkan.cpp` around lines 2888–2904 and 2941.

## Diagnosis
The Q4_K `mul_mat_vec_q4_k_f32_f32` pipeline selects compiled shader `arr_dmmv_q4_k_f32_f32[reduc16]`, subgroup-size-derived workgroup sizes, and may request `force_subgroup_size16`. `use_subgroups16` is conditional on subgroup arithmetic, supported minimum 16 and driver exception logic. A fallback shared-memory reduction variant exists by construction. **Actual device subgroupSize, supported stages/operations, subgroup size control, min/max and shader pipeline diagnostics were NOT collected**. Existing native Android `vulkan-probe/main.cpp` contains no `VkPhysicalDeviceSubgroupProperties` or `vkGetPhysicalDeviceProperties2` query; `vulkaninfo` not found on connected phone PATH. Thus no grounds yet to choose subgroup or shared-memory patch.

## Test / validation
Read-only source and device inventory verified; no model generation or modified shader executed this checkpoint. Previously verified GPU Q4_K pipeline failure and CPU correct answer remain authoritative to their timestamps.

## Next smallest implementation
Add *isolated additive* Vulkan feature probe using `vkGetPhysicalDeviceProperties2` chaining `VkPhysicalDeviceSubgroupProperties` and, when supported, `VkPhysicalDeviceSubgroupSizeControlProperties`. Report adapter vendor/device IDs, subgroup size, stages, operations, quad operations, min/max, and max workgroup subgroup counts. Build separately and run only in authorized scratch directory, preserving the existing GPU runtime. Then compare reported feature values to Q4_K pipeline specialization, select one reversible fallback test, and retest correctness. Do not infer unsupported features from device name.

## Governance
J-5 Windows/Samsung only; J-7 Apple untouched. No production changes, model swap, drivers, or security changes. Canonical Veritas receipt not created; Learning Ledger not updated.
