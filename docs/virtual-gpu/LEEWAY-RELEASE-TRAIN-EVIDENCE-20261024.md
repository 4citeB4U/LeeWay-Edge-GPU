# LeeWay Edge GPU — pinned cross-repository evidence and integration baseline
Date: 2026-10-24
Status: OWNER-ACCEPTED ENGINEERING EVIDENCE; PRODUCTION SAME-REQUEST QUALIFICATION NOT YET OBSERVED
Source authority: LeeWay owner-directed repository and retained receipts
Product identity: LeeWay Edge GPU, `leeway.gpu.service`
Execution identity: LeeWay-owned quantized WGSL graph, with explicitly qualified LeeWay software providers and optional platform adapters.
This document does not generate a grant, waive protected gates, merge drafts, or enable live dispatch.

## LeeWay invariants
- Agent Lee = `LEEWAY_MACHINE_CONSCIOUSNESS`; the model is an optional task capability, never the agent identity.
- Voice is exclusively the existing LeeWay Voice Fabric; do not replace its provider or selection.
- Model-, OS-, device-, and drive-agnostic interfaces: per-model architecture profiles, per-platform qualified adapters, portable relative/configured paths. No fixed E: path is a deployment identity.
- GitHub is the pinned source, release, test, and evidence record. GitHub hosting does not itself supply live GPU compute, the owner's Runtime provider, or protected credentials.
- Runtime Fabric/Discovery authenticates ingress and owns the work order. Qualified Formula evaluates the exact envelope; independent Veritas PRE admits; original LDWMD owns live buffers; LeeWay graph executes; Continuum stages, independently reads, commits, and recovers; Veritas POST and final attestation bind the result; Receipt and Learning Ledgers admit exactly once; Audit Triad verifies the chain.
- No external inference service or silent CPU/CUDA neural fallback for a request admitted to the LeeWay-owned inference graph. Explicit LeeWay software-tensor profiles are separate capabilities.
- Frozen `LEEWAY-FORMULA-v1.0` is unchanged. New policy adapters and research are versioned outside it.
- Never mistake test fixtures, source claims, owner approval, sample cryptographic receipts, or hardware diagnostic execution for a completed protected same-request production transaction.

## GitHub source revision pins (reviewed 2026-10-24)
| Component | PR | Source head SHA | State / scope |
| --- | --- | --- | --- |
| GPU G23-G40 software and math foundation | [GPU #11](https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/11) | `e7b61d4b6bbcb569ab7ed2f4f2c6960b209086be` | Draft, candidate |
| GPU torch.leeway compatibility | [GPU #12](https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/12) | `db850a69eaa5aaaac15b116f97853711bf033a3f` | Draft, optional adapter; not product execution center |
| GPU portable application, WGSL and graph plan | [GPU #13](https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/13) | `3f6b78ff8913e5aeccbda223470ed13d388fea2f` | Draft, latest observed before this manifest |
| Runtime Learning Ledger append-only readback | [Runtime #76](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/76) | `38ec6c8c4c82630a46ab5fad0bc2320d23bc2eb3` | Draft |
| Runtime software GPU source/authority contracts | [Runtime #77](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/77) | `eb798cbb336ed18f671f4b620cab8f5b37a85a27` | Draft |
| Original LDWMD and HOST_RAM | [Runtime #78](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/78) | `e202bb6d478e16f11503e538f0b86b52043129d3` | Draft |
| Cross-host Veritas C3 review | [Runtime #79](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/79) | `85b951129878c810f9bdd7e5e0bc196a03ee1df0` | Draft; SAMPLE_ONLY stage proof not production scope |
| Runtime bound inference/LDWMD/Continuum | [Runtime #80](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/80) | `4304c30a2c235d34aed627c734173466336858fe` | Draft, cross-repo synthetic integration |
| Earlier C3 request guard | [Runtime #62](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/62) | `7e389052f98d821f65f078ae29cbe6e744353a74` | Draft, retained lineage |
| Earlier C3 owner R2 | [Runtime #65](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/65) | `3c1031e1f8473553f41356bd0d7d7d6c38e3ba77` | Draft, retained lineage |
| Device Bridge portable service | [Bridge #55](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/pull/55) | `4f961a7cdf548b77e0cdb1d0ecd502436d870695` | Draft; startup provider not yet wired to protected live providers |
| Model Hub qualified client | [Hub #2](https://github.com/4citeB4U/LeeWay-Model-Hub/pull/2) | `604d33141b424f98c69bf70085e6de069c1447ef` | Draft; synthetic upstream tests |
| Formula spatial math G41 | [Formula #16](https://github.com/4citeB4U/Leeway-formula-live/pull/16) | `4d2d3a251796fe8406fdb3fe0abbe14861ed91f7` | Draft shadow candidate |
| Formula exact archive G42-G43 | [Formula #17](https://github.com/4citeB4U/Leeway-formula-live/pull/17) | `cb13cdda7c9f31de3e03970c8a35738a79c6f7e8` | Draft candidate |
| Formula G44 locality PR18 | [Formula #18](https://github.com/4citeB4U/Leeway-formula-live/pull/18) | `79e138e705d668e6d513fbf149e6183f31326b9a` | Draft divergent candidate |
| Formula G44 stronger fold PR19 | [Formula #19](https://github.com/4citeB4U/Leeway-formula-live/pull/19) | `1bc22063a9e73304a0061d3d10ab3d9f39c5b449` | Draft; reconcile unique #18 work, do not blindly merge both |

## Existing proof accepted within its actual scope
- G7: retained Qwen2.5 0.5B LeeWay-owned WGSL run, 24 layers, 10,070 dispatches, roughly 399 MB reported peak, no external inference provider. Not a governed same-request ledger pass.
- G9: retained 54 consumer, 28 Formula-replay, 18 tensor regression passes; refuses missing qualified runtime binding.
- G22/G30/G36: original LeeWay software worker, real HOST_RAM LDWMD buffers, and Formula in correlated research work. G36's measured Formula operands and later compute operands were not one identical immutable source envelope.
- G44: recorded synthetic 800 MiB / 6,400 tile exact replay; not proof of arbitrary-input compression or production partition dispatch.
- G46/G47/G48: BigInt elastic partition planning, integrity and candidate memory-adapter checks. G48's 14/14 ran a stand-in memory provider, not the canonical VRAM Database path.
- GPU #13 reports 245 portable tests passed. Runtime #80 reports 68 integration tests; Bridge #55 reports 41; Model Hub #2 reports 36. These are source/fixture/CI evidence, not physical live production inference.
- Runtime #79 reports independently verified Ed25519 sample PRE/POST using separate LEO-host identities. `SAMPLE_ONLY` scope cannot be relabeled a production execution permit.
- Current Formula evaluator and inference mapping are reported *qualified* by GPU #13 and Runtime #80. A Formula evaluation bound to the production GPU model request is still unobserved. Do not regress to historical G8/G9 wording that calls the provider itself missing.
- Separate Formula performance controllers I-07..I-12 remain `NOT_QUALIFIED` / `NOT_EXECUTED` in `evidence-staging/gpu-governed-benchmark-telemetry-20261023/governed-performance.json`. This does not revoke inference-mapping qualification.
- G77-G82 signed candidate selection and receipt proofs from the isolated candidate workspace are valid research evidence; G83 demonstrated causal parity-based Formula selection (5/5 research tests), but the G84/G85 recorded-height benchmark showed 1.272% more SSE than the corner-variance baseline. **Do not ship the G83 interpretation as a qualified policy.** Preserve its evidence and the variance baseline, frozen Formula v1.
- Later Qwen3 G98 inference is reported separately; the current portable transformer architecture check admits Qwen2 and Gemma4. Reconcile Qwen3 source and correctness, rather than assuming G98 is already part of the portable graph.
- Model-agnostic means a common service, format/operator profiles and admission contract, not an unsupported claim that any arbitrary model already executes. Qualify a matrix of 5-6 locally inventoried models across multiple supported families as engineering evidence. Model selection must never change Agent Lee identity.
- Live health of Agent Lee (8890) and Receipt Ledger (4104) was observed 2026-10-24 HTTP 200 with 24 valid ledger entries. Health != same-request GPU evidence.

## Connection and rollout — reuse before build
1. Compare E-drive dirty GPU checkout, G7/G9 retained source, GPU #13 clean portable-core branch, and hosted CI source SHA. Preserve untracked product code through reviewed, secrets-scanned source-only commits; do not push weights/binaries/credentials.
2. Bind trusted startup providers to existing Runtime #80, and Device Bridge #55 `inferenceProvider` + `authenticateClient`. Do not introduce a second engine, memory owner, Formula implementation or voice.
3. Connect the qualified inference Formula provider, protected owner/issuer/Veritas enrollment, real model source, original LDWMD, durable Continuum, final attestation, canonical ledgers and audit using one exact signed request identity. Resolve unknown-outcome jobs without replaying them.
4. Prove an available downloaded supported model through `Model Hub -> Bridge /v1/generate -> GPU SDK -> Runtime -> Formula -> PRE -> original LDWMD -> LeeWay graph -> Continuum readback -> POST + commit attestation -> Receipt/Learning Ledger readback -> release`. Preserve actual hashes and scope. Do not substitute a fixture or the hardware diagnostic.
5. Promote a clean-machine standalone release, measure the same pipeline for 5-6 supported models, and expand G44-G48 elastic work under the same governed memory/checkpoint authority. Qualify OS-visible GPU driver enumeration separately from product API discovery.
6. Create one multi-repository pinned release tag/manifest with immutable source hashes, independent reviewer evidence, recovery and rollback identities; do not claim merge atomicity across repositories.

## Proof and authority boundary
Owner acceptance authorizes treating past results as legitimate retained evidence and proceeding with integration. It does not change a historical `SAMPLE_ONLY` signature or synthetic fixture into a real production-scope independent signed PRE/POST. The public API must remain fail closed on missing trusted credentials or evidence. No new live model run, production enrollment, protected ledger append, installer or merge is claimed by this manifest.

## Older paths not to confuse with canonical model inference
- D3D12 diagnostic: optional scoped hardware adapter, not LeeWay GPU product identity.
- Ollama/CUDA desktop LAN preview: retained `UNADMITTED_PREVIEW` only, never a fallback for governed inference.
- G103 CUDA media workflow: research only.
- Existing Voice Fabric: unchanged and exclusively authoritative for speech.
