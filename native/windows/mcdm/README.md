# LeeWay Edge GPU — genuine Windows compute-only driver foundation

LEEWAY HEADER — DO NOT REMOVE

**Source stage: Microsoft MIT compute-only driver sample pinned and verified, NOT an installed or working LeeWay OS adapter.**

The OS recognition requirement cannot be satisfied by renaming a DLL, installing a monitor-only driver, returning a friendly service name or borrowing NVIDIA's Device Manager presence. LeeWay needs its own correctly enumerated, signed Windows driver with actual software compute execution.

To avoid recreating the graphics-kernel infrastructure, the existing Microsoft **Compute Only Sample Driver** is preserved here as an upstream reference under `third_party/microsoft-graphics-driver-samples/compute-only-sample`.

- Origin: <https://github.com/microsoft/graphics-driver-samples/tree/de4a2161991eda254013da6c18226f5ea06e4a9c/compute-only-sample>
- Pinned upstream commit: `de4a2161991eda254013da6c18226f5ea06e4a9c`
- License: **MIT**, preserved verbatim in `third_party/microsoft-graphics-driver-samples/license.txt`.
- Source copied: 127 original sample files and one original license; no `.sys`, `.dll`, `.exe`, key, signature, or packaged binary.
- Kernel source: `coskmd`, including scheduling / context / command buffer handling, `CosKmdSoftAdapter.cpp` and driver callbacks.
- User-mode source: `cosumd12`, Direct3D 12 driver interface and software command-list / dispatch model.
- Other original dependencies: `coscommon`, `vpucommon`, `vpucompiler`, `cosdriver` and tests.

## Where LeeWay's real components attach

The existing **LeeWay original LDWMD** remains responsible for approved host-memory leases; Formula and Runtime Fabric remain the decision and grant authorities; Veritas PRE/POST and the Receipt/Learning Ledgers remain independently enforced. This sample's original internal `CosKmdGlobal::s_pVideoMemory` and `CosKmdSoftAdapter::ProcessRenderBuffer` are reference code **not yet governed by LDWMD**. They cannot be advertised as LeeWay's protected production memory manager.

The future qualified driver must preserve one request identity across PnP → Direct3D 12 UMD → kernel scheduling → original LeeWay software compute operator → LDWMD resource/fence → independent readback → Continuum → Veritas → ledgers. The already working LeeWay software raster / command queue stays canonical in `native/windows/software-gpu` and `native/windows/d3d11-umd` for the user-mode path. Do not attempt to link that DLL directly into kernel mode.

## Inspected build blockers (Agent-Lee, 2026-10-24)

The Microsoft example is old and its project files are not yet compatible with the installed Visual Studio driver toolsets:

1. Native KMD project requests `WindowsKernelModeDriver10.0` — current VS Build Tools has only `v143`; MSBuild emits `MSB8020`.
2. D3D12 UMD project requests Windows SDK `10.0.18298.0`; Agent-Lee has `10.0.26100.0`; MSBuild emits `MSB8036`.
3. Retargeting both to `v143`/SDK `10.0.26100.0` passes `PrepareForBuild` but **does not qualify a driver**.
4. KMD `ClCompile` fails for missing `Cos.h` unless its `coscommon` and other sample dependency include paths are supplied. Next, without the proper WDK driver toolset/architecture definitions, the compiler reports `No Target Architecture`. Sample WPP `.tmh` generation also needs a correct WDK build path.
5. UMD `ClCompile` still fails in source on modern SDK, including missing `VpuCompiler.h` include configuration and incomplete `CosUmd12DescriptorHeap` type.
6. Example INF `cosdriver/cos.inf` explicitly binds **`ACPI\\COMPUTEONLYSAMPLE`**, targets Microsoft sample services, and MUST NOT be installed or rebranded as LeeWay. Source alone does not provide a legitimate LeeWay Windows software-device or PnP implementation.

The local machine has WDK 10.0.26100 headers, compiler MSVC 19.44, and infverif/signtool tools, but no VS driver project toolset integration and no prepared isolated Windows driver-test VM. It also has a Windows Application Control policy that blocks arbitrary unsigned native executables; that policy is not disabled.

## Acceptance criteria — OS path

Only claim `LEEWAY_GPU_OS_ADAPTER_REGISTERED` after:

1. Review/port the Microsoft KMD and Direct3D 12 UMD with latest supported WDK and **first-party LeeWay service/device identity**, not its sample ACPI ID.
2. Implement real kernel allocation/queue/paging/fence/device lifecycle and secure transfer to LeeWay software operator execution; bind resources under original LDWMD authority, without creating a second authoritative VRAM database.
3. Source-pin and sign the legitimate driver/INF package, verify with WDK/INF tools, and provision an **isolated** Windows driver-test host with rollback/recovery.
4. Install only in the isolated environment, prove PnP → exact DXGI LUID on the *same LeeWay* adapter, real D3D12 compute dispatch and readback, reset/restart and uninstall behavior.
5. Independently qualify the same request with actual Runtime/Formula/Veritas/Continuum/Receipt/Learning admission. A sample driver command or lab test cannot substitute for protected production authority.

**Do not install the upstream `cos.inf` on Agent-Lee. Do not alter security settings, disable Device Guard, force the existing Nvidia/Intel drivers off, or label this source certified.**

## Existing explicit Windows application path

The separate API/SDK lane is already merged in Device Bridge [PR #59](https://github.com/4citeB4U/LEEWAY-DEVICE-BRIDGE/pull/59), with independent Windows CI proving a WinHTTP native app calls the LeeWay software service. The hardware-independent software diagnostic remains a fixed small test, not general shader/game/model compatibility.
