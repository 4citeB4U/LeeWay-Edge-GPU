# LeeWay GPU — Unified Ecosystem Handoff (2026-10-19)

> **Integration documentation, not a production admission record.** Authority remains with canonical Runtime Fabric, Device Bridge, independent Veritas and the canonical Learning Ledger. This document coordinates existing contributors; it neither replaces their source contracts nor grants production permissions.

## One system, four native execution adapters

**Service identity:** `leeway.gpu.service` — one governed service discoverable by LeeWay applications through Device Bridge and Runtime Fabric. Platform adapters do not create alternative grant issuers, Formula engines, replay ledgers or Veritas authorities.

| Adapter | Platform/native mechanism | Evidence category | Canonical admission |
| --- | --- | --- | --- |
| Windows | D3D12 physical GPU; Vulkan opt-in pass-through candidate | Physical D3D12 diagnostic and isolated signed-test Formula/LDWMD/Continuum chain; Windows Vulkan loader smoke PASS | **BLOCKED** — test issuer / provisional Formula policy, Veritas unissued |
| Android/Samsung | Vulkan; distinct `industries.leeway.gpu` diagnostic APK | Physical Fold6 Vulkan observations separately reported; Android IPC and default-OFF preference package locally tested | **BLOCKED** — same-request governed chain unverified |
| Linux | Vulkan service and candidate package | Installer syntax checked locally; no Linux physical execution qualification | **BLOCKED** |
| Apple | Metal; **reuse** existing `LeeWayGPU` iPhone application | Physical A13 Metal local compute/readback; Apple opt-in PR #7 unsigned build | **BLOCKED** — no live device-grant-bound Formula→LDWMD→Metal→Continuum→Veritas receipt |

Do not translate a source build, local toggle, isolated readback, or registry `BOUND_PASS` into `CANONICAL_ADMITTED`. Use distinct statuses `SOURCE_PRESENT`, `TEST_PASS`, `PHYSICAL_VERIFIED` and `CANONICAL_ADMITTED`, with device/platform, source SHA, requestId and receipt references.

## Canonical owning records and current integration heads

| Lane | Owning existing record | Current inspected candidate | Integration responsibility |
| --- | --- | --- | --- |
| Device Bridge / K1 | [Issue #37](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/issues/37); [PR #50](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/pull/50) | `7bf08de8e852cba1a4ca82b3c2c3cce900821c92` | Device identity, real owner consent, issuer-side signing/key custody, Apple & Android discovery, explicit client ingress |
| Runtime Fabric / C3-K2 | [C3 Issue #21](https://github.com/4citeB4U/Leeway-Runtime-Fabric/issues/21); [PR #49](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/49) | `c40d9e12f6067ca1f8170ea2d220b1b428c253a1` | **One** trusted verifier, durable nonce admission, independent stage-verifier binding, runtime router gate, real receipt and Learning Ledger admission |
| LeeWay Edge GPU / native contributors | [Apple GPU draft PR #7](https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/7) and native platform paths | `8d8346fb273c6be17f4899b221121f298f20002d` | Native D3D12 / Vulkan / Metal dispatch, memory/readback evidence, app-side owner preference, STOP and per-device acceptance |
| Independent evidence | Canonical Veritas + Receipt Authority / Learning Ledger existing providers | **not independently bound** | Cryptographically verified pre/post receipts, durable readback, learning eligibility; separate ledger-recovery migration authority |

The [Issue #37 cross-contributor handoff](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/issues/37#issuecomment-6270836662) is the primary discussion. Do **not** fork a second governance registry or create parallel owning issues.

## Real cross-repository grant-contract findings

The Device Bridge PR #50 issuer currently signs `JSON.stringify([applicationId, requestId, nonce, grantId, issuerId, expiresAt])` and encodes an Ed25519 signature as Base64. Runtime Fabric PR #49's trusted route policy **imports** `leeway-device-grant-verifier.mjs`, which verifies those six fields. The separate `device-bridge-grant-verifier.mjs` expects `[applicationId, requestId, nonce, grantId, deviceId, issuedAt, expiresAt, issuer]` with a Base64url signature and is **not interchangeable** with this issuer.

**Reproduced on Windows in isolated pinned-source fixture (2026-10-19): 8/8 targeted tests PASS.** Source GitHub blob SHAs: issuer `8899383e5446b1fb447f551efd7d7b39a9a1b69c`, selected verifier `34b7ecb192bef3a1272cd66c5b28adaef875d6db`, alternate verifier `31070d6dd6e2d1d1df30aeb5bd797945b3a48a5c`, replay consumer `9d481e1fdca35b93cf3aa8f27743d695a739af2e`. Checks: actual issuer→selected verifier PASS; alternate rejects; durable nonce first-use PASS / replay REJECT; request/application tampering, owner denial, missing signer, and expiry reject. Two tests **demonstrated risk**: unsigned added `deviceId`/`capability` may change without altering signature validity; verifier will accept an artificially validly re-signed overlong expiry because it lacks a separate lifetime check. Never interpret 8/8 as production security approval.

Prior contributors also demonstrated ephemeral-key cross-repo fixture interoperability. Preserve that evidence: the next work is not another issuer clone.

**Decision required from K1 + Runtime Fabric owner:** Ratify exactly one *versioned* production wire schema (domain/algorithm separated, signed deviceId + capability + owner authorization context + issuedAt + expiresAt + explicit issuer identity, bounded age), with migration/rejection rules for old test grants. Select one active runtime verifier, document all imports/call sites, and independently provision trusted issuer keys. Do not silently promote the six-field fixture to production or swap the eight-field candidate into the live router.

## Mandatory release acceptance (same request across stages)

1. Authenticated owner/device ingress, canonical signed grant and durable nonce/replay admission. Deny wrong app/device/capability/owner, expired/overlong grant, signature tampering and key rotation failure.
2. Independent **pre-execution** Veritas/Formula policy decision, physically owned LDWMD lease, authorized native GPU dispatch/readback, owner-approved Continuum lineage and independent **post-execution** Veritas receipt — each bound to exact `requestId`, workload hash, device identity and source revision.
3. Receipt Authority durable validation and **canonical Learning Ledger** admission/readback, or explicit BLOCKED status without synthetic receipts.
4. Gate installed on all GPU-capability entrypoints (LeeWay **and authorized third-party SDK/IPC clients**) from trusted Runtime Fabric configuration; caller-provided callbacks or `admitted:true` flags cannot bypass it. **Never gate solely on an `applicationId` beginning `leeway-`:** prior C3 [fresh router observation](https://github.com/4citeB4U/Leeway-Runtime-Fabric/issues/21#issuecomment-6271139058) returned `BOUND_PASS` for a non-LeeWay test GPU provider with `grant:null` because the prefix check did not apply. This is component-route behavior, not a native GPU dispatch proof. All `compute.gpu` admission must check capability, provider identity, owner/device authority and client consent regardless of naming. Discovery != execution.
5. Cross-platform device tests independently signed/recorded for Windows, Android, Linux and Apple. Third-party apps require explicit SDK/IPC or a **separately qualified** signed OS driver/layer; a user-facing ON preference alone is not system-wide GPU redirection.
6. Document rollback, owner denial, STOP, fail-closed missing authority, and observed native process/device behavior. Preserve existing live Continuum DB, receipt ledger and dirty worktrees.

## Current outstanding blockers

Runtime Fabric's mandatory-services gate rejects caller-supplied stage flags and requires an independent `verifyStageEvidence`; its inspected trusted policy does **not** bind that verifier. Canonical issuer provenance and key custody are unproven. There is no same-request four-platform production dispatch → independently signed Veritas → canonical Learning Ledger PASS. These gates stay BLOCKED regardless of component-level physical successes.

**Change-control request:** K1 and C3/K2 acknowledge the one grant schema/version and owning file paths in [Issue #37](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/issues/37). Apple/J7 and Windows/Android/Linux lanes append physical observations and receipt IDs to their existing PRs. No PR here should be merged or deployed as production enforcement on documentation alone.

## 2026-10-19 C3 application-router remediation — review only

The previously reported non-LeeWay GPU provider bypass now has a narrowly stacked [Runtime Fabric draft PR #58](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/58), targeting existing Runtime Fabric PR #49 rather than changing its source branch. It protects `compute.gpu`/GPU-declared application routes by canonical capability/provider metadata regardless of application-name prefix. It additionally fails closed if an application's `authorize()` result is not `AUTHORIZED`, instead of returning `BOUND_PASS` after a denied result. Unrelated third-party non-GPU routing is unchanged.

**Source-executed Windows qualification:** exact committed stacked-branch files passed **24/24 tests**: GPU route alias and external-provider blocking, deny-before-adapter authorization, denied adapter result, existing mandatory stage enforcement and trusted-policy regressions. The candidate is **draft/unmerged**, not live-deployed. It only covers the application-command-router path; independent producer-signed Veritas stages and cross-entrypoint coverage are still missing, as are ratified GPU grants with device/capability/owner context. See [C3 Issue #21](https://github.com/4citeB4U/Leeway-Runtime-Fabric/issues/21) for the owner acceptance gate. No OS-wide driver or Vulkan installation is implied.

## 2026-10-19 independent Veritas source-reuse audit — no false admission

**Direct read-only live-owner recheck** at `E:\LeeWay-Work\pc-consciousness-live\runtime`, HEAD `1bde20a8`: `node scripts/c3-live-admission-readiness.mjs` returns `status:BLOCKED`, Receipt Ledger HTTP503, `veritasProviderIds:[]`, `learningProviderIds:[]` with four specific failures `INDEPENDENT_VERITAS_PROVIDER_UNREGISTERED`, `CANONICAL_LEARNING_LEDGER_PROVIDER_UNREGISTERED`, `LIVE_RECEIPT_LEDGER_NOT_HEALTHY`, `STATIC_RECEIPT_PROVIDER_READY_BUT_RUNTIME_BLOCKED`; `mutationPerformed:false`.

**Existing code to REUSE but NOT misclassify:** `automation-runtime/Invoke-LeeWay-TrustedHostReadVeritas.ps1` explicitly requires absolute host-created evidence/verifier files and a pinned verifier SHA; comments forbid capability execution, Formula work, network actions or Ledger writes. This is a **trusted local host-read scope**, not a registered generalized independent GPU stage-verification service. `provider-fabric/provider-receipt-writer.mjs` creates a SHA256-derived local receipt with `signature: "LEEWAY-PROVIDER-FABRIC:" + hash.slice(0,24)`; this string is **not** a cryptographic independent signature or C3 Veritas authority. Never promote the local marker as `verifyStageEvidence=true` or `CANONICAL_ADMITTED`.

**Current candidate [Runtime Fabric stacked draft PR #58](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/58):** after independent contributor's reported `device.gpu.metal.compute` and `model.metal.infer` router bypass, added actual-router negative tests with third-party IDs lacking GPU/Metal names and `grant:null`. Corrected classifier and denied adapter authorization returned **26/26 scoped tests PASS**, exact branch revision `613bbdcb043501e58c4916bfe694252192e5fc28`; draft/unmerged. C3 parallel [expiry-only PR #57](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/57) retains separate grant-lifetime ownership. Neither PR provisions Veritas or resolves the device/capability/owner-scope grant contract.

**Next owner action:** independent evidence/Veritas and Learning Ledger provider owners must register their *already existing* trusted providers with real trust keys/service identities, define signed per-stage GPU evidence (including native dispatch/readback), then provide trusted Runtime Fabric `verifyStageEvidence` binding and canonical durable readback. The authorization must remain BLOCKED until those providers are authenticated. No changes to protected Ledger, signing keys, live owner runtime or native apps were made by this source audit.

## 2026-10-19 G19 GPU Veritas candidate ↔ Runtime Fabric stage gate interoperability

**Source provenance:** Windows `E:\LeeWay-Work\LeeWay-Edge-GPU\contracts\g19-gpu-receipt-v2.mjs` and `g19-gpu-veritas-gate.mjs` are presently **local untracked files** (`git status --short` prints `??` for both; `git ls-files` returns none). They are **not present in the GitHub Edge GPU default branch**, and must not be described as published canonical provider code. Their associated local G19 v2 fixture tests were also copied into an isolated evidence workspace; no contributor source was edited.

**Exact reused candidate behavior:** `verifyGpuReceiptV2({envelope, executionBinding, expected, trustedKeys, verifyUpstream, seenReceipt, now})` checks a candidate Ed25519 signature over request/device/model/output/receipt identities and returns `{status:"SIGNATURE_AND_CALLBACK_ACCEPTED_NOT_CANONICAL",receiptId,requestId,...}`, not production `verified:true`. Its `verifyUpstream` callback and `seenReceipt` callback require independently trusted implementations. Its fixture `issuer="CANONICAL_LEEWAY_VERITAS"` does not establish that any genuine canonical issuer signed the receipt when a synthetic fixture key is used.

**Actual Runtime Fabric interface:** `createMandatoryLeeWayServiceGate` accepts a trusted owner-provisioned `verifyStageEvidence({stage,requestId,applicationId,receipt,grant})` which must return the **primitive boolean `true` only after independent canonical verification** for each of `deviceBridge`, `formula`, `ldwmd`, `continuum`, `veritas`. A candidate G19 response object cannot be substituted for a canonical true decision, and G19 does not automatically supply `applicationId` or stage evidence for the four other providers.

**New executed controlled integration proof:** `E:\LeeWay-Work\evidence-staging\gpu-veritas-stage-bridge-20261019\runtime-gpu-veritas-boundary.test.mjs` copied the untracked G19 verifier locally and the **actual** Runtime Fabric mandatory gate from PR #49 blob SHA `94d6fb2b412053bc7824991028183e71bf866443`. `node --test` on both existing G19 suites plus the cross-repo suite: **15/15 PASS** in isolated Windows. The real gate rejected a returned G19 candidate object with `MANDATORY_SERVICES_UNVERIFIED` and **did not consume replay**; a missing trusted `verifyStageEvidence` failed `STAGE_RECEIPT_VERIFIER_UNBOUND`. Candidate tampering/expiry/request or model swaps were rejected. Test-only ephemeral keys and callback stubs provide **no production authority**.

**Non-duplicating owner contract to qualify next:** J5/Edge GPU should publish or explicitly reject the local G19 v2 candidate through its own source review; independent canonical Veritas owner supplies authenticated issuer/key custody, application/capability/device/workload scoping, authoritative receipt signer/verifier and replay state. C3 owner maps verified per-stage receipts into its own existing `verifyStageEvidence` contract from **trusted internal configuration**, not user input, preserving stage/request/application correlation. K1 must first ratify the versioned device grant. Only independently admitted receipts and durable Learning Ledger readback can justify live acceptance; fixture tests cannot.

**C3 live status at last read-only owner check:** Receipt Ledger HTTP503, `veritasProviderIds:[]`, `learningProviderIds:[]`, `productionAdmissionAuthorized:false`. No signer, protected receipt ledger, production host service or device installed state was modified by these contract tests.
