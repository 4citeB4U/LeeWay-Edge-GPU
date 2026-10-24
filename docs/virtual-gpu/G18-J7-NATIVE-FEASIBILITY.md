# G18 — J-7 native GPU feasibility and contract review

**Checkpoint:** 2026-10-16. **Role:** J-7 (Codex), native implementation and platform feasibility. **State:** discovery/review complete; a bounded D3D12 physical-GPU dispatch prototype is implemented and qualified on the existing adapters. No LeeWay OS-native adapter or Device Bridge/Runtime Fabric integration is implemented.

## Findings

### Windows

- The repository's `native/windows` directory contains adapter-admission JavaScript and tests only. No WDDM KMD/UMD source, INF, Visual Studio driver project, or Windows driver build target exists.
- Installed-path discovery finds Visual Studio Build Tools 17.14.41, MSVC 19.44.35229.0, MSBuild 17.14.60, Windows SDK 10.0.26100 user-mode components and `signtool.exe`. It does not find `infverif.exe`, `wdm.h`, or WDK kernel-mode driver targets. The driver build gate is therefore **BLOCKED**, even though the C++ compiler is installed.
- The corrected readiness probe finds Visual Studio through `vswhere` and inspects Windows Kits locations; a PATH-only result is not treated as proof that the compiler or build system is absent.
- Fresh OS correlation remains `NATIVE_ADAPTER_NOT_ENUMERATED`: PnP display recognition, Win32 video-controller correlation and LeeWay driver service are false. Compute submission, WebGPU discovery and Diagnostics telemetry remain unverified/false.
- Microsoft documents WDDM as an OS graphics stack with kernel-mode and user-mode driver components. Its architecture places scheduling and video-memory management in Windows graphics kernel components and requires the supplied driver components to interoperate through documented DDIs. That makes a genuine OS graphics adapter a substantial driver project, not a PnP label or an application service.
- Microsoft's IddCx model is for indirect/virtual display scenarios and desktop-frame delivery. It can support a virtual monitor, but that is not evidence of a general-purpose LeeWay compute adapter.
- Microsoft's documented Hyper-V GPU partitioning flow is scoped to Windows Server 2025 and requires supported GPUs/drivers. This machine is Windows 11 Home. Hyper-V optional-feature inspection returned an elevation requirement, so VM availability is **UNVERIFIED**; the Windows Server GPU-P instructions do not establish a supported isolated WDDM test path here.

### Real GPU execution prototype

`native/windows/d3d12-compute/prototype.cpp` enumerates DXGI hardware adapters, rejects software adapters, creates a D3D12 compute queue, dispatches a deterministic 262,144-element kernel, waits for a GPU fence, copies results to a readback resource, and compares every value against an independent CPU reference. `build-run.ps1` locates installed MSVC/Windows SDK components, compiles the native executable and writes source/build/runtime/output hashes plus per-adapter results to the evidence directory.

On this host, the D3D12 prototype compiled and ran on **NVIDIA GeForce RTX 5060 Laptop GPU** and **Intel(R) Graphics**. Both dispatches wrote 262,144 elements; both readbacks matched all CPU reference values (0 mismatches). This verifies real D3D12 command submission and readback on those existing physical adapters for this test kernel. The executable explicitly reports `UNQUALIFIED_PROVIDER_PROTOTYPE`, `runtimeFabricAuthorized: false`, and `leeWayOsNativeGpu: false`: it is not yet a LeeWay-controlled Runtime Fabric provider and is not a third OS adapter. The sub-millisecond timings rounded to 0 ms and must not be used as performance evidence.

### Device-awareness contract review

J-5 revised `contracts/device-awareness-g18.mjs` after review. The updated admission path requires receipt ID, source, SHA-256, and matching observation ID for execution/native claims, and calls a verifier callback that must return strict `true`. The revised ten contract tests pass. This is a stronger fail-closed contract, but it still relies on the call site's verifier being an authorized, trusted binding; the admission helper itself does not authenticate that callback or read/hash the referenced evidence. It is not a Veritas receipt.

The canonical local `trusted-host-read-veritas.mjs` is scoped to `leeway.host.info` (host identity/OS/architecture/CPU count) and cannot qualify D3D12/GPU command/readback evidence. `model-domain-veritas-v0.mjs` is scoped to model calibration and Formula/device/model identity. The generic `canonicalFinalVeritas` invokes final-delivery policy after scoped outcome verification; it does not independently verify GPU evidence. I found no existing canonical GPU qualification profile in the inspected Runtime Fabric Veritas source. Therefore J-7 does **not** bind either unrelated profile to GPU evidence. A GPU-specific verifier or an explicitly authorized verifier contract is still needed; its trusted wrapper must validate actual evidence bytes/content hash, evidence scope and device/API correlation, time/freshness, and the independently reproduced command/readback result before it returns acceptance.

The repository's `L8_Telemetry_Assembly/Diagnostics.tsx` currently labels memory as `24GB VRAM` and generates temperature with `Math.random()` in response to a separate `northbridge:pulse` UI event. This is presentation/demo state, not verified device telemetry. J-5's Digital Brain/Diagnostics integration must not ingest or relabel these values as measured GPU facts.

## Implementation boundary

Two outcomes must remain distinct:

1. **LeeWay-managed GPU compute provider:** LeeWay dispatches real work through an existing, OS-enumerated Intel/NVIDIA adapter using a supported API such as D3D12/WebGPU. This can demonstrate actual GPU execution while accurately attributing the physical device. It is a provider/adapter capability, not an additional Windows GPU.
2. **LeeWay OS-native virtual GPU:** Windows itself enumerates a separately implemented LeeWay adapter and the OS/API submits work to it. This requires a complete supported graphics driver path and independent command/resource/readback qualification. Current repository source and installed WDK components do not satisfy that gate.

No CPU fallback, WARP result, indirect display, software device label, synthetic DXGI object, or existing physical-GPU execution may be counted as the second outcome. Do not write driver source against guessed DDI contracts or create an INF/KMD stub as a proxy for execution.

## J-5 handoff and next stride

**J-7 ACK:** Receipt and review of both revisions of J-5's G18 S0/S1 device-awareness contract are acknowledged in `CONTRIBUTORS.md`. J-5 accepted the evidence-envelope and demo-telemetry findings, added evidence-reference fields and a verifier callback, and acknowledged J-7's feasibility review. J-7 identified no GPU-specific profile in the inspected canonical Runtime Fabric Veritas source; that response is recorded in the ledger. Contract tests: 10/10 PASS; combined contract/admission tests: 16/16 PASS. **Joint milestone:** still open; J-5's note explicitly keeps S2 blocked until mutual review and runtime qualification.

Keep S2 blocked until an authorized GPU-specific Veritas binding is identified or designed by the appropriate authority and the D3D12 path is qualified through Runtime Fabric execution authorization and canonical evidence/receipt flow. Then pass attributed observations to J-5 for integration. Keep the current demo-only Diagnostics telemetry out of the verified lane. Preserve Device Bridge, Digital Brain, Continuum and LDWMD ownership. Before any separate Windows OS-driver implementation, resolve WDK installation/compatibility and a supported isolated validation environment under the existing owner-approved development boundary. Mobile Vulkan/Metal capability remains **NOT EXECUTED** in this checkpoint; the G17 platform design is architecture only.

## Evidence and authoritative references

- Local source and report: `native/windows/README.md`, `native/windows/adapter-contract.mjs`, `contracts/device-awareness-g18.mjs`, `contracts/device-awareness-g18.test.mjs`.
- Read-only evidence: `E:/LeeWay-Work/evidence-staging/native-gpu-readiness-g18/windows-driver-toolchain.json` (SHA-256 `c6bb538a4c54177a9ae1b22f2b979cf73ac429c398d8468de1b1a5d278e8e683`); `windows-adapter-qualification.json` (SHA-256 `bbb6a1f8cda08b0cbd92485042c703df2000d9cf28817b737c7dfa1540b70985`). The earlier PATH-only probe is retained as `windows-driver-toolchain-path-only.json` and is not authoritative for installed compiler presence.
- D3D12 build and execution: `native/windows/d3d12-compute/prototype.cpp` SHA-256 `169ee02ee52df6f134673739f69c4f8c58373c5217e449ed29c248b785081afc`; `build-run.ps1` SHA-256 `d466768134532fae94d1391355ec3af20ec775b1cc18f8a534160a2b657c100a`; output `evidence-staging/native-gpu-readiness-g18/d3d12-compute/d3d12-compute-evidence.json` SHA-256 `d3872c7468cf4ae90a5d117f0dff5b7c678beb3fc4895560560356a35f121266`; executable SHA-256 `573354c8dd36ada6fb4f9fa2e945f918cdc176260ad6a6ed7d46b9b67cdf7f04`.
- Build/run command: `& '.\native\windows\d3d12-compute\build-run.ps1'` — native x64 build exit 0; D3D12 execution/readback 2/2 physical adapters PASS.
- Contract command: `node --test contracts/device-awareness-g18.test.mjs` — **10 passed, 0 failed**.
- Latest contract SHA-256: `contracts/device-awareness-g18.mjs` `09f01c391fceb88be48021bcf66cc4ecfccaf1034cdf4d488205d62ea74d1394`.
- Contract/admission commands: `node --test contracts/device-awareness-g18.test.mjs` — **10 passed, 0 failed**; `node --test contracts/device-awareness-g18.test.mjs native/windows/adapter-contract.test.mjs` — **16 passed, 0 failed**.
- Microsoft Learn: [WDDM architecture](https://learn.microsoft.com/en-us/windows-hardware/drivers/display/windows-vista-and-later-display-driver-model-architecture), [Indirect Display Driver overview](https://learn.microsoft.com/en-us/windows-hardware/drivers/display/indirect-display-driver-model-overview), [GPU paravirtualization](https://learn.microsoft.com/en-us/windows-hardware/drivers/display/gpu-paravirtualization), [Hyper-V GPU partitioning requirements](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/partition-assign-vm-gpu).

These references support the platform model and scope; they do not prove a LeeWay driver exists or will qualify.
