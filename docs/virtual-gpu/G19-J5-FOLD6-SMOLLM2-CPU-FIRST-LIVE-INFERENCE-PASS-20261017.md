# G19 J-5 Fold6 SmolLM2 CPU first real inference — PASS (2026-10-17)

Owner explicitly approved isolated LeeWay Device Bridge test runtime and, if old private model bytes inaccessible, the previously qualified SmolLM2 model. Original Device Bridge checkout remained unchanged despite dirty concurrent files. J-7 Apple work and production Pocket/Voice Fabric unchanged.

## Actual installation
Isolated Android source stage E:\LeeWay-Work\evidence-staging\g19-phone-cpu-restore\android. Gradle 8.9 Android :app:assembleDebug BUILD SUCCESSFUL. Debug APK package industries.leeway.devicebridge, version 0.9.8-pocket-rc8, final APK SHA256 a5250b4a883d5db4da62b0d4d7b0db0073fe7565d6197a7a5474b2512741bbf9. Android debug signer SHA256 bd8cfff73383416d6c35d96617c49d53df4dc1610e6ea44e55b5b5c04836fce1. Installed user 0 separately from Pocket. Debug-only shell DUMP permission protected CpuInferenceProbeActivity accepts only a fixed test prompt.

## Verified model
litert-community/SmolLM2-360M-Instruct, 373719040 bytes, SHA256 8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e. Download source exactly matches original Device Bridge docs/model-manifest.json. Windows and two Android SHA256 checks matched. Model installed in private app files/models/SmolLM2_360M_instruct.litertlm via permitted run-as debug app. Temporary /data/local/tmp/leeway-g19-smollm2-verified-stage.litertlm removed; independently confirmed G19_TEMP_MODEL_CLEANED.

## Actual live Fold6 CPU inference
Source ModelRuntime.kt uses LiteRT-LM EngineConfig with Backend.CPU(), model file digest gate, and bounded generation. On phone debug probe ran prompt: A delivery van has 12 packages and delivers 5. How many remain? Answer in one short sentence.
Real text reply: 12 packages - 5 packages delivered = 7 remaining.
Android local result: ok true; modelStatus installed true, verified true, backend CPU; modelResult elapsedMs 9491; whole probe elapsedMs 9791. No voice output or paired-PC action requested by probe. This verifies a real phone-local CPU-backed model response, not GPU inference.

Windows copied and verified Android app-private receipt: E:\LeeWay-Work\evidence-staging\g19-phone-cpu-restore\fold6-cpu-smollm2-live-result-20261017.json; SHA256 dff60633597719369a6b2c8ae978bcf7eba2b866e65d3d8895f87fe8ac39cf09.
Post-test package inventory contains separate industries.leeway.pocket, industries.leeway.pocket.test, industries.leeway.devicebridge.

## Honest boundary
PASS FOLD6_DEVICE_BRIDGE_LOCAL_SMOLLM2_CPU_INFERENCE. Verified model and CPU engine actually generated a response on Fold6. No standalone OS LeeWay GPU, production Formula/Runtime Fabric binding, Veritas signature, LDWMD/Continuum memory proof, Gemma runtime, or cross-device inference demonstrated. CPU backend attribution supported by exact code and app receipt; no independent hardware profiler result. Original app includes INTERNET permission, but fixed local test function does not invoke a remote model route; no external network trace was collected. Do not claim exhaustive network isolation. Phone model retained for subsequent approved trials; no Git publication.