# LeeWay Windows native DXGI–PnP adapter correlation

LEEWAY HEADER — DO NOT REMOVE

**Function:** This component reads the real Windows display adapter interface inventory, opens each interface through the documented graphics-kernel adapter thunk, then compares its LUID against actual DXGI adapter enumeration. The matching PnP instance ID is obtained from SetupAPI, not guessed from the friendly name. This supplies missing OS-detection evidence for the LeeWay Windows software GPU milestone.

**Already implemented:** Native C++ Win32 x64 application using SetupAPI, Dxgkrnl D3DKMT, DXGI and Config Manager. It reports read-only JSON with exact PnP instance, running-device status, service identity and DXGI LUID. The LeeWay classifier separately correlates VideoController and running graphics system-driver identity; it cannot claim OS recognition on a name alone or accept DXGI entries without native-mapping evidence. No external inference or vendor compute path is used.

**Not implemented:** Windows WDDM KMD/UMD, GPU device creation or installation, independent command/readback on an OS-enumerated LeeWay adapter, protected Runtime grant, certified driver signing. Existing physical adapters are listed *only to validate the correlation method* and are never treated as the LeeWay compute backend.

Build on a Windows development machine:

    cmake -S native/windows/dxgi-probe -B build/dxgi-pnp -G "Visual Studio 17 2022" -A x64
    cmake --build build/dxgi-pnp --config Release

To connect to LeeWay's existing read-only Windows admission probe:

    $env:LEEWAY_DXGI_PNP_PROBE = (Resolve-Path build/dxgi-pnp/Release/leeway_dxgi_pnp.exe).Path
    node tests/virtual-gpu/windows-adapter-qualification.mjs "$env:TEMP/leeway-adapter-qualification.json"

A passing correlation test is a **measurement capability**, not an OS-recognized LeeWay GPU. Windows GPU registration remains blocked until a complete genuine WDDM software KMD/UMD package executes submitted commands on a recognized LeeWay adapter in an isolated test host with independent evidence.

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
