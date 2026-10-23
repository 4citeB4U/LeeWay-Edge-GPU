# G19/J5 Fold6 — Same-engine CPU/GPU correctness gate (2026-10-18)

## Purpose and authority
Continue the Creator-approved isolated G19 direct GPU benchmark. Existing Agent Lee Pocket, Voice Fabric, and older llama installation stay untouched. No production merge or LeeWay-governed execution authorized by this record.

## Pre-test observations
- Desktop Commander Agent-Lee online; adb connected Fold6 SM-F956U.
- Existing isolated test executable at `/data/local/tmp/g19-fold6-vulkan-test/bin/llama-cli`.
- Phone model hash independently rechecked by `adb shell sha256sum`: `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b` (GGUF SmolLM2-360M-Instruct-Q8_0).
- Runtime build remains `b1-c0fd786`, Android ARM64, llama.cpp source `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`.

## Exact paired tests
Both tests used `LD_LIBRARY_PATH=/data/local/tmp/g19-fold6-vulkan-test/bin`, model `/data/local/tmp/g19-fold6-vulkan-test/SmolLM2-360M-Instruct-Q8_0.gguf`, `-p 2+2=? -n 24 -st --temp 0 --log-verbosity 2`.

1. **Vulkan test**: `-ngl 99`. Process terminated after single turn. Output began with nonsensical `IN` and repeated apostrophes; prompt speed **31.7 t/s**, generation **47.6 t/s**. Correctness **FAIL**.
2. **CPU control**: `-ngl 0`. Process terminated after single turn (exit code 0); output began with nonsensical text `irminghaminder Normousseauseyriersories case Soldier Braun...`. Prompt speed **12.6 t/s**, generation **16.7 t/s**. Correctness **FAIL**.

The separate prior verbose Vulkan trace identified Adreno 750 as `Vulkan0`, allocated a Vulkan compute buffer, and assigned all transformer layers to Vulkan0. These tests establish engine execution and token generation, but NOT a valid answered benchmark.

## Diagnosis
Both GPU and CPU modes fail on the same prompt and model. Therefore a GPU-only defect is not established. Suspect the shared model/prompt/chat-template/decoding/runtime path; **root cause unverified**. The raw single-turn CLI printed `> 2+2=?` and produced invalid output. Do not classify it as a passed correctness test.

The generation-throughput ratio `47.6 / 16.7 ≈ 2.85` is an unqualified single-run observation only. Do not call it a LeeWay speedup, accepted benchmark, or correct-answer inference.

## Next minimal diagnostic gate
1. Inspect GGUF chat template and exact runtime prompt wrapping, including whether the CLI default chat mode applies the expected SmolLM2 instruct template.
2. Retry one *properly chat-templated* deterministic known-answer prompt without modifying model bytes or binary. Capture full sanitized CLI flags, backend trace, answer text, exit code, and timings.
3. If both CPU and GPU still return invalid output, verify the same GGUF with an independent, version-compatible inference engine before changing GPU software.
4. Only when direct GPU correctness PASS should the same model, engine, configuration, and backend go through canonical Runtime Fabric/Formula/Veritas for the LeeWay-controlled comparator.

## State
Correct direct GPU answer: FAIL. Correct CPU answer using same GGUF/engine: FAIL. Repeatability: insufficient. Veritas runtime receipt: NOT CREATED. Learning Ledger: NOT UPDATED. No file cleanup performed.
