# G19 J-5 — Same-binary Vulkan artifact reconciliation — 2026-10-18

## Investigate
Workstation checkout `E:\LeeWay-Work\LeeWay-Edge-GPU` visible again after prior ENOENT. Connected Samsung Fold6 ADB reports device, and `/data/local/tmp/g19-fold6-vulkan-test/bin/libggml-vulkan.so` still present.

Downloaded successful pinned-shaderc G19 CI run [39151783855](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39151783855), artifact ID `12145761643`, to isolated `E:\LeeWay-Work\evidence-staging\g19-pinned-shaderc-20261018`. Verified downloaded tar SHA256 `8161b70af0b0e56b79b74dc19a202ed7abb177f2e12c636d4f8a558f1cc91116` matches CI log.

## Crucial byte-identical comparison
`libggml-vulkan.so` from (1) newly pinned CI archive, (2) earlier successful CI archive at `evidence-staging\g19-android-vulkan-github-verified\unpacked\bin`, and (3) existing Fold6 test directory **all SHA256 identical**:
`2ebc051edf589c29418b5174608269573f09363ed098a2ca4c125cb2fdc0ec0f`.

## Diagnose
The shader compiler version pin and package assertions now reliably reproduce the historically compiled Vulkan library; the pin did **not** change the executable library bytes. Redeploying the unchanged library is not a fix and has not been attempted. Prior Qwen3 GGUF Q4_K CPU generated `2+2=4`; GPU `mul_mat_vec_q4_k_f32_f32` still fails at vk::Device::createComputePipeline ErrorUnknown. Root cause remains unverified.

## Plan → next smallest action
Inspect physical Adreno subgroup size, available capabilities and the Q4_K pipeline specialization path plus embedded shader SPIR-V validation; choose exactly one isolated reversible change based on evidence. Retest with identical verified GGUF, correct GPU response, and physical GPU attribution before acceleration claims. No driver replacement, model swap or unnecessary redeployment.

## Execution / evidence boundary
Read-only comparison, host artifact download, and append-only `CONTRIBUTORS.md` update; no phone binary mutation or production provider change. J-5 owns Windows/Samsung; J-7 Apple untouched. No canonical Formula invocation or Veritas receipt. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
