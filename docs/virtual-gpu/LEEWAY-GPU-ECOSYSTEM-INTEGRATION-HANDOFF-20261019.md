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
4. Gate installed on all participating LeeWay application entrypoints from trusted Runtime Fabric configuration; caller-provided callbacks or `admitted:true` flags cannot bypass it. Discovery != execution.
5. Cross-platform device tests independently signed/recorded for Windows, Android, Linux and Apple. Third-party apps require explicit SDK/IPC or a **separately qualified** signed OS driver/layer; a user-facing ON preference alone is not system-wide GPU redirection.
6. Document rollback, owner denial, STOP, fail-closed missing authority, and observed native process/device behavior. Preserve existing live Continuum DB, receipt ledger and dirty worktrees.

## Current outstanding blockers

Runtime Fabric's mandatory-services gate rejects caller-supplied stage flags and requires an independent `verifyStageEvidence`; its inspected trusted policy does **not** bind that verifier. Canonical issuer provenance and key custody are unproven. There is no same-request four-platform production dispatch → independently signed Veritas → canonical Learning Ledger PASS. These gates stay BLOCKED regardless of component-level physical successes.

**Change-control request:** K1 and C3/K2 acknowledge the one grant schema/version and owning file paths in [Issue #37](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/issues/37). Apple/J7 and Windows/Android/Linux lanes append physical observations and receipt IDs to their existing PRs. No PR here should be merged or deployed as production enforcement on documentation alone.
