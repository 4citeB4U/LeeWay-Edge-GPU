# G19 J-5 — Qwen3 replacement model acquisition and Vulkan qualification — 2026-10-18

## Authority/scope
Creator requested a substantially different model and authorized download if necessary. Isolated Windows staging and existing Fold6 /data/local/tmp test directory only. No production Pocket/voice, driver, Runtime Fabric, J-7 Apple, or security change.

## New selected model
Qwen3-0.6B Q4_K_M GGUF by QuantFactory, 484220000 bytes. Publisher file: https://huggingface.co/QuantFactory/Qwen3-0.6B-GGUF/blob/main/Qwen3-0.6B.Q4_K_M.gguf .
Downloaded to `E:\LeeWay-Work\evidence-staging\g19-qwen3-vulkan-model\Qwen3-0.6B.Q4_K_M.gguf`.
Local `certutil -hashfile ... SHA256` returned `7af3fdf842f87b24672f8a7f1dd50404043f0bfb71093ff91c31d2b49df4631d`, matching publisher. ADB push to `/data/local/tmp/g19-fold6-vulkan-test/Qwen3-0.6B.Q4_K_M.gguf` completed; device-side rehash not yet performed.

## CPU test
Same pinned llama.cpp phone build `b1-c0fd786` and existing test CLI; `--offline --single-turn --simple-io --no-display-prompt -c 512 -n 32 --temp 0 --seed 69 -ngl 0 -sys helpful -p 2+2=?`.
Model loaded; generated coherent reasoning prefix about question but 32 token cap stopped before exact final answer. Process exit 0, prompt 57.9 t/s, generation 20.1 t/s. CPU correctness INCONCLUSIVE, not PASS.

## GPU test
Identical settings except `-ngl all`. Vulkan pipeline creation during model setup failed:
`ggml_vulkan: compute pipeline creation failed for mul_mat_vec_q4_k_f32_f32: vk::Device::createComputePipeline: ErrorUnknown`.
Native process aborted, exit code 1. No Qwen GPU tokens generated. This establishes a concrete Q4_K compute-pipeline failure, not inherently CPU-only weights.

## Next smallest action
Read-only inspect pinned ggml-vulkan shader `mul_mat_vec_q4_k_f32_f32` capability requirements and driver diagnostics. Do not attempt driver replacement, policy bypass or claim GPU PASS. For CPU correctness retest disable thinking (if model/template supports it) or raise output budget without changing other settings. Independently hash phone GGUF and preserve logs before any GPU source repair. Use smallest local isolated shader/quantization repair only after cause proven.

## Authority/receipt
No canonical Formula/Runtime grant or Veritas issuer bound. No governed Veritas PASS. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
