# LeeWay Edge GPU portable runtime integration

The product identity is `leeway.gpu.service`, branded **LeeWay Edge GPU**.
Windows, Linux, Android/Samsung, macOS, iOS and iPadOS are product targets.
Each target must qualify its implementation and physical execution separately.

## Implemented connections

- `contracts/gpu-platform-contract.mjs`: one identity, platform profiles and
  scoped evidence references. Referencing evidence does not verify it.
- `contracts/standalone-product-acceptance.mjs`: application installation,
  lifecycle, public API and complete governed request evidence are assessed
  separately from optional native OS device enumeration.
- `sdk/model-resource.mjs`: bounded device-local model bytes, cancellation,
  cleanup and independent request-bound range verification. The graph can
  consume an admitted native/file/Blob resource without a localhost server.
- `sdk/inference-provider.mjs`: the existing model graph is exposed through
  `capabilities`, `activateModel` and `generate` for the existing Device Bridge
  GPU service and Model Hub contract. Constructor dependencies are trusted
  startup bindings; client requests cannot supply their own provider.
- `core/gpu.bootstrap.js`: WebGPU initialization can use an explicit host
  provider and safely reports unavailable where no such provider exists.
- The existing Apple source defines iPhone/iPad and macOS application targets
  with the same product identity and default-off local opt-in. Unsigned build
  jobs are separate from physical-device execution qualification.

## Trusted deployment composition

The canonical Runtime Fabric adapter is
`adapters/edge-gpu/inference-binding.mjs`. It owns signed enrollment and permit
verification, Formula replay, independent PRE/POST, LDWMD, staged and committed
Continuum readback, final commit attestation and both ledgers. Its seven methods
implement the existing GPU consumer contract. No signing key is created by the
GPU or supplied through request JSON.

The host configures `bindingProvider.readiness()` and
`bindingProvider.forClient(authenticatedClient)` plus
`deviceProvider.getDevice({platform,deviceId,signal})`. Client bindings carry the
authenticated principal into the signed Runtime permit. Model plans contain
model, tokenizer and implementation digests and bounded execution profiles.

The SDK additionally requires a signed
`leeway.gpu.provider-qualification.v1` envelope under a trusted Veritas public
key. Its body binds service identity, platform, device, expiry, receipt identity,
and each admitted model's three digests and complete plan digest. Missing,
expired or mismatched qualification leaves the service unavailable.
This is a verifier contract; this change does not manufacture a qualification.

Applications use the existing Device Bridge GPU service routes:
`GET /v1/capabilities`, `POST /v1/models/activate`, and `POST /v1/generate`.
The transport authenticates the client. The SDK obtains its scoped Runtime
binding, tokenizes locally, invokes `runModel`, and releases text only with
matching source/result identity and final commit plus ledger evidence.

## Actual memory ownership

Runtime Fabric's `adapters/edge-gpu/ldwmd-webgpu.mjs` allocates real WebGPU
resources through the original LDWMD database. A prepared buffer bank is admitted
as pinned resources before synchronous operator borrowing. The encoder receives
the exact admitted buffers. It cannot expand the bank or borrow from another
device. Returning a buffer queues clearing; closing unpins and evicts through
the original database. API release is not an independent measurement of OS VRAM
reclamation. Exact model buffer-spec planning remains a deployment dependency.

## Current scope and remaining acceptance

The current complete shader graph implements Qwen2 and Gemma4 text profiles.
Native Metal/Vulkan probes do not execute that graph automatically. Additional
backends must implement the same operator semantics and qualified buffer/resource
interfaces. A target in a manifest is not a tested device.

Qwen3 multi-token reference parity remains unresolved. Qwen3.5 and Gemma3 assets
must be qualified by their actual metadata and digests; a catalog name cannot
establish operator compatibility. The existing Formula spatial and tensor work
remains a separate mathematical capability supporting these workloads.

Agent Lee remains the machine-consciousness runtime identity. Models remain
task capabilities. Responses continue through the existing Voice Fabric route.

Protected production enrollment, real inference-domain Formula policy, actual
owner/model resources, buffer planning and per-platform end-to-end execution must
pass before enabling production. Contract tests use diagnostic fixtures only.
No production signer, native driver, live ledger or Voice Fabric is changed.

## Recovery and source convergence

The prior working source and raw local evidence were copied with SHA-256
comparison before integration. A complete Git bundle preserves the original
repository refs, including the G102 research branch. Recovery source commit
`72590ae819e344b091f172cb770e0515e59bbd9f` contains the former uncommitted product
source. Integration commit `080b2ba` combines that recovery with G40 and retains
newer G40 versions of eleven conflicting historical evidence-contract files.
Large raw benchmark files, weights, local profiles and private keys are not
release payloads.

## Review and local validation

Signed envelopes are snapshotted before asynchronous verification. A resource
cleanup failure retains ownership and supports an explicit startup recovery
retry. Reads remain closed during that retry. Regression checks cover both.

On the Windows development host, the portable GPU suite passed 238 tests, the
existing software guardrail suite passed 56, and Apple source/target checks
passed 8. Runtime binding plus original LDWMD and GPU consumer integration passed
25 tests. Device Bridge passed 41 tests with both reviewed source roots supplied,
including the complete HTTP-to-Runtime diagnostic fixture. These are contract
checks, not downloaded-model benchmarks or physical-device certification.
