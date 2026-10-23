# G19 J-5 Fold6 local-model discovery — read-only

Date: 2026-10-16. Role: J-5. Status: BLOCKED_ON_MODEL_LOCATION_AND_RUNTIME, not a failed inference test.

## Device and capability observations
ADB connected user device model SM-F956U, platform `pineapple`, EGL hardware `adreno`. `/vendor/lib64/hw/vulkan.adreno.so` exists. These indicate a graphics/Vulkan driver library; they do NOT establish Vulkan compute submission, supported inference operators, memory allocation, or LeeWay GPU execution.

## Installed packages and sources
`industries.leeway.pocket` version `1.0.0-original-eye-widget-rc59`; `industries.leeway.pocket.test` version `1.0.0-floating-widget-test`; `com.termux` version `googleplay.2026.10.09`. Installed package enumeration also reported Android Secure Folder user 150 access restriction; no bypass attempted. Termux's private files `/data/user/0/com.termux` were not read. Pocket private data likewise not read.

Existing Pocket source under `E:\LeeWay-Work\pc-consciousness-live\pocket-roundbox-v45-stage\app\src\main` includes `NativeVoiceDecoder.kt` using `ai.onnxruntime` and voice catalog URLs for ONNX Chatterbox models. This demonstrates source-level voice-inference integration only, NOT presence of a downloaded model, proof of local LLM or GPU inference.

Bounded searches of `/sdcard/Download`, `/sdcard/Documents`, and `/sdcard` to depth 4 for GGUF/ONNX/TFLite/BIN found no candidate. These searches are incomplete with respect to nested paths, Android app-private storage, data directories or in-app model inventories. No model absent claim is authorized. Device shared storage shows approximately 99 GB available; this is not GPU memory.

## Qualification before G19 phone model test
1. Locate the phone's model via authorized app-native inventory or supported file access without bypassing sandbox restrictions. Record model path (redact personal paths as needed), format, size, digest, runtime and license.
2. Confirm actual local inference is possible independent of cloud connections; do not equate Pocket voice ONNX code with a local LLM.
3. Build a bounded Android Vulkan compute probe and verify command submission/readback, GPU device identity, no CPU-only fallback.
4. Bind the approved LeeWay Formula/Runtime Fabric/LDWMD/Continuum authority, typed Veritas evidence and existing Digital Brain/Diagnostics, then execute model and log exact hardware provenance.
5. Display `LeeWay Edge GPU` as execution provider only when authorized and proven; physical Qualcomm Adreno GPU separately attributed. Never claim OS registration of a new virtual adapter from Vulkan library presence.

No app installs, speech, inference, driver changes, kernel changes, Git publication, or private app-data access performed. J-7 Windows model test awaits ACK and governed provider prerequisites.
