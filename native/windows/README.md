# LeeWay Edge GPU — Windows native development (G16)

**Owner-approved target:** a genuine virtual graphics and compute adapter named **LeeWay Edge GPU**. This repository currently has no working WDDM driver. `d3d12-compute/` contains a bounded user-mode D3D12 dispatch prototype that runs on existing OS-enumerated hardware; it does not register a new Windows adapter or yet participate in Runtime Fabric.

## Authority and safety

- Keep Intel and NVIDIA graphics drivers enabled, installed and unchanged. Do not spoof PCI vendor/device IDs or misidentify the underlying physical GPU.
- Runtime Fabric authorizes execution; Formula governs; LDWMD owns memory residency; Continuum retains state; Veritas qualifies evidence. This backend creates no replacement authority.
- Owner approved installing official Microsoft C++ Build Tools, Windows SDK and WDK, local source/test/build operations, and isolated VM testing.
- Owner **did not** authorize host driver installation, activation, reboot, security/test-signing changes, or GitHub commit/push. Ask before those operations. Preserve dirty trees.
- Apple integration must use supported APIs and report honestly when a new OS GPU cannot be registered. Cross-platform contracts can be developed in parallel, Windows implementation first.

## Required gates

1. Verify official toolchain install and signatures. Distinguish missing PATH entries from genuinely missing tools.
2. Select and document a supported Windows graphics driver model. An indirect display driver alone is not a general-purpose GPU. A PnP name or INF alone is not a functioning GPU.
3. Implement an isolated driver prototype with real resource, command submission, readback and error handling; compile and validate.
4. Test only in an isolated VM first. Validate supported VM graphics interfaces before promising WDDM capability. Preserve rollback and evidence.
5. Require real OS enumeration, graphics API adapter discovery, and compute correctness before reporting native recognition in LeeWay Diagnostics Matrix. Keep physical GPU and LeeWay compute engine separate, with measured telemetry only.
6. Obtain separate owner approval before any host driver installation. No unapproved GitHub publication.

## Direct3D 11 UMD runtime ABI (compile-only)

`d3d11-umd/` provides the real Windows SDK typed `OpenAdapter10_2` export, compiled as a DLL and verified through direct OS loading. It returns `DXGI_ERROR_UNSUPPORTED` because there is no corresponding working KMD/device or full Direct3D device table. This is ABI integration, **not** an operational Direct3D driver; see its README and the OS registration checkpoint.

## WDDM typed kernel source (compile-only)

`wddm/` now contains the source of a Windows graphics-kernel `DriverEntry` and WDK-typed DDIs, compiled with MSVC `/kernel /W4 /WX`. It intentionally refuses `DxgkDdiAddDevice` and returns `STATUS_NOT_SUPPORTED`, with no `.sys`, INF or install action. **This is not a working WDDM driver or Windows-recognized GPU**. The real KMD/UMD and isolated installation path remain open. See `wddm/README.md` and `docs/virtual-gpu/SOFTWARE-GPU-OS-REGISTRATION.md`.

## First-party CPU software graphics core (2026-10-24)

`software-gpu/` now contains a compiled native BGRA8 renderer with caller-owned buffers, clipped rectangles, opaque blit and readback, plus Windows/Linux CMake tests. It is a practical graphics backend dependency for a future LeeWay WDDM software GPU driver, **not** an OS-registered adapter and **not** an alternate LDWMD, Formula, Runtime or Veritas authority. See `docs/virtual-gpu/SOFTWARE-GPU-OS-REGISTRATION.md`.

## Current code

`adapter-contract.mjs` and its tests are read-only admission logic, **not a graphics driver**. Synthetic passing tests are not evidence of native adapter recognition. `d3d12-compute/prototype.cpp` and `build-run.ps1` prove only their measured D3D12 command submission/readback on the individually identified physical adapters recorded in the generated evidence. They are not WDDM driver source, a distinct LeeWay OS GPU, or Runtime Fabric-authorized provider integration.
