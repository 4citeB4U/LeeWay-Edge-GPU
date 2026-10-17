# G19 Fold6 Android Vulkan build-only CI

Purpose: compile an **Android ARM64 llama.cpp Vulkan runtime** in GitHub Actions, without installing anything on the Fold6, changing host Device Guard policy, using any model weights in CI, or affecting Pocket/Voice Fabric. This isolates the Windows Device Guard shader generator block observed on 2026-10-17.

## Scope and provenance

- Workflow: `.github/workflows/g19-fold6-android-vulkan.yml`.
- Pinned upstream llama.cpp commit: `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`.
- Ubuntu 24.04 hosted runner builds the shader generator with host compiler and ARM64 inference binaries with Android NDK 27.2.12479018.
- Enables `GGML_VULKAN=ON`; builds `llama-cli`; checks binary is Android AArch64 and requires `libggml-vulkan.so` in the output.
- Artifact includes CLI and associated native shared libraries, SHA256 sums and explicit qualification status; artifact retention 14 days.
- Pull request and manual dispatch triggers only; does not trigger the repository's existing main-branch Fly.io deployment. Workflow has read-only contents permission. **Never merge without owner approval**, because main has an existing deployment workflow.

## Same-model benchmark contract

The actual phone benchmark must use the same exact SmolLM2 GGUF on direct and LeeWay-controlled paths:

- Model: `SmolLM2-360M-Instruct-Q8_0.gguf`.
- Size: **386405280** bytes.
- SHA256: `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b`.
- Same prompt, context, sampling, token limit and engine/binary digest.
- Direct route: native Vulkan llama.cpp on Adreno 750, **no** LeeWay dispatcher.
- Controlled route: exactly the same native llama.cpp+Vulkan code and model under request-scoped LeeWay authority; require backend provenance, nonfallback GPU dispatch and output.
- See `contracts/g19-fold6-common-gpu-model-benchmark.mjs` in local J-5 staging for candidate admissibility; do not assert the contract is published or its policy is production-integrated.

The prior LiteRT-LM CPU run generated one correct model response in 9491ms, but it uses a *different model format/engine* and is not comparable to a GGUF Vulkan GPU timing. The prior direct LiteRT-LM GPU test failed on OpenCL loading and produced no tokens. Previous physical Adreno Vulkan 256/256 test is a shader test, not language-model GPU inference.

## Stage gates

1. **CI build**: build completes and emits signed-by-checksum binaries with AArch64/Vulkan provenance (build proof only).
2. **Owner-reviewed artifact**: independent inspection of SHA256s, source commit and runtime dependencies; Android compatibility still unproven.
3. **Phone execution** (separate explicit permission): copy only approved files to isolated staging and run local direct Vulkan model; capture generated text, tokens, timings, backend and GPU utilization; deny silent CPU fallback.
4. **LeeWay execution**: same binaries/model and settings, route through LeeWay authorization; compare multiple successful completed outputs and measured variance, with Veritas evidence.
5. **Production deployment**: **out of scope**.

Never bypass OS policy, deploy to phone from CI, use unpublished credentials, or claim independent physical GPU or speedup from a build-only artifact.
