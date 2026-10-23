# G19 J-5 — Fold6 embedded template investigation and matched CPU/Vulkan retest — 2026-10-18

## Scope
Read-only source/metadata inspection and isolated phone inference test. J-5 Windows/Samsung lane. Production components, phone Pocket, drivers, security settings, and J-7 Apple work unchanged.

## Source and metadata
Pinned llama.cpp checkout HEAD `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`. GGUF metadata extracted with bundled upstream gguf-py: `general.architecture=llama`, `tokenizer.ggml.model=gpt2`, `tokenizer.ggml.pre=smollm`. `tokenizer.chat_template` is ChatML-like Jinja: if first message is not system, prepend `<|im_start|>system\nYou are a helpful AI assistant named SmolLM, trained by Hugging Face<|im_end|>\n`; iterate role/content with im_start/im_end; when add_generation_prompt append `<|im_start|>assistant\n`.

Pinned `tools/cli/cli-context.cpp`: `-p` is read as user-message text, `push_user_message(cur_msg)` adds it to structured conversation and `generate_completion` uses completion client/local spawned server. Consequently preformatted ChatML passed via `-p` risks double wrapping, but prior bare prompt did not contain ChatML; no double-wrap root cause established. Actual fully rendered server prompt/token IDs not captured.

## Live matching isolated tests
Both device-local under `/data/local/tmp/g19-fold6-vulkan-test/bin`:
`LD_LIBRARY_PATH=. ./llama-cli -m ../SmolLM2-360M-Instruct-Q8_0.gguf --offline --single-turn --simple-io --no-display-prompt -c 512 -n 32 --temp 0 --seed 69 -sys helpful -p 2+2=?`
CPU: add `-ngl 0`; GPU: add `-ngl all`.
Phone `SM-F956U`; model GGUF and llama.cpp binary reused (file digest was not rehashed during this checkpoint).

CPU output: `The answer to the equation 2+2 is 4.`; prompt 27.8 t/s, generation 26.4 t/s; exit 0. **OBSERVED correctness PASS for this one CPU prompt**.
GPU output: `IN` followed by repeated apostrophes; prompt 28.5 t/s, generation 48.0 t/s; exit 0. **FAIL response correctness**.

Earlier bare-prompt CPU and GPU both failed. Explicit system prompt differentiates behavior, but does not isolate a root cause. The exact constant `helpful` is a deliberate one-word CLI override, not the GGUF's native default text. The CPU/GPU commands match except `-ngl`.

## Gate
Backend divergence persists. Hypotheses: Vulkan shader/operator correctness, KV cache, device-specific precision, or template/tokenization behavior; none confirmed. Do not compare speeds as validated benchmark or claim LeeWay advantage. Next: inspect active server-side rendered prompt/token IDs; CPU/GPU logits for same first token and GPU offload trace, and compare a vetted independent CPU reference if needed. Preserve pinned source and binaries. Governed Formula/Runtime Fabric/Veritas issuer and LDWMD remain unbound.

## Execution evidence boundary
This is direct diagnostic execution with console outputs seen in the run; not a canonical Veritas PASS. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
