# G19/J5 — Android Vulkan CI Artifact Verification (2026-10-17)

## Authority and scope
Creator authorized review of the build-only candidate from draft PR #2; **no phone deployment, production merge, model execution, or security configuration change**. Repository: 4citeB4U/LeeWay-Edge-GPU. Branch: `g19/fold6-vulkan-android-ci-20261017`.

## GitHub Actions source evidence
- Run: https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/39057469074
- Run ID: 39057469074, run number 9, conclusion SUCCESS.
- Job ID: 117468287171, name `android-arm64-vulkan`, conclusion SUCCESS.
- Artifact ID: 12110142610; name `g19-fold6-arm64-vulkan-build`; GitHub size: 61,838,255 bytes.
- GitHub SHA-256 ZIP digest: `a201fff03a6ba4e464775b42176c61ae7e491bc36a5986597b42c28662c12fcb`.
- Source checkout pinned llama.cpp commit: `c0fd78626405c6d9b934efef0ec7291fcc20e3d6`.

## Independent artifact inspection performed
Downloaded GitHub Actions artifact ZIP and analyzed its bytes read-only.
- Calculated ZIP SHA-256: `a201fff03a6ba4e464775b42176c61ae7e491bc36a5986597b42c28662c12fcb` — MATCH against GitHub metadata.
- Nested `g19-fold6-arm64-vulkan-build.tar.gz` SHA-256: `d4ec04a7326bfcddae52f8a637f784ebd6effbc4bb2d9b70887998c122534761` — MATCH against CI job log.
- `release/upstream-llama.commit` specifies `c0fd78626405c6d9b934efef0ec7291fcc20e3d6` — MATCH against PR and handoff.
- All **10/10** SHA-256 entries in `release/SHA256SUMS` match corresponding native binaries inside the nested tarball. This independently validates archive contents.
- `bin/llama-cli`: ELF64, e_machine 183 (AArch64); SHA-256 `e75406d1240c5e3a39914a05278c7a95baa0e931c0713adaa94bfa2fdbc1442f`.
- `bin/libggml-vulkan.so`: ELF64, e_machine 183 (AArch64); SHA-256 `2ebc051edf589c29418b5174608269573f09363ed098a2ca4c125cb2fdc0ec0f`.
- CI `readelf -h` identified ELF AArch64 and linker `/system/bin/linker64` for llama-cli. This is static build evidence, not Android execution evidence.
- Embedded QUALIFICATION.txt states `Phone deployment: NOT PERFORMED`, `Inference: NOT EXECUTED`, `Model weights: NOT INCLUDED`, `GPU: Vulkan backend compiled; physical Adreno execution unverified`, and `LeeWay runtime binding: NOT PERFORMED`.

## Status after this inspection
| Gate | Status | Explanation |
|---|---|---|
| G1 CI provenance | VERIFIED | Run/job succeeded, source revision and build provenance recorded |
| G2 downloaded artifact integrity & architecture | VERIFIED | ZIP/tar hash match, 10/10 file hashes, ELF AArch64, Vulkan library present |
| G2 device dynamic-link compatibility | UNVERIFIED | Static inspection cannot prove all dependencies resolve on Fold6 |
| G3 direct Adreno model inference | NOT EXECUTED | Requires authorized device-level execution and GPU trace |
| G4 same-engine LeeWay-controlled GPU inference | NOT EXECUTED | Must wait for G3 PASS |
| G5 Veritas pre/post and receipt | NOT EXECUTED | No fabric execution was undertaken |
| G6 relative performance | NOT MEASURED | No matched pair of model responses yet |
| G7 Learning Ledger | NOT UPDATED | Canonical provider/authorized binding not established in this step |

## Next smallest authorized action
Prepare the **read-only** physical Fold6 environment readiness examination: device build, driver Vulkan support, ABI/linker/dependency inventory, availability of exact GGUF model and rollback preconditions. Do not install binaries or run GPU inference without separate mutation/execution authorization and confirmed device authority. If readiness passes, run direct physical GPU inference with verified weights, record GPU/backend trace, response and timed metrics; only then benchmark the same path under LeeWay control.

## Veritas / receipt
This document records actual read-only CI/artifact inspection. No Veritas PASS claimed. No runtime receipt created. Learning Ledger not updated.
