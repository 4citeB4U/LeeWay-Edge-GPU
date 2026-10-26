# K2 — LeeWay GPU device and service audit

- **Work ID:** K2-GPU-DEVICE-20261022
- **Date:** 2026-10-22
- **Scope:** read-only source and contributor-note inspection; no live probe, build, test, install, commit, or driver change.
- **Reviewed tree:** `E:/LeeWay-Work/LeeWay-Edge-GPU`, a dirty working tree containing tracked modifications and untracked work. No checkout, reset, or cleanup was performed.

## Conclusion

The inspected repository implements a physical-GPU compute prototype, a local application-level discovery service, and a process-scoped Vulkan observation layer. It does **not** contain a working independently enumerated Windows GPU device or a native Vulkan ICD in the inspected Windows native tree. A CPU tensor reference exists, but it is an application-level computation/reference path, not an operating-system GPU device or an independently qualified LeeWay software GPU.

The latest contributor notes report successful isolated and remote-triggered D3D12 diagnostics on the existing NVIDIA GPU, while the production service remains fail-closed. These are reported historical observations, not a live test performed by this audit. The native Windows README explicitly states there is no working WDDM driver.

## Interfaces and evidence

| Interface | Source evidence | What it actually provides | Qualification |
| --- | --- | --- | --- |
| Windows D3D12 prototype | `native/windows/d3d12-compute/prototype.cpp:127`, `:199`, `:221`, `:239`, `:251`, `:335-357` | Enumerates existing DXGI adapters, skips software adapters, creates a D3D12 device, resources, queue, dispatch and readback. | Physical adapter execution. It does not create a separate LeeWay OS GPU. |
| Windows native adapter contract | `native/windows/adapter-contract.mjs:1-15` | Classifies supplied PnP/video observations and requires correlated native execution evidence. | Admission logic only; it installs no driver and cannot make an adapter appear. |
| Native Windows driver / ICD | `native/windows/README.md:3-24`; read-only listing of `native/windows` | No `.inf`, `.sys`, driver `.vcxproj`, or ICD source/manifest was found in that directory; no driver entry/DDI or ICD loader exports appeared in the inspected `native` and `applications` source. | No working WDDM driver or ICD identified. This search does not assert the absence of every binary or external driver elsewhere on the host. |
| Vulkan layer candidate | `applications/vulkan-layer-candidate/README.md:3-20`; `leeway_layer.cpp:26-32,49-65,76-95,102-122` | Explicit layer negotiates loader interface and forwards instance/device calls to the next layer; its README limits activation to a diagnostic process. | Pass-through observation layer, not an ICD, independent physical device, compute substitution engine, D3D12 adapter, or OS GPU. |
| Local service and client | `applications/desktop/build/leeway-gpu-service/service/service.mjs:16-26,44,85-91`; `client.mjs:4-25,27-47`; `index.mjs:3-17` | Local loopback status and manifest, identity check, and an explicit client interface. Status says `LOCAL_DISCOVERY_ONLY`; production dispatch is denied with HTTP 503 and client routing remains `SYSTEM_NATIVE`. | Service discovery and API shape only. It is not a Windows device registration and does not authorize production execution. |
| Desktop packaging | `applications/desktop/build-desktop-bundle.ps1:12-37`; `install-windows.ps1:1-24` | Copies the Device Bridge service and preview files; installer creates per-user files and shortcuts. Package manifest says `systemWideGpuDriver=false`. | Application deployment, not driver installation. Backend names in its manifest are declared targets, not proof of per-platform backend qualification. |
| Remote inference preview | `applications/desktop/README.md:3-16`; packaged `gpu-inference/ollama-gpu-adapter.mjs:28-30,47-59` | A paired client can request an allowlisted model on a Windows workstation using Ollama/CUDA and checks positive VRAM residency. | A separately labeled physical NVIDIA GPU preview. It does not enable the canonical `/v1/execute` path, create an additional GPU, or provide verified Formula/Veritas execution. This audit did not run it. |
| CPU computation | `fallback/tensor-reference.mjs:10-19`; `core/hybrid.dispatcher.js:95-132` | Scalar tensor reference and explicitly admitted CPU tensor path; records backend and local-reference scope. Inference follows a separate stricter route at `core/hybrid.dispatcher.js:41-46`. | Application-level CPU functionality; no independently enumerated software GPU. No inference fallback may be silently relabeled GPU. |
| Android service | `applications/android-leeway-gpu/src/industries/leeway/gpu/GpuCapabilityService.java:13-44` | Messenger status and a denied execute response. | Service capability projection only, not an Android system GPU or proof of model inference. |

## Acceptance and provenance gap

`contracts/g19-standalone-gpu-acceptance.mjs:7-17` requires a physical, hardware-backed backend for its component pass, and separately requires native adapter enumeration, a LeeWay-owned provider, command/readback, native driver or ICD qualification, and canonical authority. It always returns `isOsNativeStandaloneGpuVerified:false`, even if supplied booleans satisfy its readiness conditions. Therefore it is a conservative classifier, not a live attestation mechanism; it also cannot describe a CPU-backed independent software compute device as a separately labeled component outcome. This is a schema/semantics gap, not proof that such a device is implemented.

The platform architecture says Windows physical and LeeWay provider identities must remain separate and that an ICD manifest alone is insufficient (`docs/virtual-gpu/THREE-DEVICE-NATIVE-PROVIDER-G17.md:19-41`). Its original device-observation table is historical; later contributor notes add physical Android Vulkan and Apple Metal observations, which do not by themselves establish an OS-enumerated LeeWay GPU.

The contributor ledger records G21 and G22 D3D12 readbacks as **isolated test-only** using a candidate issuer, provisional Formula mapping and synthetic Continuum; it states that canonical Runtime Fabric issuance, approved Formula scheduling, owner Continuum, canonical Veritas and production dispatch remain unqualified (`CONTRIBUTORS.md:394-396,432-442`). Its G22 capacity note states that the service does not add VRAM to the physical adapter (`CONTRIBUTORS.md:444-445`).

## Platform limits

- **Windows:** The physical D3D12 prototype and discovery service exist. A real LeeWay WDDM-compatible driver package and isolated guest qualification are still missing from this audit. The candidate Vulkan layer does not supply an ICD or system-wide D3D12 routing.
- **Android:** The service exports status/denial and the repository has an app-scoped physical Vulkan probe. A vendor physical Vulkan device is not an independently registered LeeWay system GPU.
- **Apple:** Native Metal may execute through an app on an existing Apple device, but a wrapper or PWA does not create a second OS Metal device. Apple registration and native app claims must remain separately qualified (`docs/virtual-gpu/THREE-DEVICE-NATIVE-PROVIDER-G17.md:33-37`).
- **Linux:** The packaged script creates a user service (`applications/desktop/install-linux.sh:3-28`); the platform plan calls Linux Vulkan conditional and unqualified (`docs/virtual-gpu/LEEWAY-GPU-AS-A-SERVICE-PLATFORM-SCOPE-20261019.md:8-10,25-29`). An ICD would need a real implementation and its own qualification; its presence would not itself establish DRM kernel GPU registration.

## Smallest safe patch proposed for K1 review

Add a versioned, explicit capability/result classification at the **existing** service and acceptance boundary for three distinct outcomes: `SOFTWARE_COMPUTE_DEVICE` (CPU-backed, explicit opt-in), `PHYSICAL_GPU_BACKEND` (with actual hardware attribution), and `OS_NATIVE_GPU_ADAPTER` (separate enumeration plus native submission/readback). Keep all three unavailable or unverified until their own evidence is present. Preserve the current production `/v1/execute` denial and existing Formula, Runtime Fabric, LDWMD, Continuum, and Veritas ownership. Do not use an application service, CPU fallback, or layer identity as proof of an OS GPU.

As a subsequent isolated development step, define a bounded software-compute command, memory and fence contract that reuses the existing CPU tensor engine, records its CPU backend explicitly, and validates deterministic output against an independent reference. That would be an application-visible software compute device candidate, not a Windows WDDM adapter or a hardware GPU. A separate, supported driver/ICD implementation, packaging, and isolated VM qualification are still required for OS/API enumeration. Existing owner boundaries prohibit host driver installation, security changes, and reboot without separate approval.

## Verification boundary

This audit only inspected source, package contents and existing notes. No code was edited in the GPU repository, no tests or device probes were run, and no new claim is made about present host enumeration, current physical dispatch, canonical authority, or a Veritas receipt.
