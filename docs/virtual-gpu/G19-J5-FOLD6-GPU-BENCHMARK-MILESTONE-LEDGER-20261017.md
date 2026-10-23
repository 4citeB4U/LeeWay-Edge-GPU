# G19 J-5 — Fold6 GPU Model Benchmark Milestone Ledger
Updated: 2026-10-17 (in-progress validation).

## Acceptance goal
1. Verify direct physical Adreno 750 native Vulkan GPU inference on Fold6 with an actual model response, no LeeWay dispatch.
2. Verify EXACT SAME GGUF bytes, llama.cpp engine binary, prompt and runtime settings through LeeWay-controlled request-scoped dispatch on Fold6.
3. Compare repeated successful runs and record execution latency/tokens per second, provenance, phone thermal/memory and receipt evidence; no gain asserted until both pass.
4. Preserve Pocket, restored voice and J-7 Apple integration; no Windows Device Guard changes.

## Earlier physical evidence
- LeeWay Device Bridge LiteRT-LM Backend.CPU() SmolLM2-360M 373719040 bytes SHA256 8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e: physical Fold6 response correct, model elapsedMs 9491, total elapsedMs 9791.
- Direct LiteRT-LM Backend.GPU() with SAME LiteRT file: failed initializing GPU via OpenCL; no generated tokens. On-phone vendor libOpenCL.so present, but not visible to that runtime.
- Earlier Adreno 750 Vulkan shader computation 256/256 correct; proves native Vulkan math, NOT language-model GPU inference.
- To eliminate backend mismatch, switched common candidate to llama.cpp ARM64 Vulkan backend and SmolLM2 Q8_0 GGUF model 386405280 bytes SHA256 c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b. Do not compare old LiteRT run to GGUF directly.

## CI project
GitHub repo: https://github.com/4citeB4U/LeeWay-Edge-GPU
Draft PR: https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/2
Review branch: g19/fold6-vulkan-android-ci-20261017
Pinned source: llama.cpp c0fd78626405c6d9b934efef0ec7291fcc20e3d6
Workflow: .github/workflows/g19-fold6-android-vulkan.yml
Artifact gate: Android AArch64 llama-cli, libggml-vulkan.so, SHA256SUMS, upstream commit and no-deploy qualification record.

## Run chronology
- 39051942810: FAIL: setup-android@v3 attempted obsolete sdkmanager package tools. Corrected workflow to use Ubuntu runner installed SDK tools directly.
- 39052030460: FAIL: Android CMake cross-compile could not locate host SPIRV-HeadersConfig.cmake. Added host SPIRV-Headers path discovery and -DSPIRV-Headers_DIR.
- 39052136206: FAIL before any job (invalid YAML from malformed patch).
- 39052242416: FAIL before any job (duplicated malformed trailing YAML block). Recovery: checked current file via GitHub API, parsed via PyYAML, removed duplicate second half on commit 144bff788b51694ac04fe79ddd894a1b9aa0b673; Python YAML_OK 9 steps. Preserve these failures as evidence; not successful builds.
- 39055882142: fresh pull_request run from YAML-validated commit 144bff788b51694ac04fe79ddd894a1b9aa0b673. Initial setup and SDK checks PASS; Android NDK install in progress at last observation. Further result must be checked before marking any compile PASS.

## Safeguards
- PR remains draft/unmerged. Main's Fly.io deploy workflow is not triggered by review branch.
- No model weights in CI; no artifacts sent to phone; no phone model launch or inference under Vulkan llama.cpp yet.
- Local Windows llama.cpp build was stopped by Windows Device Guard blocking newly generated shader tool; no security bypass.
- Windows LeeWay main working tree contains unrelated concurrent changes: DO NOT overwrite/commit those.
- Voice Fabric, Pocket/Pocket.test, Device Bridge CPU test and Apple J-7 unaffected.
- Authored synthetic common GPU benchmark admission tests 8/8 PASS, not physical GPU results.

## Required next steps
Observe run 39055882142 through shader generation/ARM64 binary packaging, inspect any failure logs, fix on review branch, record new commit/run IDs, independently review artifact checksums/ABI. Only then propose separate phone staging of vetted binary, first direct Vulkan inference, then matching LeeWay-controlled Vulkan inference and multi-trial metrics. Do not claim speedup before both completed.

## Additional CI findings after initial ledger checkpoint
- 39055882142: real build reached ~219/545 objects; native Android clang could not find Khronos vulkan/vulkan.hpp header; added staged /usr/include/vulkan architecture-independent headers via explicit CMAKE_CXX_FLAGS include path. 
- 39056115730: with Vulkan headers, build reached new error spirv/unified1/spirv.hpp missing; added staged /usr/include/spirv architecture-neutral SPIR-V C++ headers. This proves iterative compiler dependency discovery, not model inference. 
- 39056421079: latest PR run from head commit 5e7f0a4d541abf3e4a202e1963fd48740455ce83. SDK/NDK, upstream source, header staging, Android ARM64 Vulkan config all PASS. Native llama-cli Vulkan compilation still in_progress at last checked 2026-10-17 13:08 CDT. Artifact absent/unverified until CI completes. 
- Verified GitHub workflow parsing by PyYAML after the previous duplicated tail removal. No phone/model operations, Device Guard change, main deployment, voice, Pocket, or Apple lane modification. All draft PR #2.

