# G19 J-5 Original Fold6 model history and live reconciliation — 2026-10-16

Creator reports original Agent Lee Fold6 implementation had Gemma plus two other local models; do not replace them or pretend paired Windows inventory is phone-local. This report separates preserved historical evidence from current device observations.

## Verified original source/receipts

1. `E:\LeeWay-Work\device-bridge-c34-build\docs\model-manifest.json` identifies `litert-community/SmolLM2-360M-Instruct`, `LiteRT-LM`, `.litertlm`, expected size 373719040 bytes, SHA-256 `8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e`, `PHONE_LOCAL`.
2. `E:\LeeWay-Work\device-bridge-c34-build\apps\android\app\src\main\java\industries\leeway\devicebridge\ModelRuntime.kt` stores this model in `File(context.filesDir,"models")`, filename `SmolLM2_360M_instruct.litertlm`. `status()` reports `backend="CPU"`; this historical test cannot establish GPU model inference.
3. `E:\LeeWay-Work\device-bridge-c34-build\receipts\LDB-PHONE-LOCAL-MODEL-QUALIFICATION-20260923.json` reports previous local model inference PASS dated 2026-09-24T00:28:11Z (4273ms) with this model. It is a historical receipt; not a re-run or current device verification.
4. Older Agent Lee phone work tracked Gemma deployment/testing as an original target, including Gemma 3 27B IT QAT Q4_0 and a Gemma 270M control download; specific currently resident Gemma artifact and third model have NOT been verified in available checked source manifests.

## Live Fold6 facts

- ADB confirms Samsung `SM-F956U` connected.
- `adb shell pm list packages --user 0` currently lists `industries.leeway.pocket` and its `.test` package, NOT `industries.leeway.devicebridge`.
- The previous Device Bridge private directory `/data/user/0/industries.leeway.devicebridge` and external `/sdcard/Android/data/industries.leeway.devicebridge` are not present at inspected paths (ADB shell cannot access other apps' private directories generally; negative `ls` is not global deletion proof).
- A bounded shared Download/Documents/Android-media search found no filenames matching Gemma/SmolLM/Qwen or `.litertlm/.gguf/.tflite`. Android app-private, privileged model stores and Termux remain outside normal ADB shell visibility.
- Pocket's active source `UnifiedAgentLeeRuntime.modelInventory()` routes to the paired PC `/models/inventory`, not the phone. Google/Samsung AI Core show on-device provider services but no individual model names/authorized Pocket inference interface.

## Status

`HISTORIC_SMOLLM2_PHONE_LOCAL_MODEL_CONFIRMED_IN_SOURCE_AND_RECEIPT` (not confirmed installed today); `HISTORIC_GEMMA_TARGET_RECORDED` (current file unverified); `THIRD_MODEL_NOT_IDENTIFIED`; `CURRENT_PHONE_LOCAL_MODEL_INFERENCE_NOT_EXECUTED`.

Next trace: review original Gemma model install receipt/download history and any former Termux-owned paths through its normal user interface, or the relevant app-specific model manager. Do not install replacement models, attempt unauthorized private storage access, execute protected AI services, alter Pocket/Voice Fabric, or claim G19 model inference PASS without request-authorized execution receipts.
