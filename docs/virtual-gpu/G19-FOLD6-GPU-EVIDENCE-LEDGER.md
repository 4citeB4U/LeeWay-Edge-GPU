# G19 J-5 — Fold6 Common GPU Model Benchmark: Evidence and CI Run Ledger

Updated 2026-10-17; **append new checkpoints rather than rewriting failure history**.

## Goal and comparison requirements

Direct physical Snapdragon/Adreno Vulkan model generation is the control. LeeWay must then run exactly the same native inference runtime binary and GGUF weights with the same prompt, sampling, context length and output token limit. Measure repeated completed runs (median prefill/generation timings, tokens/sec, GPU provenance, memory and thermal conditions). Reject comparisons if either path silently uses CPU fallback or lacks a completed response.

The prior phone test achieved real SmolLM2 LiteRT-LM CPU generation in 9.491s, with a 9.791s complete probe. The separate direct LiteRT-LM GPU attempt **failed to initialize OpenCL**; it generated no tokens (6.755s until failure), so no GPU-versus-LeeWay speed ratio exists. The physical Adreno Vulkan 256/256 kernel PASS proves basic Vulkan compute, **not** model inference.

The common-model candidate is SmolLM2-360M-Instruct Q8_0 GGUF, **386405280 bytes**, SHA256 `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b` (different artifact from the LiteRT-LM model). The Android arm64 candidate runtime is llama.cpp at pinned revision `c0fd78626405c6d9b934efef0ec7291fcc20e3d6` with Vulkan backend enabled.

## Build provenance and important distinction

The original Windows-based cross-build compiled a native Vulkan shader generator but Windows Device Guard blocked its execution; security policy was not changed. The separate GitHub Actions build is intended to run the Linux host shader generator under Ubuntu, while targeting Android arm64 via NDK r27c. **CI success can establish only a reproducible build artifact; it does not prove GPU execution on the Fold6.**

## Chronological GitHub Actions evidence

- [Run 39051942810](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39051942810): failed because Android setup action requested obsolete `tools` SDK package. Repaired by using runner preinstalled SDK and `sdkmanager`.
- [Run 39052030460](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39052030460): passed SDK/NDK and pinned source checkout, failed CMake on missing `SPIRV-HeadersConfig.cmake`. Added host package discovery and `-DSPIRV-Headers_DIR`.
- [Run 39052136206](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39052136206) and [run 39052242416](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39052242416): failed at workflow YAML validation, with zero jobs. Direct source inspection detected accidentally duplicated malformed YAML tail starting after the artifact step. Removed duplicate, validated corrected file with PyYAML (`YAML_OK 9 STEPS`).
- [Run 39055882142](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39055882142), head commit `144bff788b51694ac04fe79ddd894a1b9aa0b673`: **Android SDK, NDK, source fetch and CMake Vulkan configuration succeeded**; native `llama-cli` compilation running at last documented observation. Do not mark compiled or publish an artifact until run completes and checksums are inspected.

## Protection and scope

Review branch: `g19/fold6-vulkan-android-ci-20261017`; [draft PR #2](https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/2), unmerged. The repository's main-branch Fly.io workflow is outside scope; no merge or production deploy. GitHub CI includes no model weights, and no output binaries have been installed on the phone. Pocket, Voice Fabric, original CPU test, J-7 Apple lane, Windows Device Guard and the unrelated dirty Windows worktree remain untouched.

## Next evidence gate

Collect run 39055882142 outcome. If build succeeds, independently verify AArch64 ELF, Vulkan backend library and SHA256 manifest, compare pinned source commit and packaging, and document outcome. Only separately approved phone-side direct Adreno Vulkan model inference can establish physical GPU model performance. LeeWay-controlled same-path testing follows a confirmed direct GPU result.
