# LeeWay Edge GPU source synchronization — 2026-10-23

**Scope:** Candidate source preservation only, not live production promotion.

The source-sync worktree `review/edge-gpu-source-sync-20261023` was created from the existing `LeeWay-Edge-GPU` Git history. The active working tree `E:/LeeWay-Work/LeeWay-Edge-GPU` was not modified.

The source selection inspected 350 changed/untracked file paths, copied **173 source, documentation, contracts, tests, and application paths**, and excluded **177** non-source files. Exclusions were 176 evidence/staging, run artifacts, or backups and one non-source extension. Notably, this excludes the large repeated NVIDIA comparison tensor `.f32` binary outputs under `evidence-staging`. Protected credentials, private keys, user-specific runtime data, and receipts were not admitted into the source snapshot.

## Qualification results

- `npm run build` — **23/23 source syntax checks PASS**. This is source qualification, not driver installation or GPU execution.
- `node --test contracts/*.test.mjs` — **102/102 PASS**.
- `npm run test:gpu` — **47/47 local component tests PASS**, with an Intel Xe GPU adapter observation. This is not proof that a standalone software GPU replaces physical hardware.
- `node tests/virtual-gpu/formula-binding-check.mjs --evidence <local-evidence-dir>` — **PASS_GOLDEN_FIXTURE_ONLY**. The report explicitly records `workloadMapping: NOT_QUALIFIED` and that no GPU workload was mapped or optimized by the Formula self-test.
- No test was run with production device authority, and no canonical Receipt/Learning Ledger admission is claimed.

## Boundaries

This review branch is **candidate source**, never a substitute for the main executable system, signed GPU owner consent, hardware qualification or independent Veritas PRE/POST. Missing device-native providers and driver installation must remain fail-closed.

Original untracked `evidence-staging` benchmark arrays and raw artifacts remain local for separate evidence-vault handling; they were intentionally not sent to GitHub source control. The generated test qualification directory inside this worktree was also excluded from the source commit.

To restore this source on another machine, fetch the exact review branch. Validate the required device adapters and actual full production execution separately before promoting it to a release.
