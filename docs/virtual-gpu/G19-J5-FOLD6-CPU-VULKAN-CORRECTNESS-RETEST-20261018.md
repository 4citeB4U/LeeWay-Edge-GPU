# G19 J-5 — Fresh Fold6 CPU/Vulkan correctness retest — 2026-10-18

## Authority and scope
Creator instructed continuation after the G19/J5 reconciliation. Windows/Samsung J-5 lane only. Apple/J-7 source, production Pocket, voice, security policy, and Windows GPU drivers remain unchanged. Existing dirty Windows local GPU tree preserved. This document records direct ungoverned testing, not canonical Veritas evidence.

## Inspected state
- Live Windows Desktop Commander endpoint `Agent-Lee` available; ADB identified SM-F956U (`RFCX70LNT7X`).
- Isolated Android test directory `/data/local/tmp/g19-fold6-vulkan-test` contains `SmolLM2-360M-Instruct-Q8_0.gguf`, `bin/llama-cli`, `libggml-cpu.so`, `libggml-vulkan.so`, etc.
- Existing handoff identifies model SHA256 `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b` and upstream llama.cpp build `c0fd786`. SHA not freshly rehashed in this run.
- `llama-cli --help` documents `--single-turn`, model-metadata `--chat-template`, `--temp`, `--seed`, and `-ngl`.

## Fresh test inputs
Both invoked from `/data/local/tmp/g19-fold6-vulkan-test/bin` using `LD_LIBRARY_PATH=.`, identical GGUF, `--offline --single-turn --simple-io --no-display-prompt -c 512 -n 32 --temp 0 --seed 69 -p 2+2=?`.

- CPU variation: `-ngl 0`.
- Vulkan offload variation: `-ngl all`.
- Model CLI reports `build b1-c0fd786`, `ftype Q8_0`.

## Observed outputs
- CPU: nonsensical mixed words/characters; `Prompt: 13.0 t/s | Generation: 10.5 t/s`; command exit 0, runtime 8.30 s.
- Vulkan: `IN` followed by repeated apostrophes; `Prompt: 31.3 t/s | Generation: 16.6 t/s`; command exit 0, runtime 7.53 s.
- Both FAIL exact-answer requirement `4`. Token generation and exit status do not establish model correctness. GPU offload was requested, but this specific retest did not independently collect a full per-layer dispatch trace; use prior traced evidence for physical Vulkan attribution.

## Diagnosis and gate
Reproduction on two backends increases suspicion of a shared tokenizer/metadata/prompt/quantization/engine compatibility issue, but root cause remains UNVERIFIED. Unlike the historical LiteRT-LM test, these two tests use the same GGUF and llama.cpp binary. Do not interpret 16.6/10.5 as LeeWay improvement.

NEXT SMALLEST ACTION: inspect GGUF tokenizer/chat-template fields and exact llama.cpp prompt rendering, compare generation to a known-good reference on identical model bytes, and only then rerun identical CPU/GPU known-answer acceptance. If outputs become correct, qualify repeated performance. Canonical Runtime Fabric grants, Veritas issuer/reader and LDWMD receipts remain unbound.

## Receipt statement
These are direct diagnostic execution observations. No canonical Veritas PASS receipt was issued. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED. No app install, driver change, repository local-tree cleanup or Apple modifications.
