# G19 J-5 — Fold6 common direct GPU / LeeWay controlled GPU model path checkpoint

2026-10-17. Creator directed phone-first direct physical Adreno GPU model generation, then same exact model/runtime path under LeeWay control, to measure actual value. J-5 read latest contributors ledger before beginning. No Apple J-7 lane, Pocket, voice, or driver mutation.

## Validated common model artifact
Staged `E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\SmolLM2-360M-Instruct-Q8_0.gguf` (386405280 bytes; SHA256 `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b`). Digest matches publisher's SHA256 for bartowski/SmolLM2-360M-Instruct-GGUF Q8_0. It is a **different quantized GGUF artifact** from the prior 373719040-byte LiteRT-LM model, so previous LiteRT-LM CPU 9.491s is NOT a like-for-like GGUF engine baseline; must rerun both direct/LeeWay modes using this same exact GGUF.

Upstream llama.cpp source in isolated staging (Git checkout commit `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`); release archive also staged under source/llama.cpp-master. NDK r27c Clang 18.0.3 / arm64-v8a API 28, Vulkan SDK 1.4.363.0, CMake 4.4.4, Ninja 1.13.2. Android Vulkan library and SPIR-V tools were detected by CMake.

## Real cross-compile blockers
1. Initial CMake needed existing `SPIRV-Headers_DIR=C:/VulkanSDK/1.4.363.0/Lib/cmake/SPIRV-Headers`; configured successfully.
2. Vulkan's host shader-generator was incorrectly compiled as a Windows executable using Android Clang; failed Windows library linking. Created an isolated MSVC host toolchain and regenerated. Host shader generator built with MSVC 19.44.35229.0, Android target continued compiling with NDK.
3. Actual host shader-generator process at `E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\build-android-vulkan\Release\vulkan-shaders-gen.exe` was **blocked by Windows Device Guard policy** with process exit code 4551 while generating .comp shaders. Build stopped at this security boundary. Do **NOT** weaken Windows security policy, rename/copy executable to evade policy, attempt system permissions bypass, or claim Android Vulkan LLM binary is built. No new Vulkan llama executable or GGUF model transferred to Fold6.

## Existing device evidence
- Fold6 native Qualcomm Adreno 750 Vulkan shader 256/256 calculations previously PASS (not a model).
- LeeWay Device Bridge installed and SmolLM2 LiteRT-LM Backend.CPU() actually generated response `12 packages - 5 packages delivered = 7 remaining.` in 9491ms (different artifact/engine).
- Independent direct physical GPU model attempt using same LiteRT-LM model with Backend.GPU() failed to load OpenCL library; vendor libOpenCL.so physically exists but wasn't found by that app. No GPU text response, no GPU inference throughput figure.

## New independent acceptance boundary
Added `contracts/g19-fold6-common-gpu-model-benchmark.mjs` and .test.mjs, synthetic tests 8/8 PASS after fixing inverse direct-route condition. Requirements: same SHA256 model, same engine/version/binary hash, prompt, context 512, output budget 48, temperature 0, seed 69; verified Adreno Vulkan GPU dispatch without CPU fallback, completed generated tokens, direct hardware route with no LeeWay, and LeeWay route with genuine Runtime Fabric request grant and correlated receipt. Returns NOT COMPARABLE until BOTH real GPU runs complete. Synthetic passing results **do not** attest hardware or canonical governance.

## Next acceptable route
Use a trusted, auditable Android arm64 Vulkan-capable inference build, produced through an authorized/sanctioned builder or a vetted official release whose provenance and compatibility are independently verified. Do not install unvetted third-party binary. Qualify direct phone GPU generation first; then wrap the identical engine/model/digest in LeeWay's authorized dispatcher and repeat multiple runs. Measure median prefill and generation tok/s, 10-run spread, hardware adapter, memory and thermals. Independent provenance and Formula/Runtime Fabric/Veritas required for canonical PASS.

Current status: `GGUF_MODEL_VERIFIED`; `ANDROID_VULKAN_MODEL_BINARY_BLOCKED_BY_DEVICE_GUARD`; `DIRECT_ADRENO_GPU_MODEL_INFERENCE_NOT_EXECUTED`; `LEEWAY_SAME_PATH_GPU_COMPARISON_NOT_EXECUTED`. No GPU speedup or claimed benefit. Do not assume security policy can be bypassed.
