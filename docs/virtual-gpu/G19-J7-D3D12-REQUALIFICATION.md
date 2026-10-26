# G19 J-7 D3D12 physical GPU requalification

Observed: 2026-10-16T20:56:52Z. The existing native prototype rebuilt from source and ran a deterministic 262,144-element compute dispatch on two physically enumerated D3D12 adapters.

- NVIDIA GeForce RTX 5060 Laptop GPU: 262,144 elements written; GPU fence/readback completed; 0 mismatches against the independent CPU reference; software adapter false.
- Intel(R) Graphics: 262,144 elements written; GPU fence/readback completed; 0 mismatches against the independent CPU reference; software adapter false.
- Build exit: 0; runtime exit: 0; adapter summary: 2/2 passed.
- Physical dispatch evidence SHA-256: $evSha.
- Prototype source SHA-256: $sourceSha; build runner SHA-256: $runnerSha; executable SHA-256: $exeSha.

This proves real physical D3D12 command submission and readback for this prototype kernel on the two host adapters. It does not prove neural inference, Runtime Fabric authorization, a LeeWay-managed production provider, a distinct Windows-enumerated LeeWay adapter, GPU-specific Veritas acceptance, LDWMD allocation, or Digital Brain/Diagnostics integration. Reported dispatch/fence time rounds to zero milliseconds and is not performance evidence. No model was loaded and no inference was run.

Machine-readable build/runtime record: evidence-staging/native-gpu-readiness-g19/d3d12-requalification-20261016T205652Z/d3d12-compute-evidence.json.
