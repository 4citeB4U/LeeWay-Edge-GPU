# G19 J-7 Runtime Fabric receipt and output review

Date: 2026-10-16. Scope: review of the current J-5 GPU receipt verifier, J-5 Diagnostics projection, and this repository's inference dispatcher/result contract. No inference, allocation, or authority mutation was performed.

## J-7 assignment acknowledgment

J-7 ACKNOWLEDGES the paired repair assignment and accepts ownership of the request-bound Formula/Runtime Fabric integration and physical GPU execution binding. J-7 reviewed J-5's signed receipt schema and supplies the concrete provider output shape below. The actual canonical Runtime Fabric inference authorization/receipt interface is still absent from the inspected production sources, so this shape is an integration proposal, not an authorized grant or canonical receipt.

## J-5 evidence review

The latest `contracts/g19-diagnostics-projection.mjs` closes the previously reported gaps at its admission boundary: it requires a nonempty model ID, carries physical GPU provenance into both verification callbacks, requires dedicated allocation evidence with measured bytes and capacity, and keeps an admitted callback result at `EVIDENCE_CALLBACK_ACCEPTED` rather than `PASS`. Its updated suite covers those negative cases. The earlier J-7 Diagnostics projection review is superseded for those three findings.

The Ed25519-capable `contracts/g19-gpu-veritas-gate.mjs` verifies a fixed set of receipt fields against a configured public key and compares a limited subject (`deviceId`, `observationId`, `modelId`, `modelDigest`, `runtimeId`, `physicalGpu`, `providerId`). Its six tests establish synthetic signature-checking behavior. The production issuer key and canonical issuer are not configured or connected.

Compatibility gaps before wiring the verifier into Runtime Fabric or Diagnostics:

- The current request subject is not bound in the signed GPU receipt: request ID/hash, session ID, tokenizer digest, implementation digest, and the Runtime Fabric grant/lease subject are absent. A receipt signature can be valid yet not identify this inference request.
- `formulaReceiptId`, `runtimeFabricReceiptId`, `ldwmdReceiptId`, `continuumReceiptId`, and `deviceBridgeReceiptId` are signed nonempty strings, but the verifier does not validate their issuer, hash, subject, correlation, or status. String presence is not proof of upstream authorization.
- The verifier does not require a schema/version, key ID, explicit signature algorithm/domain, canonical serialization contract, timestamp format/freshness, or replay policy. These must be agreed with the canonical Veritas issuer before production signatures can be verified safely.
- The expected subject compares human-readable physical GPU/runtime labels. A canonical Device Bridge observation and stable adapter/device identity must accompany those labels; a caller-provided label alone is not physical-device provenance.

These are schema and authority integration gaps, not failures of the synthetic Ed25519 tests. J-5 remains the owner of the Veritas verifier and Diagnostics implementation; this review requests a versioned signed subject from the canonical issuer and does not alter their files.

## Actual J-7 dispatcher result contract

`core/hybrid.dispatcher.js` hashes the immutable request and validated provider result. It asks the Runtime Fabric binding to authorize, verify Formula evidence, revalidate, post-verify, commit Continuum state, rollback on a failed commit, and release the lease. J-7 has now closed the explicit correlation gap in the returned binding by adding request ID, session ID, and model/tokenizer/implementation hashes from the immutable validated request snapshot. On return it adds:

```json
{
  "executionBinding": {
    "requestId": "immutable validated request ID",
    "sessionId": "immutable validated session ID",
    "requestHash": "sha256 of the immutable request",
    "modelSha256": "immutable validated model digest",
    "tokenizerSha256": "immutable validated tokenizer digest",
    "implementationSha256": "immutable validated implementation digest",
    "resultHash": "sha256 of the validated provider result",
    "leaseId": "Runtime Fabric grant lease ID",
    "formulaReceiptSha256": "grant Formula receipt digest",
    "formulaReplaySha256": "local replay-proof digest; not authorization",
    "ldWmdReceiptSha256": "grant memory admission receipt digest",
    "continuumReceiptSha256": "durable commit receipt digest",
    "postReceiptSha256": "post-execution verification receipt digest"
  }
}
```

The provider result includes generated token IDs, stop reason, prompt token count, execution/backend label, timing, GPU resource and I/O descriptions, and explicit `canonicalAcceptance: PENDING_HOST_POST_GATE`. `validateInferenceResult` binds the allowed backend and excludes CPU neural math/external engine. The new explicit immutable request identity fields make the output contract reviewable and directly correlatable by a future owner-signed receipt. They are data correlation, not cryptographic issuer authentication; the dispatcher still does not emit a canonical signed GPU receipt.

The fixture binding in `tests/virtual-gpu/governed-inference.test.mjs` is intentionally synthetic. Its function callbacks and SHA-shaped IDs are test inputs, not authenticated Runtime Fabric authority. `formulaReplaySha256` proves the replay proof was self-consistent with the local replay verifier; the proof explicitly says `NOT_GRANTED_BY_REPLAY`. It cannot authorize inference.

## Required canonical bridge to J-5

Before either Diagnostics callback can qualify an inference observation, the actual Runtime Fabric/Veritas owners must expose an authenticated post-execution receipt that signs and correlates at minimum:

- schema/version, key ID, algorithm, issuer, receipt ID, issue time, expiry/replay identity;
- request ID and request hash, session ID, Formula decision receipt ID/hash and decision outcome;
- model ID plus model, tokenizer, and implementation digests;
- Runtime Fabric grant/lease ID and receipt ID, allowed execution route, and explicit denial of CPU, remote, or external-model fallback;
- Device Bridge device/observation identity and a stable physical adapter identity, with source provenance;
- LDWMD allocation receipt ID/hash, lease/generation, model/request/device subject, measured bytes and capacity;
- Continuum read and durable commit receipt IDs/hashes bound to the same session/request/result;
- provider command digest and readback/output digest, with measured execution result and post-gate status.

J-7's consumer accepts the current sequence only through the injected owner binding; it does not establish the binding's canonical authenticity. The synchronized integration remains BLOCKED until the Runtime Fabric owner supplies that real authenticated interface and J-5 confirms its verifier consumes the same subject. No booleans or caller-selected strings may substitute for those receipts.

## Current evidence and next gate

- Canonical Formula Fabric tool returned `LEEWAY_FORMULA_V1_PASS` for its health/golden-vector diagnostic, with `kernelIntegrity: VERIFIED_AT_STARTUP`. This is Formula runtime identity/diagnostic evidence only; no task-specific inference mapping or Formula authorization was executed.
- Inspected Runtime Fabric source checkout: `C:\Users\Leona\.codex\leeway\runtime-fabric-phase4`, HEAD `67379fb49791d2c94fc54460a60c903bfde834f7`; the current source map and targeted search did not locate a production request-scoped GPU inference binding.
- Refreshed the canonical Device Bridge remote ref without checking it out; `origin/main` is `6562271ae8d10b5d09c811c7ad44090070a669ef` (the local `main` checkout remains 6 commits behind and has an untracked package lock). Its qualification record documents a historical SM-F956U Android 16 local SmolLM2-360M run through LiteRT-LM on **CPU**, 373,719,040 bytes, model SHA-256 `8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e`. The run took 4,273 ms but failed the exact-output prompt (`instructionExactMatch: false`). Current `ModelRuntime.kt` still explicitly chooses `Backend.CPU()`. `RemoteCommandRouter` calls a local `FormulaF8Gate` whose payload says canonical Formula `NOT_EXECUTED`, Q69 null and `canonicalPolicyGapClosed: false`; it is not a canonical request-bound Formula decision. Thus this is historical phone-local CPU inference evidence, not Adreno GPU execution or G19 authorization. Current ADB user-0 package inventory has `industries.leeway.pocket` and `.test`, but no `industries.leeway.devicebridge`; the old qualified Device Bridge model cannot be treated as installed on the currently observed device.
- Formula working checkout: `C:\Users\Leona\.codex\leeway\Leeway-formula-live`, HEAD `7fae63185a4cbd4dd631ba13114e4d27accba52b`, still 114 commits behind after a read-only `git fetch origin main` (no checkout or working-file changes). Inspected current canonical `origin/main` at `e6decb8a76d3910222848be5ea5b2501a46e6e1d`. It adds no request-bound GPU inference authorization in the searched contracts/domains. It does contain canonical documented historical GPU evidence: `docs/domains/GPU-VRAM.md` describes a 2.0B Q4_K_M Ollama model with CUDA VRAM residency and up to 11.182x VRAM working-set reduction, with source records `experiments/real-model-qwen3-v1/GOLDEN-FORMULA-GPU-ACHIEVEMENT-LADDER-20260922.json` and `GPU-FORMULA-FUNNEL-11X-TO-16X-BOUNDARY-20260922.json`. These records support a HISTORICAL external-runtime GPU lane; they do not identify a current device, provide a request-specific Runtime Fabric grant, or qualify this repository's LeeWay provider. The 16x target remains unmet.
- Canonical skills checkout: `C:\Users\Leona\.codex\leeway\LeeWay-Agent-Skills`, HEAD `881a36235a8216056383b5a25e1846983117d20a`.
- The only Remote Desktop Commander device enumerated is the same Windows Agent-Lee workstation; it does not provide a separate qualified Windows guest. Current Windows 11 Home host cannot satisfy isolated WDDM driver qualification. WDK source-build tooling is installed, but driver-test guest remains BLOCKED.
- A direct read-only ADB probe now observes a connected Samsung SM-F956U, SoC `SM8650`, hardware `qcom`, and SurfaceFlinger GL renderer `Qualcomm, Adreno (TM) 750` / OpenGL ES 3.2. EGL/Vulkan properties report `adreno`; SurfaceFlinger reports `vulkan_renderengine: false`, which describes its render path and does not test Vulkan compute. `industries.leeway.pocket` is installed as version 86 (`1.0.0-original-eye-widget-rc59`) and is debuggable. Its `run-as` private `files` directory contained only `profileInstalled`; `no_backup` contained WebView/voice-test/owner-upgrade artifacts and no model weights. `/sdcard/Android/data/industries.leeway.pocket` was absent. ADB package enumeration also returned `industries.leeway.pocket.test`. This advances physical device/GPU identity to OBSERVED, but does not prove Device Bridge pairing, a local model, a Vulkan inference runtime, or GPU inference. The app was not launched and no files or settings were changed.
- Read-only inspection of the installed Pocket `base.apk` (64,175,435 bytes; SHA-256 `3fdafea62df58a1a7b1aaa9cc92a8f68374dd8421990c45eb0b4d05c0cd351ef`) found no `.gguf`, `.onnx`, `.tflite`, or `.safetensors` model assets. No APK bytes were retained on the workstation. Bounded file-extension scans also returned no such model files in shared storage or Pocket private data. The dirty local source checkout `E:\LeeWay-Work\agent-lee-fold6-unified`, HEAD `64cf4be8daf85284d6a81bb38fb40534c1072597`, implements `ModelsActivity` as a read-only paired-PC model inventory calling `/models/inventory`; its source is not proven byte-identical to the installed APK. Thus the phone-local model/runtime gap remains open with stronger direct evidence.

G19 remains OPEN / BLOCKED BEFORE AUTHORIZED MODEL ALLOCATION. No inference or phone-app operation occurred; ADB was used only for read-only property/package/private-file inspection. No host driver installation, reboot, security change, commit, or push occurred.

J-7 code repairs: `core/hybrid.dispatcher.js` now returns request ID, session ID, request hash, and model/tokenizer/implementation digests from the validated request snapshot under `executionBinding`. It also attempts Continuum rollback before Runtime Fabric lease release when commit or a later pre-response check fails. The prior order released the lease before compensation. Regression coverage asserts request/result identity correlation and rollback-before-release ordering. Combined affected contract suite: 90/90 PASS. These tests use synthetic bindings; they do not qualify a canonical authority or real inference.


## J-7 review of J-5 receipt-v2 candidate

J-7 ACKNOWLEDGES the receipt-v2 proposal in `contracts/g19-gpu-receipt-v2.mjs` and the 11/11 synthetic tests. Its signed subject correlates the dispatcher fields `requestId`, `sessionId`, request/model/tokenizer/implementation/result hashes, lease ID, Formula/LDWMD/Continuum/post-verification digests, and expected physical device/observation/adapter identity. The suite rejects altered request/tokenizer/adapter bindings, upstream callback denial, signed authority tampering, expiry, and replay. This is materially stronger request correlation than v1.

The current envelope remains explicitly `SIGNATURE_AND_CALLBACK_ACCEPTED_NOT_CANONICAL`; synthetic signing keys and injected callbacks do not authorize a run. Before live use, canonical issuer and Runtime Fabric owners must define and authenticate the request-scoped grant subject, allowed runtime/provider route and GPU allocation, deny remote/CPU/external fallback, and bind the exact upstream receipt content/status/subjects to this same request and result. The verifier currently compares expected runtime only indirectly (runtimeId is required but not in `expected`); the canonical integration must enforce the granted runtime and provider identity, not merely nonempty labels. The replay callback also needs a durable canonical store. No production verifier/key or upstream receipt reader is configured. J-7 ACK is limited to schema compatibility and synthetic behavior.

The canonical Device Bridge source observation is recorded in `evidence-staging/native-gpu-readiness-g19/j7-request-correlation-20261016/android-model-locality-observation.json` (SHA-256 `beddefdcb0618cfeabe387d7e41a264148f184b90e52ab5facf911f1ff7a8b1e). The fetched `origin/main` commit `6562271ae8d10b5d09c811c7ad44090070a669ef` contains historical SM-F956U LiteRT-LM inference on CPU, with 4,273 ms latency and a failed exact-output check; current source still chooses CPU and uses a local Formula-shaped gate that explicitly reports canonical Formula `NOT_EXECUTED`. The current Android user-0 package inventory lacks the Device Bridge package. This is not Adreno GPU inference or a G19 authorization.
