# G19 J-5 — Q4_K workgroup specialization boundary — 2026-10-18

## Investigate / Diagnose
Pinned llama.cpp `c0fd78626405c6d9b934efef0ec7291fcc20e3d6` source `ggml/src/ggml-vulkan/ggml-vulkan.cpp` was inspected in the isolated upstream checkout. Lines around 2860–2904 show Qualcomm follows default `rm_kq=2`, `subgroup_size=64`, `subgroup_size16=64`, `force_subgroup_size16=64` when device subgroup arithmetic is present. Lines around 2917–2941 show Q4_K shader mode selection: subgroup for small workgroups, hybrid for large workgroups, shared-memory fallback otherwise; specialization constants `{wg_size_subgroup16, rm_kq, i+1}`.

## Physical limits compared
Prior physical Adreno probe recorded subgroup=64, min=64 max=128, requiredSubgroupSizeStages compute, size control=1, full subgroups=1, maxComputeWorkGroupInvocations=1024.
For this source path, standard `wg_size_subgroup16=64`, large `wg_size_subgroup16=256`; both are below physical 1024 invocation limit. This rules out a basic subgroup-size range or total workgroup-invocation limit mismatch. It does NOT prove per-axis workgroup limits, specialization-specific shader validity, or actual compiled pipeline viability.

## Test / Validate
Ran read-only PowerShell assertions against pinned source. `Q4K`, `SubgroupBranch`, `HybridBranch`, `SharedFallback`, `Specialization` all true; process exit 0. Static/source check only: 5/5 checks PASS, not GPU inference.

## Next smallest action
Extract exact Q4_K shader variants from build-generated SPIR-V (or deterministically regenerate using pinned shaderc). Run spirv-val and inspect capabilities/specialization constants. Compare to physical Vulkan properties. Only then select one reversible isolated shader variant and retest same-GGUF CPU/GPU 2+2=4 correctness. Do not infer driver bug without negative pipeline test.

## Engineering governance
No phone binary/model change; J-7 Apple untouched; production and host drivers unchanged. Formula execution and canonical Veritas receipt not issued. Learning Ledger unchanged.
