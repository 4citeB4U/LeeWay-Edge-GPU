# G19/J5 Fold6 Vulkan GPU — Continuity and Verification Gates
Date: 2026-10-17
Project: 4citeB4U/LeeWay-Edge-GPU
Scope: build-only Android ARM64/Vulkan qualification, no deployment
Authority: Creator-approved continuation of draft PR #2; no merge or phone mutation authorized.

## Purpose
Preserve the engineering history, evidence distinctions, blockers, acceptance gates, and next action for the controlled same-model, same-engine physical Adreno GPU vs LeeWay-governed path comparison. This note is a checkpoint, not a Veritas receipt or benchmark result.

## Historical evidence reported in the handoff
1. Fold6 CPU SmolLM2 inference generated the correct response in 9.491 s — reported PASS. Not comparable against the later GGUF/Vulkan candidate without identical engine, model bytes and decoding configuration.
2. Physical Adreno 750 executed a Vulkan compute shader — reported PASS for compute only, not model inference.
3. Direct LiteRT-LM GPU initialization failed with `Can not find OpenCL library on this device`, status code 2 — reported BLOCKED. A /vendor/lib64/libOpenCL.so location was reportedly observed; root cause remains unproven.
4. Common GGUF model candidate: SmolLM2-360M-Instruct Q8_0, reported size 386,405,280 bytes and published SHA-256 verification. Actual checksum value must be recovered and independently matched before runtime deployment.
5. Shared benchmark contract reportedly passed 8/8 tests; this is a contract validation, not end-to-end GPU text generation.
6. Windows Device Guard blocked a newly compiled Vulkan shader generator. Security configuration was left unchanged.
7. Draft GitHub PR #2 established an isolated Android ARM64 Vulkan llama.cpp build, upstream source pinned to `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`. No model weights or phone deployment in scope.
8. Earlier CI failures were reported for Android SDK setup and SPIR-V headers, followed by additional include/staging repairs.
9. Handoff activity includes a reported 'Verified Android ARM64 Vulkan CI artifact', but does not contain the artifact ID, run ID, executable SHA-256, build logs, ELF inspection output or deployment receipt. Treat artifact verification as UNVERIFIED in this checkpoint until primary evidence is attached.

## Current independently inspected state in this session
- GitHub PR #2 found at https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/2 and describes build-only, owner-review-gated work.
- Branch `g19/fold6-vulkan-android-ci-20261017` found by GitHub branch search.
- This continuity note was absent at the above branch path before creation.
- Latest CI run conclusion and artifact verification were not independently fetched in this session. Do not promote handoff statements to measured proof.

## Gates / status
| Gate | Acceptance evidence | Status |
| --- | --- | --- |
| G1 build provenance | Specific workflow run, pinned source SHA, compiler/NDK versions, logs | UNVERIFIED (primary run evidence not yet linked) |
| G2 ARM64 Vulkan artifact | Downloaded artifact checksum, ELF AArch64, Vulkan library/dependencies, manifest | UNVERIFIED in this session |
| G3 direct physical GPU inference | Identical GGUF bytes, Vulkan backend actually active, generated answer and trace | NOT VERIFIED |
| G4 LeeWay-governed same path | Same model/engine/config/device/backend and output through LeeWay control | NOT VERIFIED |
| G5 Veritas pre/post and receipt | Real pre-gate, execution, post-gate, evidence and receipt | NOT VERIFIED |
| G6 comparative benchmark | Repeated controlled runs with timings, tokens/s, memory, thermals and error rates | NOT MEASURED |
| G7 Learning Ledger | Canonical provider identified, authorized write and confirmed entry | NOT UPDATED |

## Reproducibility / evidence required for each trial
Record UTC timestamp; device model and OS/build; SoC/GPU driver; model URI and full SHA-256; engine and binary SHA-256; source commit; compile flags; backend selection proof (GPU offload trace); exact prompt; seed; generation parameters; repetitions and warmup; prompt processing and generation latency separately; tokens/s; peak memory; device temperature; energy/power if measurable; output or response digest; Veritas results; failure classification; receipt ID.

## Stop and rollback
No merge, release, APK/binary installation, security bypass, production Pocket/Voice changes or model replacement. Keep the draft build isolated. A build artifact is not an installed/working inference path. Before any future deployment, verify permission, dependencies, saved baseline and rollback.

## Next smallest action
Read draft PR #2's latest workflow run and its artifact manifest; record run ID, job conclusion, artifact ID, pinned source revision, checksum, Android ARM64 ELF and Vulkan linking proof. Only if G1/G2 are truly PASS should a separate explicitly authorized physical Fold6 direct GPU test be prepared. After direct GPU model inference passes, wire LeeWay to the exact same engine and model path. Keep benchmark claims blocked until both paths actually generate responses.

## Documentation discipline
Append timestamped changes with evidence URLs, commands actually executed, observed outcomes, rejected approaches, blockers, rollback and next gate. Distinguish VERIFIED/OBSERVED/INFERRED/PROPOSED/UNVERIFIED/FAILED/BLOCKED. Preserve existing milestone ledger rather than overwrite it.

## Receipt
DOCUMENTATION CHANGE ONLY. No new phone inference, Veritas pass or Learning Ledger write performed by this note.
