# LeeWay software graphics — native pixel backend

LEEWAY HEADER — DO NOT REMOVE

**What is implemented:** A real first-party BGRA8 software framebuffer library. It clears, clips filled rectangles, copies opaque pixels between separately owned surfaces, and returns packed independent readback. It executes on the host CPU without a discrete graphics board or external graphics inference engine. It does not create resources or hold owner authority: the caller supplies appropriately admitted, borrowed memory spans, allowing the original LDWMD to remain the memory owner.

**Driver-facing command queue v1 (2026-10-24):** The native backend now accepts versioned 56-byte, pointer-free graphics command packets (clear, rectangle fill, opaque blit), resolves numeric resource handles against separately borrowed user-mode surface views, prevalidates the entire packet before modifying a surface, binds resource views to a caller-supplied 32-byte request digest, increments a synchronous completion fence only after successful dispatch, and refuses readback before that fence. These are correlation and buffer-safety guards, **not** a Veritas signature, an LDWMD lease, or independent evidence of a protected Runtime grant. The queue is a driver-facing user-mode building block—not a WDDM UMD or KMD. Packet limits (256 commands and 64 resources) are per submission, not global model, tensor, or application limits.

**What is not implemented:** Windows WDDM kernel/user-mode driver, OS adapter enumeration or installation, 3D shader/raster pipeline, Direct3D UMD, desktop compositor, movie decoder, gaming conformance, or model inference. The component must never be presented to Windows as a recognized GPU simply because its DLL or service exists. The implementation is a native rendering prerequisite, not the completed OS registration feature.

Build on Windows with the existing Visual Studio Build Tools and CMake, from a separately checked-out LeeWay repository:

```powershell
cmake -S native/windows/software-gpu -B build/leeway-swgraphics -G "Visual Studio 17 2022" -A x64
cmake --build build/leeway-swgraphics --config Release
ctest --test-dir build/leeway-swgraphics -C Release --output-on-failure
```

Release qualification still requires a **real software-only WDDM adapter driver** (not a friendly name, monitor-only indirect display driver, dummy INF, or Microsoft WARP claiming LeeWay ownership), source-pinned driver and WDK toolchain, isolated Windows driver test host, installation rollback, PnP + DXGI enumeration, actual command submission/readback on that adapter, and independently verified governed LeeWay Runtime receipts. No host driver or system graphics settings are modified by this library.

<!-- LEEWAY UNIVERSAL FORMULA GOVERNANCE BEGIN -->

# LeeWay Universal Formula Governance

Authority: Creator and LeeWay Standards.
Formula identity: LEEWAY-FORMULA-v1.0.

The canonical LeeWay Formula is mandatory throughout
the entire LeeWay ecosystem.

Every current and future application, capability,
agent, worker, employee, model, provider, adapter,
automation and integration inherits this requirement.

All applicable interactions, responses, decisions,
actions, revisions, executions, computations, model
inferences, resource allocations, information transfers,
memory operations, storage operations and deployments
must consume the canonical Formula through their
authorized and qualified domain contracts.

Formula availability, documentation, configuration,
health and historical results do not constitute actual
Formula consumption for a new operation.

Recover relevant authorized memory before substantive
work. Preserve identity, provenance, Formula integrity,
authorization, original receipts and verified learning.

Never invent observations, adapter mappings, mathematical
results, execution evidence or independent verification.

No application may bypass applicable Formula governance
by dispatching directly to a provider.

Every new application and capability must demonstrate
applicable Formula consumption before production admission.

Preserve the existing authority hierarchy:

Creator > Standards > Root of Trust > Runtime Fabric >
Agent Lee > Harness > Formula > skills/models/tools >
execution > Veritas > Receipt Authority > Learning Ledger.

Execute the complete engineering loop:

INVESTIGATE > DIAGNOSE > PLAN > IMPLEMENT > TEST >
VALIDATE > REPAIR > RETEST > VERIFY > EVIDENCE >
CHECKPOINT > CONTINUE.

Documentation compliance does not establish executable
enforcement or production admission.

<!-- LEEWAY UNIVERSAL FORMULA GOVERNANCE END -->
