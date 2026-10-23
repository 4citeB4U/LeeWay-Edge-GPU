# G19 J-5 — Q4_K SPIR-V artifact inventory — 2026-10-18

## Investigate / Diagnose
The pinned llama.cpp source `c0fd78626405c6d9b934efef0ec7291fcc20e3d6` contains `ggml/src/ggml-vulkan/vulkan-shaders/mul_mat_vec_q4_k.comp`; the GLSL starts with #version 450, uses GL_EXT_shader_explicit_arithmetic_types_int32 and includes `mul_mat_vec_base.glsl`. The source pipeline registration passes shader variants `arr_dmmv_q4_k_f32_f32_len[reduc16]` and `arr_dmmv_q4_k_f32_f32_data[reduc16]` to Vulkan. Reduction mode selects subgroup, hybrid or shared-memory depending on subgroup capabilities/workgroup selection, as earlier verified.

## Test
Non-destructive inventory of Windows `E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\build-android-vulkan` found no standalone `*.spv` files and no files with `q4_k` in filename; a shader generator executable exists. This is an artifact-location observation, not evidence that Q4_K shader is missing from the built `libggml-vulkan.so`. The library SHA256 is already verified identical between pinned CI and device. No driver or phone GPU inference was executed in this checkpoint.

## Next smallest action
Extract exact embedded Q4_K shader arrays from pinned generated headers/build intermediates or run the pinned shader generator in a separate evidence-only directory using audited shaderc version. Hash extracted SPIR-V, validate with spirv-val, enumerate capabilities and specialization constants with spirv-dis, and compare to measured Adreno subgroup limits. If extraction requires a rebuilt binary, preserve previous byte-identity comparison and avoid unsupported attribution. Only then test a reversible code change.

## Authority and governance
J-5 Windows/Samsung only; J-7 Apple unaffected. The historical Formula GPU working-set research and Fold6 Vulkan correctness gates remain separate. No runtime grant, canonical Veritas receipt or Learning Ledger update.
