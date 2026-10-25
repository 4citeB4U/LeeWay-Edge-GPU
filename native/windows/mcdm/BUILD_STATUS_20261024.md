# LeeWay Windows MCDM source compilation and native-driver admission

LEEWAY HEADER — DO NOT REMOVE

**Date:** 2026-10-24. **Scope:** genuine Microsoft MIT compute-only driver source modernized for object-file compilation. **Authority:** test-only; no kernel installation or production certification.

| Component | Actual result | Remaining |
| --- | --- | --- |
| Microsoft compute-only KMD | **11/11 source modules compile; original WDK project links one unsigned native-subsystem `.sys`, and import inspection passes** ([PR #24](https://github.com/4citeB4U/LeeWay-Edge-GPU/pull/24); [run `40137636996`](https://github.com/4citeB4U/LeeWay-Edge-GPU/actions/runs/40137636996)) | LeeWay-specific PnP identity, driver package/signing, isolated OS install, same-adapter compute/readback, and recovery |
| Microsoft D3D12 UMD | **26/26 source modules compile** | Shader compiler binding and complete DLL link |
| LeeWay original software engine | Existing separate lab execution PASS | Bind governed same-request commands under LDWMD and Veritas |
| Windows adapter / isolated driver-test host | **NOT VERIFIED** | Authentic LeeWay software PnP/INF, signed install, D3D12 same-adapter readback, recovery |

The new `compile-kernel-all-objects.ps1` processes **every original Microsoft `coskmd/*.cpp`**, including `CosKmdGlobal.cpp`, with real WDK TraceWPP recorder generation, authentic ETW enable/disable and level constants, and Microsoft's documented `WPP_LEVEL_FLAGS` behavior. `trace-compile-compat.h` is a build compatibility shim only, not a replacement graphics driver or a way to disable tracing. Source remains unmodified under its original MIT license. Previous `compile-kernel-five-objects.ps1` stays available as an earlier diagnostic.

The `compile-umd26-objects.ps1` remains the canonical 26-unit Windows SDK user-mode source compilation. Agent-Lee confirmed **all 37 translation units compile**. The Windows hosted CI workflow independently must compile all **11+26** and is required for merge acceptance.

**Current link status:**

- **KMD:** An earlier standalone `link /DRIVER /SUBSYSTEM:NATIVE` probe reported unresolved `__stdio_common_vswprintf`; that probe is superseded for the current KMD build path. PR #24's original WDK `CosKmd.vcxproj` build passed on head `e006cbaff223e89a755abd1e6b28b89742effae2`, produced exactly one unsigned native-subsystem `.sys` in the CI temporary directory, and passed import inspection with no user-mode CRT. This validates the sample KMD link only; it does not establish a LeeWay-specific device identity or an operational device.
- **D3D12 UMD:** The separate 26-object link still fails on `__imp_vpu_compiler`, a dependency on Microsoft's sample VPU compiler. No placeholder export or fake compiler is acceptable. This remains an optional Windows adapter lane; the portable LeeWay GPU execution contract remains the product's execution center.

**Production memory/authority binding remains separate:** the sample's `CosKmdGlobal::s_pVideoMemory` is not the canonical LeeWay VRAM database. A correct driver must establish validated user/kernel resource descriptors backed by the original LDWMD host leases, and tie request identity to Runtime Fabric, Formula, independent Veritas PRE/POST, Continuum readback and durable Receipt/Learning Ledgers. No such live protected same-request binding is established here.

**Windows registration remains blocked.** The upstream sample INF targets `ACPI\\COMPUTEONLYSAMPLE`, not LeeWay, and cannot be installed as a first-party device. Agent-Lee has no qualified isolated Windows driver-test VM and its virtualization feature query requires elevation. No changes were made to host display drivers, registry, boot, signing settings, or Application Control.

Reproduce the verified compilation (source-only):

```powershell
node --test native/windows/mcdm/source-contract.test.mjs native/windows/mcdm/kmd-object-contract.test.mjs native/windows/mcdm/module-compile-contract.test.mjs native/windows/mcdm/full-kernel-source-contract.test.mjs
./native/windows/mcdm/compile-kernel-all-objects.ps1
./native/windows/mcdm/compile-umd26-objects.ps1
```

**Native Windows GPU acceptance** requires complete KMD and UMD linking, independent driver import/security review, owner-approved signed device identity, isolated OS installation/uninstallation and recovery, a true LeeWay adapter PnP/DXGI mapping, and independently verified compute and graphics workloads on that same adapter. Compute-only MCDM may not support general-purpose games/movie/rendering APIs; those require additional WDDM graphics capabilities.
