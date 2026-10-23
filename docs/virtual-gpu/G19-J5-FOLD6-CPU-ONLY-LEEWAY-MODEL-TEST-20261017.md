# G19 J-5 — LeeWay Fold6 CPU-only model execution gate

Creator clarified the acceptance target: demonstrate a language model generates directly on Fold6 through LeeWay **without using Adreno GPU acceleration**, and distinguish LeeWay's dispatch/authority/runtime interface from the physical GPU. No Windows-hosted inference or cloud fallback should qualify.

## Actual evidence

- The historical source `E:\LeeWay-Work\device-bridge-c34-build\apps\android\app\src\main\java\industries\leeway\devicebridge\ModelRuntime.kt` uses Google LiteRT-LM `EngineConfig(... backend = Backend.CPU(), ...)`, with a locally verified model hash, bounded timeout and textual token output; it represents a legitimate design route to CPU inference.
- The historical model was `litert-community/SmolLM2-360M-Instruct`, expected 373719040 bytes, SHA-256 `8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e`. September 2026 receipt documents a previous automated local CPU model test; no evidence it was personally run by Creator or currently installed.
- Current Fold6 Android user-0 package inventory includes Pocket, Pocket.test, Termux, not the original `industries.leeway.devicebridge` package. Bounded prior Pocket and shared-storage weight scans cannot verify the former model files. The checked local Windows Device Bridge and Pocket source trees contain no embedded `.litertlm`, `.gguf` or `.tflite` model binaries.
- Added `contracts/g19-phone-cpu-model-admission.mjs` and `.test.mjs` on Windows. Node tests **8/8 PASS**. Refuse any GPU backend/offload, paired-PC route or cloud route; require phone-owned model bytes, SHA256, a local CPU runtime entrypoint and request-scoped authority. This is **synthetic contract verification**, not inference.

## Test outcome

`LEEWAY_PHONE_CPU_ONLY_ADMISSION_POLICY_PASS`; `FOLD6_LANGUAGE_MODEL_EXECUTION_BLOCKED_BEFORE_MODEL_LOADING` because a current callable verified local model/runtime was not established. No actual phone-local language model generation, latency, token rate or memory residency verified. Existing physical Adreno Vulkan 256/256 proof is separate and cannot fill this gap.

## What LeeWay must prove next

1. A model weight file is actually present in a Fold6-accessible sandbox, hash matches expected manifest, and a CPU-only inference backend can open it.
2. LeeWay chooses the target phone and CPU backend; records no GPU offload, no network/cloud/paired-PC route; requests task-bound Runtime Fabric authorization and memory allocation.
3. It loads and generates text from a fixed prompt; captures model output, latency, token count if runtime exposes it, allocations, lifecycle/cancellation and cleanup.
4. Independent verification attributes result to the Fold6 CPU only, correlates Formula, Device Bridge, LDWMD/Continuum and Veritas receipts, then publishes honest status to Digital Brain/Diagnostics.

**Conceptual boundary:** LeeWay is a software-defined compute/orchestration layer, not a source of physical computation. Without the phone GPU it must execute on the phone CPU (or another explicitly qualified processor). That demonstrates independence from GPU acceleration, not independent physical hardware. No phone changes, model downloads, APK installs, voice changes, Apple J-7 changes or Git publication.
