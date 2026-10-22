<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.ENGINEERING
TAG: LEEWAY.EDGE_GPU.G23.SOFTWARE_FULL_PIPELINE.REPAIR
5WH:
WHAT = Connect software-only LeeWay compute to canonical governed stages.
WHY = G22 bypassed mandatory Runtime, Formula, memory, Veritas and ledgers.
WHO = Creator-authorized LeeWay engineering, without issuer or signing authority.
WHERE = Isolated LeeWay-Edge-GPU GitHub branch.
WHEN = 2026-10-22
HOW = Preserve measured compute; bind host callbacks; enforce fail-closed tests.
LICENSE: MIT
-->
# G23 — LeeWay software-only full-pipeline repair checkpoint

## Source integrity
GitHub main base: 7ff92cd5f36df78a23a7b6c53a0e7f074ad6be17.
Original G22 software worker unchanged, SHA256
1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c.
Node host shim, worker entrypoint, tensor contract/reference code copied from G22
and independently SHA256 compared during isolated worktree setup.
Live GPU and Runtime Fabric worktrees have not been overwritten.

## Repair made
core/governed-software-compute.mjs consumes the actual existing CPU matrix
worker only after Runtime Fabric grant, canonical Formula decision and
independent replay, Veritas PRE verified decision, and LDWMD HOST_RAM lease.
It verifies the actual Float32 output through a separate reference provider,
compares complete Continuum readback bytes, verifies Veritas POST, Receipt
Ledger append and chain readback, Learning Ledger admission and exact
readback, and requires LDWMD memory-release verification before return.
The host is injected by the authenticated owner process, not by task input.
External GPU providers and Hugging Face are never used by this worker.
Ambiguous writes/append/admission must be reconciled, never blindly replayed.

## Evidence
31/31 Node tests passed: 14 new G23 contract checks plus 17 retained G22
software worker regressions. The actual 2x2 matrix worker returned
[19,22,43,50], verified by an independent synthetic test oracle.
Wrong Formula, Veritas, memory lease, output, Continuum, Receipt or Learning
states fail closed. Source syntax and diff checks passed.
**These are synthetic host callbacks. They prove only the consumer
state machine, not real production grants, signatures, LDWMD allocations,
database commits or live provider admission.**
The consumer permanently reports productionAccepted=false.

## Live blockers at inspection
Windows LeeWay GPU service (port 4178) is discovery-only and dispatch disabled.
Canonical GPU issuer, Formula software scheduling policy, production LDWMD
lease, owner Continuum binding and execution Veritas receipt are unqualified.
Runtime Fabric C3 readiness reports independent Veritas and canonical Learning
providers unregistered. Port 4002 health still returns 500.
Formula golden health and Receipt Ledger health are separately passing.

## Next necessary source work, using original LeeWay owners
1. Runtime Fabric authenticates the host binding and software capability.
2. Formula qualifies workload mapping; no golden-vector approval shortcut.
3. LDWMD measures and leases actual host-memory working set and releases it.
4. Veritas signs real request-scoped PRE and POST decisions using protected keys.
5. Continuum stores actual results with durable readback and recovery.
6. Both ledgers admit a single correlated outcome, survive restart and replay.
7. Audit Triad qualifies the authentic authority and evidence.
8. Device Bridge integrates this engine through leeway.gpu.service; only then
   should governed software dispatch be enabled. Windows native adapter and
   other OS compatibility remain separate qualification goals.
9. Re-run G22/NVIDIA with the complete admitted product and matched precision.

## Acceptance
One **fresh** actual software-only request must pass all real canonical
authorities with independently authenticated evidence, exactly one
Learning Ledger event and no hardware GPU provider invocation.
Then pursue multicore/SIMD optimizations and external OS device interfaces.
CURRENT: G23 CONSUMER CODE AND TESTS PASS; FULL PRODUCTION ADMISSION BLOCKED.
