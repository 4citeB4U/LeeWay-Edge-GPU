# G19 J-5 First Fold6 CPU-only model restore preflight — 2026-10-17

Creator requested continuing model work. This is preflight only, not interpreted as explicit approval to replace/reinstall Pocket, install an APK or download 374MB model bytes. Voice Fabric and J-7 Apple lane are untouched.

## Reusable authority/source

- `E:\LeeWay-Work\device-bridge-c34-build\apps\android\app\src\main\java\industries\leeway\devicebridge\ModelRuntime.kt` uses LiteRT-LM with `EngineConfig(backend = Backend.CPU())` and bounded 128-token conversational / 512-token general generation. `generateBounded` checks model hash with `status(context)`, handles timeout/cancellation and records `model.inference` receipt.
- Original manifest `docs/model-manifest.json` records `litert-community/SmolLM2-360M-Instruct`, 373719040 bytes, SHA-256 `8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e`; phone-private file `models/SmolLM2_360M_instruct.litertlm`. Historical automated phone CPU inference PASS is not a current owner-observed execution.
- Source-only tests `node --test tests/phone-local-model-source.test.mjs tests/android-model-budget-source.test.mjs`: 2/2 PASS on current original checkout. No actual ARM64/Kotlin APK build or phone inference performed.
- Device Bridge Android project is under `apps/android`, Android plugin Gradle with LiteRT-LM `com.google.ai.edge.litertlm:litertlm-android:0.17.1`, minSdk 29, targetSdk 35; build.gradle.kts is present, `gradlew.bat` not bundled under project. The original checkout has concurrent unrelated dirty files; do not overwrite/commit them.
- Current Fold6 user-0 inventory has Pocket and Pocket.test but not former `industries.leeway.devicebridge`; model was in that former package's own Android private directory, not Pocket. The old file cannot be verified installed now; broad prior model filesystem searches were not exhaustive across privileged/app private stores.
- LeeWay Edge GPU `contracts/g19-phone-cpu-model-admission.mjs`: 8/8 synthetic admission tests PASS; CPU-only and no cross-device/cloud route enforced in policy, but model runtime, trusted authority and phone-CPU response are unbound in production.

## Exact first-run plan (pending owner approval for install/download)

1. Stage and compile isolated original Device Bridge model component; verify APK signature/package/version and actual LiteRT-LM backend, without overwriting Pocket or changing system permissions.
2. Attempt reuse of a model only through a supported user-granted file location. If unavailable, obtain separate approval for fresh model download to the isolated app storage. Verify exact bytes and SHA-256 before any inference.
3. Explicitly disable GPU in `Backend.CPU()`, paired Windows model routing and cloud access, then request a single bounded prompt with short timeout and no voice output. Capture model response, elapsedMs, backend provenance, device identity, native runtime logs, and model digest.
4. Compare GPU counters only as supporting diagnostic evidence; CPU backend configuration and no GPU offload trace are critical. A successfully generated response establishes CPU model inference on Fold6, not independent physical GPU hardware or G19 canonical governance.
5. Independent Formula/Runtime Fabric and Veritas receipts remain future acceptance gates. Keep creator-controlled cleanup and leave existing Pocket data intact.

## Current outcome

`HISTORICAL_CPU_MODEL_RUNTIME_SOURCE_QUALIFIED`, `SOURCE_TESTS_2_OF_2_PASS`, `CURRENT_FOLD6_MODEL_BYTES_UNVERIFIED`, `PHONE_INFERENCE_NOT_EXECUTED`. Do not claim LeeWay standalone GPU or native Android provider proved by static source tests.
