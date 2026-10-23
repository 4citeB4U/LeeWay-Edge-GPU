# G19 J-5 — SPIR-V extraction mechanism recovered — 2026-10-18

## Investigate
Inspected actual local pinned llama.cpp source at `E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\llama.cpp\ggml\src\ggml-vulkan\vulkan-shaders\vulkan-shaders-gen.cpp` (main at lines ~1395-1439) and companion `vulkan-shaders/CMakeLists.txt`. Confirmed this executable accepts `--glslc`, `--source`, `--output-dir`, `--target-hpp`, `--target-cpp`. At source line ~438 it forms `join_paths(output_dir, name + ".spv")`; it invokes `process_shaders()`, aborts on `compile_failed`, then `write_output_files()`. The CMake target builds native host-side `vulkan-shaders-gen` from `vulkan-shaders-gen.cpp`. The staged Windows Android build contains a `Release/vulkan-shaders-gen.exe`.

## Diagnosis
The absence of standalone `*.spv` files from the inspected final Android build directory is an artifact-location issue, not proof SPIR-V was never emitted. Shader generator outputs may be ephemeral, in another build directory or consumed into generated C++ data. The exact Q4_K embedded binary has NOT yet been extracted or validated.

## Smallest next action
Run the pinned generator only in a new isolated evidence directory using the previously audited compiler version, source path and explicit output/target paths; capture its exact CLI, exit code, generated shader filenames, SHA256, SPIR-V validator results and disassembled Q4_K specialization constants. If local host compiler differs from CI's shaderc 2023.8-1build1, document the mismatch and do not equate generated output to the CI-embedded bytes without a hash comparison.

## Test / verification status
Read-only source inspection PASS. No extraction attempt and no physical Q4_K pipeline retest this checkpoint. Existing Adreno 750 capability probes PASS; model Vulkan inference remains BLOCKED.

## Governance
J-5 Windows/Samsung only; J-7 Apple untouched. No phone runtime/model/driver mutation; no canonical Formula grant, Veritas receipt or Learning Ledger update.
