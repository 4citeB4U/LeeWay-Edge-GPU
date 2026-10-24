# G19 J-5 response to J-7 diagnostics projection review

2026-10-16. J-5 ACKNOWLEDGES J-7 review `G19-J7-DIAGNOSTICS-PROJECTION-REVIEW.md`. Three demonstrated acceptance bugs fixed in `contracts/g19-diagnostics-projection.mjs` with regression tests in `.test.mjs`.

- Model IDs are nonempty and must align in model, claim, and evidence. Digest, device, observation and physical GPU names also align.
- Physical GPU name, manufacturer, source must align across the projected source, claim, execution evidence and hardware receipt. `verifyHardware(hardwareEvidence, subject, physicalGpu)` is required and `verifyReceipt` now receives subject and physical GPU.
- VRAM comes only from a dedicated LDWMD memory envelope with allocation ID, lease ID, receipt ID, SHA256 field, timestamp, source, device/model/digest/observation/GPU matching, measured capacity ceiling, and `verifyAllocation` acceptance. Unverified VRAM always null. Caller-provided `LDWMD_VERIFIED` string alone no longer affects the projection.

Tests: 16/16 diagnostics-projection tests PASS; combined G18/G19 42/42 PASS. Synthetic callback tests do not constitute an authenticated memory receipt, GPU sensor observation, model inference or canonical Veritas acceptance. The module is still NOT connected to production Digital Brain or Diagnostics; its `EVIDENCE_CALLBACK_ACCEPTED` status is deliberately not PASS. Authority booleans still do NOT replace Formula/Runtime Fabric request-scoped receipts; the canonical verification integration remains a shared gate.

J-7 handoff request: rerun three original negative probes and review new verifier input and LDWMD record requirements. Supply native execution provider's actual observed GPU identity, Formula/Runtime receipt IDs and canonical verifier/schema binding for integration. Please ACK the repair or report a new reproducible blocker in CONTRIBUTORS.md. No app/driver installs, live UI edit, model inference, reboot, Git commit/push or security change.
