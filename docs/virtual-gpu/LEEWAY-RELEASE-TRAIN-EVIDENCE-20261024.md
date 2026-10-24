# LeeWay Edge GPU — pinned cross-repository evidence and integration baseline
Date: 2026-10-24
Status: OWNER-ACCEPTED ENGINEERING EVIDENCE; PRODUCTION SAME-REQUEST QUALIFICATION NOT YET OBSERVED
Source authority: LeeWay owner-directed repository and retained receipts
Product identity: LeeWay Edge GPU, `leeway.gpu.service`
Execution identity: LeeWay-owned quantized WGSL graph, with explicitly qualified LeeWay software providers and optional platform adapters.
This document records source merges and evidence. It does not create grants, waive protected gates, or enable live dispatch.

### Protected installation inventory — Agent-Lee read-only
The existing `inspectG37InstalledScopeInventory` source inspected `ProgramData/LeeWay/C3/GpuTask` without reading private keys or modifying any instance. It found 11 protected instance directories, seven readable `trust.json` records, seven claiming `OWNER_GOVERNED_C3_GPU_DIAGNOSTIC_V1`, and **zero** claiming the separate software scope `OWNER_GOVERNED_C3_SOFTWARE_GPU_COMPUTE_V1`. This is read-only metadata, not proof that the diagnostic enrollments currently authorize anything. `productionAdmissionAuthorized:false` remains enforced.

A canonical software-inference Veritas identity therefore cannot be manufactured by registering the old hardware diagnostic signer. The existing software-only installer path and separate-host Veritas reviewer require their own source-pin, custody, enrollment, and signed work-order qualification; the Learning Ledger readback capability likewise cannot be promoted into canonical writer admission without verified POST and ledger evidence.

## Follow-up mainline integration — 2026-10-24
- Runtime Fabric [PR #81](https://github.com/4citeB4U/Leeway-Runtime-Fabric/pull/81) merged `repair/floating-agent-interaction` (including merged GPU inference Runtime #80) into Runtime `main` at **`123388e120bdffcb45f2e5ee7fd1b1c3dea87894`**. Five GitHub workflows PASS: Portable GPU Runtime binding, Persistent Workplane Proof, Continuum Curved Hierarchy, Continuum Sphere UI and Model Calibration Domain.
- Isolated Agent-Lee source checks before merge: **54/54** targeted inference/LDWMD/Receipt tests and **74/74** G27-G38 protected-source authority tests PASS. Five conflicts reconciled: source pin checkout attributes, union of both workplane workflow suites, VRAM deferred-failure status, Receipt HTTP 503 invalid-chain enforcement and matching regression.
- Reused new Device Bridge GPU service (reviewed service contract from merged PR #55) on staging loopback **127.0.0.1:4179** without replacing the existing installed service at 4178. `GET /v1/status`, `GET /v1/manifest` and `GET /v1/capabilities` returned HTTP 200; service identity is `leeway.gpu.service`, backend `LEEWAY_GPU`, and capability state `UNBOUND` (`modelInference:false`). This is a staging transport/product identity pass, not a qualified inference execution.
- Read-only live Runtime admission checker still reported `INDEPENDENT_VERITAS_PROVIDER_UNREGISTERED` and `CANONICAL_LEARNING_LEDGER_PROVIDER_UNREGISTERED`. The registry contains historical `learning.ledger.readback` only, **not** canonical `learning.ledger.admission`. Original installed Veritas diagnostic signer and its D3D12 scope must not substitute software inference Veritas authorization. Existing cross-host PR #79 stage signer remains `SAMPLE_ONLY`.
- **Protected runtime inference not activated.** No production root, issuer, Veritas, grant, key, ledger append, installer or evidence was fabricated. Activation requires separately qualified real provider enrollment and same-request PRE/POST/Continuum/ledgers, then approved clean restart/cutover.
- Local staging port 4179 and E-drive paths are transient deployment observations, **not** source-controlled product constants or cross-platform limits.

## Live merge and deployment ledger — October 24, 2026
This section supersedes the pre-merge draft states and head-only input revisions recorded below. Source code merge is not protected runtime enrollment.

| Component | Merge destination | Merge commit | Result |
| --- | --- | --- | --- |
| GPU #11 software/mathematics | GPU main | `12c2fa35d2684dc4606ac4c468adb1c4810bac6e` | MERGED |
| GPU #13 portable core + initial evidence record | GPU main | `c75af1e84a45abb0b4a4f9b8b69b41eb97e1c80f` | MERGED |
| Device Bridge #55 app service | Device Bridge main | `1548a207721c0fd1b5361870c071bd85d4136b46` | MERGED |
| Model Hub #2 GPU-required client | Model Hub main | `c6d367155f01f769c44256e13b5f7913b5cc1214` | MERGED |
| Formula #16 G41 | Formula main | `38f1d8a4fbad5d32223da245bcacce56f6a27317` | MERGED; optional candidate |
| Formula #17 G42–G43 | Formula main | `fb1016d906e372c1a2b1cbc929fea031b5ebd68a` | MERGED; optional candidate |
| Formula #19 G44 stronger hierarchy | Formula main | `11dbd9ade2d90285d66fb6b210dd42da51e542cd` | MERGED; optional candidate |
| Runtime #76 append-only Learning readback | Runtime main | `d4825077bc7557ef46af40fc12b867c89be11423` | MERGED; scoped read-only |
| Runtime #78 original LDWMD host buffers | Runtime main | `cb768ba8cfd1147be50b9ff66ed0f97681005edf` | MERGED |
| Runtime #77 software authority/source checks | Runtime main | `93ef840c40da242fb3a7912a38bfd1a93aad9eaa` | MERGED after conflict reconciliation |
| Runtime #80 portable inference binder | `repair/floating-agent-interaction` only | `1230c3b14fdedb2b4af5c450e17c57c7523973ff` | MERGED TO ACTIVE BASE; NOT MAIN |

The Runtime #77 merge preserved the newer LDWMD and workplane workflow and added the G27–G38 candidate tests. Its pinned seven G37 source hashes were NOT changed: the Windows SHA mismatch was due to CRLF checkout, repaired by explicit LF .gitattributes. Local reconciling tests: 74/74 authority and 7/7 LDWMD. The new head `365b673ab8a51a09a1b06575655c76370022c420` passed GitHub Persistent Workplane Proof before merge.

Outstanding branch convergence: GPU #12 optional torch.leeway is unmerged and conflicts with current GPU main after retarget; Formula #18 is a divergent G44 candidate requiring unique-source comparison against merged #19; Runtime #79 remains SAMPLE_ONLY and unmerged; Runtime #80's merged *feature base* still requires deliberate mainline reconciliation. Historical C3 #62/#65 remain draft proof branches, not a release. Do not force-merge changes or silently promote candidate attestations.

E-drive custody: original E-drive checkout was compared by Git object hashes against `codex/recovery-gpu-source-20261023`: 164 modified/untracked files were byte-identical; 10 differed by raw byte count (nine normalized into previously committed identical Git blobs; one real contributor documentation delta), 176 other missing paths were largely generated evidence or local work notes. The only unique source-control delta was 127 new contributor-doc lines, committed and pushed to nonproduction `codex/recovery-gpu-delta-20261024` as `dca3c4e`. The original dirty working tree and local generated evidence were not overwritten or bulk-pushed.

Live read-only Runtime readiness on Agent-Lee: Receipt Ledger HTTP 200 (24 valid entries); `scripts/c3-live-admission-readiness.mjs` returned `BLOCKED` with `INDEPENDENT_VERITAS_PROVIDER_UNREGISTERED` and `CANONICAL_LEARNING_LEDGER_PROVIDER_UNREGISTERED`. The existing local GPU service at port 4178 responds to `/v1/status` but reports `CANONICAL_GPU_ISSUER_UNBOUND`, `requestedEnabled:false`, `productionReady:false`, and `dispatchAllowed:false`; it does not expose the new governed `/v1/capabilities` route yet. Thus **protected production runtime has NOT been activated**, and no fresh inference ledger append or certificate was claimed. Fail-closed policy remains enforced.

## LeeWay invariants
- Agent Lee = `LEEWAY_MACHINE_CONSCIOUSNESS`; the model is an optional task capability, never the agent identity.
- Voice is exclusively the existing LeeWay Voice Fabric; do not replace its provider or selection.
- Model-, OS-, device-, and drive-agnostic interfaces: per-model architecture profiles, per-platform qualified adapters, portable relative/configured paths. No fixed E: path is a deployment identity.
- GitHub is the pinned source, release, test, and evidence record. GitHub hosting does not itself supply live GPU compute, the owner's Runtime provider, or protected credentials.
- Runtime Fabric/Discovery authenticates ingress and owns the work order. Qualified Formula evaluates the exact envelope; independent Veritas PRE admits; original LDWMD owns live buffers; LeeWay graph executes; Continuum stages, independently reads, commits, and recovers; Veritas POST and final attestation bind the result; Receipt and Learning Ledgers admit exactly once; Audit Triad verifies the chain.
- No external inference service or silent CPU/CUDA neural fallback for a request admitted to the LeeWay-owned inference graph. Explicit LeeWay software-tensor profiles are separate capabilities.
- Frozen `LEEWAY-FORMULA-v1.0` is unchanged. New policy adapters and research are versioned outside it.
- Never mistake test fixtures, source claims, owner approval, sample cryptographic receipts, or hardware diagnostic execution for a completed protected same-request production transaction.

## Historical source revision pins before the above merges (reviewed 2026-10-24)
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
