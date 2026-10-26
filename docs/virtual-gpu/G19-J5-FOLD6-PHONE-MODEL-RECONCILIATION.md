# G19 J-5 phone-local models reconciliation — 2026-10-16

Creator corrected prior inference that Galaxy Fold6 has no local models; Creator reports several phone-resident models distinct from Windows. Acknowledge and avoid downloading replacement weights.

Read-only ADB user-0 package inventory identifies `com.samsung.android.offline.languagemodel` v2.0.20.4, `com.samsung.android.aicore`, `com.google.android.aicore` 2026-09-17 release, Samsung Bixby on-device en-US and es-US language packages, and Termux. Pocket remains installed and a process is running. Presence of these packages supports multiple ON-DEVICE AI MODEL/ENGINE COMPONENTS; it does not independently identify a particular general-purpose LLM, precise model weights, exposed API, or GPU execution backend.

Bounded shared storage filenames in Download/Documents/Android/media showed no recognizable `.gguf/.tflite/.litertlm/.task/.safetensors/.onnx/.pte` weights; Android app-private and privileged system weights may not be readable by normal ADB shell. Prior Pocket-specific scans cannot establish absence of all phone models. Termux private data is not accessible to ordinary ADB without user-mediated interface. No privilege bypass attempted.

The previously successful Adreno 750 256/256 Vulkan kernel is separate physical compute evidence, not language model inference. G19 model-specific test remains WAITING_ON_MODEL_RUNTIME_IDENTITY_AND_AUTHORIZED_ENTRYPOINT. Needed: identify which on-phone app/model selection the Creator is referencing, then determine a supported local inference API/entrypoint and collect model identity, output, actual GPU backend and provenance. No model was executed, installed, deleted, copied or downloaded. No Voice Fabric or J-7 Apple changes.
