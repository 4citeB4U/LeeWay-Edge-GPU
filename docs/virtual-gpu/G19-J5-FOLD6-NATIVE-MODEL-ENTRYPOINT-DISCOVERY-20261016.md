# G19 J-5 Fold6-first native model entrypoint discovery

2026-10-16. Creator directs use phone-resident models before PC models. Read-only ADB investigation, no model extraction or execution via restricted APIs. J-7 Apple unaffected. Agent Lee Voice Fabric untouched.

## Verified Android provider registration

`adb shell cmd on_device_intelligence get-services`, `get-configurations` and `dumpsys on_device_intelligence` show TWO configured on-device intelligence provider chains:

1. Google AI Core intelligence service `com.google.android.aicore/com.google.android.apps.aicore.service.isolated.AiCoreIntelligenceService` and sandbox inference service `...AiCoreIsolatedService`.
2. Samsung AI Core intelligence service `com.samsung.android.aicore/com.samsung.android.aicore.isolated.IntelligenceService` and sandbox inference service `...SandboxedInferenceService`.

`dumpsys on_device_intelligence` shows `InferenceInfoStore inferenceInfos (0 total)` for the reported store at inspection. This does **not** prove the providers never perform inference, only that no entries were present in the exposed dump during inspection.

Samsung offline language-model package version 2.0.20.4 has `ONDEVCE_SERVICE` guarded by `signature|privileged`; do not try to bypass its permission. Google/Samsung intelligence services also advertise system BIND permissions; registration does not establish an authorized Pocket app client or selectable model name.

## Model location scope

ADB shell confirmed Pocket and Termux installed. `run-as industries.leeway.pocket` works (debuggable), but bounded Pocket `files`/`no_backup` filenames and shared Download/Documents/Android-media extension scans did not surface recognizable GGUF/TFLite/ONNX/SafeTensors weights. `run-as com.termux` refused because Termux package is not debuggable. Termux external app data directory was empty at inspected path. No root, sandbox bypass, private model copying, or arbitrary model downloads performed. **Existence and identity of Creator's reported phone-local models remain plausible but individually unverified; this is not an absence finding.**

## Existing routing bug

Pocket `UnifiedAgentLeeRuntime.kt` model inventory points to paired PC `/models/inventory`, so those returned models are NOT verified phone-local. The separate `contracts/g19-multi-device-model-catalog.mjs` boundary and 8/8 tests prevent incorrectly promoting Windows or permissioned system components to phone-local runnable models.

## Gate

`ON_DEVICE_PROVIDER_REGISTRATION_VERIFIED`, but `MODEL_ID_AND_USER_ACCESSIBLE_ENTRYPOINT_UNVERIFIED`; **NO LOCAL LANGUAGE MODEL EXECUTED**. Independent Adreno 750 Vulkan 256/256 kernel proof remains valid but is not inference. Next step: select a specific owner-accessible phone app/model interface (e.g., user's Termux models or model app) or implement an authorized Android OnDeviceIntelligenceManager client subject to actual platform permissions and model inventory. Do not call restricted services, change voice, install an APK or copy privileged weights without separately grounded authority.
