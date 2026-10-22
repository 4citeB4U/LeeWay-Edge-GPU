<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FORMULA_QUALIFICATION
TAG: LEEWAY.EDGE_GPU.G26.CANONICAL_SOFTWARE_FORMULA_EXECUTION
5WH:
WHAT = Execute canonical Formula against measured LeeWay software-only observations.
WHY = G23 full-chain consumer originally used synthetic Formula callbacks.
WHO = Creator-authorized LeeWay engineering; not a production issuer.
WHERE = LeeWay-Edge-GPU G23 draft PR isolated worktree.
WHEN = 2026-10-22
HOW = Original pinned Formula, 16 measured G22 executions, real Formula service receipt.
LICENSE: MIT
-->
# G26 — Actual canonical Formula execution for LeeWay software compute

## Existing LeeWay components reused
Canonical Formula source: 4citeB4U/Leeway-formula-live, commit
a1d59f78b7ef43ea1529ebaa787958b6484ea442.
Verified original SHA-256 engine pin:
6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e.
Verified original runtime-state-v1 adapter SHA-256:
3264d0a97a76246b31c5ca759b5993188cbae10422eb153ac395e3fb5e2470e0.
Original Formula golden validation PASS.

## Actual live diagnostic run
- Original G22 LeeWay worker performed 16 timed software-only CPU calculations.
  Every matrix result was independently compared to a scalar math reference.
  NVIDIA, Hugging Face, CUDA, physical WebGPU and external GPU services were
  not used to execute these calculations.
- Diagnostic Formula six-dimensional observations:
  Q correctness, V observed operation rate, H free memory ratio,
  R process RSS ratio, S actual matrix I/O bytes, L measured latency.
  The diagnostic mapping is explicitly NOT an approved GPU admission policy.
- The original Formula runtime-state-v1 adapter encoded a 16x6 state window.
  The actual Formula service health PASS and POST /evaluate ran once; this
  writes its own normal Formula receipt, not any production GPU ledger.
- Original Formula engine independently replayed the canonical encoded matrix.
  Live input SHA, result SHA, decimal states and base64 states matched replay.
  Original /last receipt readback matched the exact request and encoded rows,
  and the Formula receipt appeared in the /receipts listing.

## Observed request and reproducible result
Request: g26-software-76409dc2-715e-4711-a79f-428cfbd2533b
Formula ID: LEEWAY-FORMULA-v1.0, adapter: runtime-state-v1
Decimal result: [69,0,11,68,67,66]
Base64 result: [BF,A,L,BE,BD,BC]
Input SHA-256: a42878c00a0fd12d3ba38708d61ee8730be2cd85567e8ecf5e515d986a874757
Result SHA-256: babd6c5a61a8ab5f660d0782210222c51ccb32e6b3f51f65c3f765581becf30e
Formula receipt: leeway-formula-run-20261022162511-22789086.json
Live receipt readback SHA-256:
de1ad4e84a9ce5533a684bf09d8cc978e45b214a3843d217fdb711861ef6eafc

## Source and acceptance
Source additions: core/canonical-formula-software-observation.mjs;
scripts/run-g26-formula-observation.mjs;
tests/virtual-gpu/canonical-formula-software-observation.test.mjs.
The existing GitHub Actions contract workflow is expanded to test them.
G22-G26 local tests: 45/45 PASS.
GitHub-hosted test outcome must be separately verified after publishing.

## Authority boundary
Original source pinning authenticates the independent reference checkout,
not a new external attestation of the live Formula service binary.
Formula's numerical output does NOT grant production GPU execution authority.
The G23 software issuer, verified Formula scheduling policy, LDWMD host RAM
lease, independently signed Veritas PRE/POST, durable Continuum, Receipt Ledger
and Learning Ledger remain unqualified as one real production software chain.
ProductionAccepted is false; no OS-native virtual graphics device is certified.

NEXT: register real Runtime Fabric software scope and protected issuer; qualify
observed Formula state mapping as workload policy; connect original canonical
LDWMD, Veritas, Continuum and ledger providers to one authentic request.
Do not promote simulated receipts or bypass blocked service authorization.

## Source-closure strengthening
Beyond the canonical engine and adapter pins, independent replay now verifies
SHA-256 of original canonical-input, rational mathematics and base64 codec
source bytes from the same pinned GitHub source checkout. This protects the
replay against altered mathematical dependencies rather than trusting only
the entrypoint module. It still does not constitute remote host attestation.
