# G19/J5 — Fold6 SmolLM2 chat-format CPU/Vulkan controlled trial

Date: 2026-10-18. Scope: direct native Fold6 inference diagnostic; isolated directory only.

## Authority and preflight
Creator directed continuation of prior G19/J5 correctness gate. Connected Fold6 SM-F956U through ADB. Phone GGUF SHA-256 `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b` rechecked. Existing isolated binary `/data/local/tmp/g19-fold6-vulkan-test/bin/llama-cli`, build b1-c0fd786. Pocket, Voice, and earlier llama installation untouched.

## Prompt formatting
Prepared a new 105-byte file on host (byte-defined to avoid shell quoting) and copied it into the existing isolated phone test directory:
`/data/local/tmp/g19-fold6-vulkan-test/smollm2-chat-prompt.txt`.

Exact file text (CRLF line endings):
```text
<|im_start|>user
What is two plus two? Answer with just the number.
<|im_end|>
<|im_start|>assistant
```
This mirrors the intended special-token role delimiters; **CLI effective templating was not yet verified**. Console echoed these delimiters as text, which may indicate raw prompt handling/double wrapping. Do not claim conformance to the GGUF Jinja template solely from this file.

## Controlled trials
Common settings: `-m /data/local/tmp/g19-fold6-vulkan-test/SmolLM2-360M-Instruct-Q8_0.gguf -f /data/local/tmp/g19-fold6-vulkan-test/smollm2-chat-prompt.txt -n 24 -st -s 42 --temp 0 --log-verbosity 2`, same native build, same input.

1. **Vulkan** `-ngl 99`: generated `IN'''''''''''''''''''''''` (malformed); prompt 40.9 tokens/s, generation 38.2 tokens/s; exit code 0. Correctness FAIL.
2. **CPU** `-ngl 0`: generated malformed unstructured text beginning `irminghamuan otoninDateTimeField gastroawakarco...`; prompt 18.8 tokens/s, generation 31.5 tokens/s; exit code 0. Correctness FAIL.

Separate seeded raw prompt control was also executed with `-p 2+2=? -n 16 -ngl 99 -st -s 42 --temp 0`, yielding malformed `IN''''...`, generation 49.8 tokens/s and exit code 0.

## Findings
- Both backends execute the model and emit tokens; neither passes correct answer `4`.
- Correctness failure is not isolated to Vulkan; shared model/format/decoding/runtime behavior remains suspect.
- A single-run t/s comparison is not an accepted benchmark (no correct responses, no repeated median, no thermal controls).
- No evidence of LeeWay Runtime Fabric/Formula/Veritas controlled inference.

## Next smallest evidence gate
Inspect the GGUF's actual `tokenizer.chat_template` and the CLI's default chat handling. Test one properly applied template without double wrapping, ideally using an independent parser or exact special token sequence and an explicit non-conversation mode if supported by this pinned runtime. Compare CPU and Vulkan on a known-answer request. If still malformed, verify the exact GGUF with a distinct compatible inference runtime before any source/model mutation.

## Receipt / ledger
This is an execution observation/documentation record, not a canonical Veritas receipt. RECEIPT NOT CREATED; LEARNING LEDGER NOT UPDATED.
