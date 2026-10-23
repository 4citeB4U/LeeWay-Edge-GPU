# G19 J-5 — GitHub Actions Android ARM64 Vulkan LLM build artifact verified
Date: 2026-10-17. Phone deployment: NOT PERFORMED. Physically executed Fold6 Vulkan language-model inference: NOT YET VERIFIED.

## Build completed
Repository https://github.com/4citeB4U/LeeWay-Edge-GPU
Draft review PR https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/2
Winning CI run https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39056421079
PR branch g19/fold6-vulkan-android-ci-20261017; CI build head commit 5e7f0a4d541abf3e4a202e1963fd48740455ce83.
Upstream llama.cpp pinned source revision c0fd78626405c6d9b934efef0ec7291fcc20e3d6.
Android NDK r27c, ARM64-V8A, Vulkan enabled, Android API level 28, Ubuntu host CMake shader-generation.
CI outcome SUCCESS after full native llama-cli build, Android ELF validation and GitHub artifact upload.

## CI artifact
GitHub artifact id 12109781437, name g19-fold6-arm64-vulkan-build; compressed GitHub ZIP digest published sha256:6edc46b746d3261232a7a9488e56c809c93cefb55bedc681f65bfae5c59cae72; available until 2026-10-31 per GitHub artifact expiry.
Downloaded with authenticated GitHub CLI into:
E:\LeeWay-Work\evidence-staging\g19-android-vulkan-github-verified
Unpacked tarball at same base/unpacked.
Model weights intentionally not included.

Artifact's SHA256SUMS has TEN entries. Independently rehashed each unpacked file with Python hashlib on Windows: 10/10 MATCH. Critical binaries:
- bin/llama-cli sha256 e75406d1240c5e3a39914a05278c7a95baa0e931c0713adaa94bfa2fdbc1442f
- bin/libggml-vulkan.so sha256 2ebc051edf589c29418b5174608269573f09363ed098a2ca4c125cb2fdc0ec0f
- bin/libggml-base.so sha256 7a6ecc559035bd1d956baf1a888049949650286ddf71f50a9e4c99182bf1c4d2
- All other seven .so shared dependencies matched provided manifest.
Independent NDK llvm-readelf -h: llama-cli and libggml-vulkan.so are ELF64 AArch64. Dynamic ELF NEEDED entries of CLI include libllama-cli-impl.so, libllama-server-impl.so, libmtmd.so, libllama-common.so, libllama.so, libggml.so, libggml-cpu.so, libggml-vulkan.so and libggml-base.so, all packaged. Vulkan .so requires libvulkan.so provided by Android platform, and libc, libm, libdl; no unexpected missing dependency found in manually inspected subset. Full phone-side linker validation remains required.

## Next physical acceptance gates
A. Under separately verified execution authority, stage vetted native ARM64 runtime plus EXACT same GGUF model in isolated phone sandbox and run *direct* physical Adreno 750 Vulkan inference, capture GPU adapter selection, output text, physical dispatch proof, actual model latency/tok/s, no fallback.
B. Then same native engine binary/weights/prompt/config through LeeWay Runtime Fabric authorization and dispatcher, capture Veritas/Formula receipts and multiple-run timings.
C. Only compute speedup after both successful same-path runs.
Candidate common GGUF: SmolLM2-360M-Instruct-Q8_0.gguf, 386405280 bytes, SHA256 c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b. Previous LiteRT-LM CPU 9491ms is different engine/artifact, and direct OpenCL GPU failed—neither is a valid like-for-like Vulkan comparison.

## Trace of failed iterations
Run 39051942810 obsolete SDK tools request FAIL.
Run 39052030460 missing SPIRV-Headers config FAIL.
Runs 39052136206, 39052242416 workflow YAML invalid, zero jobs; duplicated tail removed using PyYAML inspection.
Run 39055882142 native ARM64 build missing vulkan/vulkan.hpp FAIL.
Run 39056115730 native ARM64 build missing spirv/unified1/spirv.hpp FAIL.
Run 39056421079 SUCCESS with staged Vulkan plus SPIR-V C++ headers.
Prior Windows host build was blocked by Device Guard, not bypassed.

Scope integrity: PR remains draft, unmerged. No Android binary or model transferred as part of this new CI stage. Phone Pocket, Pocket.test, Device Bridge CPU model, restored voice, original LeeWay working tree, Apple J-7 and Windows security unchanged.
