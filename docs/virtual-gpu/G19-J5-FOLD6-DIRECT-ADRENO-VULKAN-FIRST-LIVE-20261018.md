# G19/J5 — Direct Adreno 750 Vulkan inference: first live execution
Date: 2026-10-18
Branch: `g19/fold6-vulkan-android-ci-20261017`
Owner scope: isolated Fold6 benchmark only; retain existing llama, Pocket, Voice, and production configuration.

## Artifact and integrity
- Downloaded G19 CI tarball (build run 39057469074) is present at `E:\LeeWay-Work\evidence-staging\g19-fold6-ci-artifact\g19-fold6-arm64-vulkan-build.tar.gz`.
- `certutil -hashfile ... SHA256`: `d4ec04a7326bfcddae52f8a637f784ebd6effbc4bb2d9b70887998c122534761`; matches prior successful CI.
- Extracted archive to new PC path `E:\LeeWay-Work\evidence-staging\g19-fold6-ci-artifact\verified-native`. The first extraction wrapper emitted a PowerShell `-ne` parse error because variable expansion was stripped, but the archive actually extracted and direct contents/hash checks followed. Do not interpret the wrapper's `EXTRACT_OK` line as independent validation.
- Ten native files transferred successfully via `adb push ...\verified-native\bin /data/local/tmp/g19-fold6-vulkan-test/` (reported 258,224,288 bytes).
- Host and phone `llama-cli` SHA-256: `e75406d1240c5e3a39914a05278c7a95baa0e931c0713adaa94bfa2fdbc1442f`.
- Host and phone `libggml-vulkan.so` SHA-256: `2ebc051edf589c29418b5174608269573f09363ed098a2ca4c125cb2fdc0ec0f`.
- Earlier copied model SHA-256 on phone: `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b`.
- Only the new isolated `/data/local/tmp/g19-fold6-vulkan-test/bin/llama-cli` was chmod 755; no production executable replaced.

## Runtime evidence
- `LD_LIBRARY_PATH=/data/local/tmp/g19-fold6-vulkan-test/bin .../bin/llama-cli --version` succeeded: `0.7.0-dev (build 1, commit c0fd786)`, Clang 18.0.3, Android aarch64.
- A first quoted multiword prompt failed CLI parsing (`invalid argument: is`) due command-line quoting across Windows/ADB; retried single-token prompt without changing binaries.
- First direct run with `-m /data/local/tmp/g19-fold6-vulkan-test/SmolLM2-360M-Instruct-Q8_0.gguf -p 2+2=? -n 16 -ngl 99 --no-display-prompt` loaded model, generated tokens, and printed `Prompt: 30.9 t/s | Generation: 45.9 t/s`. Text was incorrect (`IN///////////////`). It entered interactive mode; operator sent `/exit`, process ended cleanly.
- Second run with same model, `-p 2+2=? -n 16 -ngl 99 -st -v`, exited 0. Verbose trace identified `Vulkan0 : Adreno (TM) 750`, assigned layers 0–31 and output layer 32 to Vulkan0, and `Vulkan0 compute buffer size = 30.51 MiB`; these are evidence of real Vulkan model execution. Output was too verbose for a clean answer-content assessment; do not claim the response correct.

## Gate classifications
- Native artifact transfer and two individual phone checksums: VERIFIED.
- Android loader/executable run: VERIFIED.
- Direct physical Vulkan model loading, backend selection and computation trace: VERIFIED.
- Direct response correctness: FAILED first prompt; second output not reliably assessed.
- Repeatable same-config performance and temperature/memory: NOT MEASURED.
- LeeWay Runtime Fabric/Formula/Dispatcher/Veritas governed same-engine execution: NOT EXECUTED.
- LeeWay GPU speedup vs direct GPU: NOT MEASURED.
- No Veritas governed receipt created; Learning Ledger not updated.

## Next smallest action
Capture one quiet, non-interactive direct GPU trial with validated decoding options and fixed prompt (consistent seed, tokens, sampling, context, warmup). Record output/tokens timing/backend offload, then repeat and establish same-engine direct baseline. Only after correctness and repeatability pass, wire the *same executable/model/backend/settings* through authorized LeeWay ingress and Veritas gates. Do not compare against the earlier 9.491-s CPU/LiteRT test (different model/engine).

## Rollback
Only isolated owned path `/data/local/tmp/g19-fold6-vulkan-test` and new host `verified-native` path are eligible for later authorized cleanup. No cleanup was performed.
