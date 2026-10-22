<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FORMULA_DOMAIN_POLICY
TAG: LEEWAY.EDGE_GPU.G32.ACTUAL_256_SOFTWARE_GPU_OBSERVATION_CHECKPOINT
5WH:
WHAT = Source-pin, execute and replay actual 16 software-only 256x256 samples under canonical Formula.
WHY = Formula mathematics must be mapped to observed resource conditions before policy qualification.
WHO = Creator-authorized LeeWay engineer; independent production policy issuer unbound.
WHERE = LeeWay-Edge-GPU/docs/virtual-gpu.
WHEN = 2026-10-22
HOW = G22 worker measurements, original runtime-state-v1, live Formula service, independent source replay.
LICENSE: MIT
-->
# G32 — Real 256×256 LeeWay software workload observations

## What ran
The existing original LeeWay G22 host-CPU worker performed 16 matrix
calculations at size 256x256 with independent numerical checking.
Measured dimensions: correctness Q; observed operation rate V; host free
memory fraction H; process RSS fraction R; I/O byte count S; elapsed ms L.
The original pinned canonical Formula evaluated the 16x6 observations on
the real local Formula service and independent mathematical replay matched
the service's exact result and live receipt.

Request: g32-software-14e06d04-1b46-49f4-ba68-a5b8ab411448
Canonical Formula input SHA256:
e32b77f8929f96560f5d988b5e65f43c8ec2ba921afe82e35a724a500d60b568
Canonical Formula result SHA256:
672685dde108ed204c8c6adc739e734368dcf50ca3a059a29a93e70410b62275
Receipt: leeway-formula-run-20261022183056-cc29c340.json
Decimal state: [69,0,13,12,68,67]
Observed median worker latency: ~38.0331 ms
Observed median rate: ~882412439 operations/second, diagnostic calculation.

## Resource semantics: explicit, truthful
At size 256:
- LDWMD A/B/C host Buffer bytes: 786432
- Original G22 worker input snapshots and temporary output: 786432
- **Minimum known matrix buffer footprint:** 1572864
- Observed host free memory at the diagnostic instant: 6023315456 bytes
- Unapproved diagnostic reserve (25% of observed free): 1505828864 bytes
- Observed memory after diagnostic reserve: 4517486592 bytes
- Envelope result: G32_WORKLOAD_MEASURED_ENVELOPE_FIT_CANDIDATE.

The 25% reserve is not an approved canonical Formula engineering policy.
Node runtime overhead, driver constraints, NUMA effects and actual resident
set movement are not fully measured. The 38 ms is a workload sample median,
NOT a proven general-purpose throughput or NVIDIA performance benchmark.
No physical GPU provider was invoked by this CPU-worker test.

## Independent authority still required
Formula result values have NO standalone operational scheduling authority.
No canonical protected Runtime Fabric issuer was enrolled, no official
software CPU policy profile was signed, no LDWMD production lease was
issued, and no original Veritas PRE/POST, Continuum durable output,
Receipt Ledger or Learning Ledger GPU event was admitted.
G32 always returns ownerPolicyApproved=false and
productionAdmissionAuthorized=false. A clean diagnostic is not
equivalent to certifying a GPU as an OS-visible virtual graphics adapter.

## Source changes and validation
- core/software-workload-policy-candidate.mjs
- scripts/run-g32-software-workload-probe.mjs
- tests/virtual-gpu/software-workload-policy-candidate.test.mjs
- G26 observations extended to size 256 with a measured-rate range that
  avoids silently saturating at the original small-sample 1e8 bound.
- Seven G32 fail-closed tests passed locally. Existing G22–G26 regressions
  must also pass, and GitHub CI result requires separate verification.
