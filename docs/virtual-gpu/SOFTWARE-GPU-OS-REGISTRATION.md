# LeeWay Edge GPU — software-only Windows OS registration

LEEWAY HEADER — DO NOT REMOVE

**Release stage: NATIVE SOFTWARE GRAPHICS BACKEND BUILT; WINDOWS WDDM ADAPTER NOT REGISTERED.**

## Product boundary

LeeWay Edge GPU is software only: a hardware board, vendor accelerator, NVIDIA device, CUDA runtime, and external model server are **not required** for a first-party compute product. LeeWay math executes on the host's physical CPU when the admitted LeeWay software route is selected; software does not remove the need for a physical processor and memory.

Model identity and Agent Lee identity are separate. The product is model-, OS-, device-, and drive-agnostic at the API level. LeeWay Runtime Fabric governs admission; Formula makes the qualified mathematical decision; original LDWMD owns memory; LeeWay executes; Continuum preserves state; independent Veritas and Receipt/Learning Ledgers verify and admit outcomes. None of those roles should be recreated by a display/graphics backend.

## Implementation completed 2026-10-24

- Native source: `native/windows/software-gpu/leeway-swgraphics.h`, `leeway-swgraphics.cpp`.
- Built with MSVC 19.44 / Windows SDK 10.0.26100 from installed Visual Studio 2022 Build Tools on Agent-Lee.
- Real compiled software renderer: opaque BGRA8 clear, clipped rectangle fill, copy between independently owned buffers, and packed image readback.
- The engine **borrows caller-owned memory spans**, so LDWMD can remain the memory owner in a future qualified binding. It never allocates VRAM, signs a grant, appends a ledger, or registers an OS device.
- Checked allocation sizes, row stride, buffer overflow, overlapping source/destination, output capacity, and out-of-surface clipping. Each operation returns an explicit status.
- Native test executable: independently checked pixel values, padding preservation, 36-byte readback, copy behavior, failure cases, and no hardware GPU path. `ctest` PASS.
- Driver-facing command ABI v1 compiled in native code: 56-byte pointer-free command packets use numeric resource IDs, caller-provided SHA-256 request correlation, borrowed surfaces, complete preflight before mutation, a synchronous completion fence, and fence-checked readback. The request SHA field is **not an authorization signature**. Original LDWMD and qualified Runtime/Formula/Veritas still must admit and pin the actual allocations and execution. A future WDDM user-mode component must resolve these resource handles from approved leases; kernel-mode pointer passing is explicitly forbidden.
- The Windows read-only PnP diagnostic was tightened so a friendly device name and VideoController alone do not count as WDDM recognition. Real LeeWay driver service and DXGI-PnP/LUID correlation are required before any native discovery claim; independent submission/readback and Veritas evidence remain separate gates.
- GitHub Actions workflow compiles this native code on Windows and Linux and retains the Windows test-only DLL. It does not sign or install a driver.

## WDK kernel-source integration checkpoint

The native Windows driver directory now includes `native/windows/wddm/leeway-wddm-bootstrap.c`, compiled against **the actual installed WDK `dispmprt.h` DXGKDDI function signatures** with MSVC `/kernel /W4 /WX`. The build produced a checked x64 `.obj`, not a driver. The existing operating-system graphics subsystem was not touched.

The fail-closed kernel entry point intentionally returns `STATUS_NOT_SUPPORTED` before `DxgkInitialize`, and refuses every `DxgkDdiAddDevice` request. This is not a working driver, does not have mandatory WDDM DDIs, has no UMD, `.sys`, `.inf`, enrolled PnP software device, certificate or OS registration. It must remain non-installable until those capabilities are complete and verified on an isolated test host.

The WDK document `native/windows/wddm/README.md` maintains the follow-on kernel/user driver requirements and compile command. Its static tests enforce that missing driver interfaces cannot be misrepresented as a functioning GPU. Windows 11 Home on the main Agent-Lee host exposes neither the Hyper-V Manager command set nor a ready independent driver-test VM, so no risky live display-stack installation is attempted.

**Driver model selection:** For Windows apps requiring a native display/graphics adapter, full WDDM KMD+UMD is the admission target. Microsoft's MCDM `ComputeAccelerator` class can be researched for a separate compute-only device, but its enumeration is not proof of a general-purpose Direct3D display GPU. Neither route may replace LeeWay Runtime Fabric, Formula, original LDWMD, Veritas or the ledger chain.

## Actual Windows PnP/DXGI native correlation — October 24, 2026

A first-party native x64 diagnostic now compiles and runs using Windows SetupAPI, D3DKMT adapter-name mapping and DXGI enumeration. It resolves each present display device's real PnP instance ID, obtains the associated graphics-kernel adapter LUID and compares it to the DXGI LUID. The existing LeeWay classification then requires the same instance in VideoController and a running LeeWay .sys driver before even reporting Windows adapter enumeration.

Live Agent-Lee result: three genuine OS adapters correlated, all NOT LeeWay: NVIDIA 0-153A3, Intel 0-14EA3, Microsoft Basic Render 0-15314. These identities are diagnostics, not LeeWay execution providers. LeeWay registered adapter count remains zero; its classification stays NATIVE_ADAPTER_NOT_VERIFIED.

The previously missing native DXGI-PnP probe is now implemented in native/windows/dxgi-probe, with a Windows CMake build, test and GitHub workflow. The existing tests/virtual-gpu/windows-adapter-qualification.mjs consumes its output through LEEWAY_DXGI_PNP_PROBE and fails closed if no native executable is supplied. It does not register, simulate, spoof, or install a GPU device. It cannot authorize production work.

Still unfinished: actual software-only WDDM KMD with mandatory callbacks; functional D3D UMD; host-memory lease/submit/fence semantics under LDWMD and Veritas; legitimate Windows software-device instance and signed installation package; isolated driver-test deployment; actual LeeWay DXGI enumeration and same-adapter execution/readback.

## Windows registration requirements (not yet achieved)

Windows recognizing a **general-purpose GPU adapter** is *not* the same as recognizing a service, custom PnP software device, Direct3D WARP, an indirect display/monitor, or a signed INF with no functional driver.

Still required in the Windows driver lane:

1. Select and implement an authentic Windows Display Driver Model (WDDM) virtual/software graphics **kernel-mode miniport** plus applicable Direct3D **user-mode graphics driver** interface, not only a display-only/indirect monitor device. The software command processor must map submitted resources and commands to LeeWay's approved software renderer and tensor runtime.
2. Bind actual admitted buffers and fences to the original LDWMD/Runtime Fabric execution and Veritas request identity. A model route is separately qualified; this raster library does not implement transformer inference.
3. Compile the full Windows driver using the WDK and MSVC; run static analysis, INF verification, signed package checks and driver conformance. No dummy driver binaries or spoofed PCI IDs.
4. Deploy solely in an isolated Windows test environment with removal/rollback and explicit owner approval before changing the principal laptop's system graphics drivers, signing state, or boot configuration.
5. Independently verify real LeeWay adapter visibility through PnP, DXGI enumeration, D3D command submission, resource/fence handling, readback, unload/restart and failure recovery, then bind the checked evidence to canonical Veritas/Continuum and both ledgers.

## Reproducible build

```powershell
cmake -S native/windows/software-gpu -B build/leeway-swgraphics -G "Visual Studio 17 2022" -A x64
cmake --build build/leeway-swgraphics --config Release
ctest --test-dir build/leeway-swgraphics -C Release --output-on-failure
```

The previous source referenced `/workspace/LeeWay-Edge-GPU/docs/virtual-gpu/SOFTWARE-GPU-OS-REGISTRATION.md`, but that file was absent from the GitHub main branch at this checkpoint. This version records the reproducibly built backend and current gap. It **does not claim to reproduce or incorporate the unpublished three earlier defect fixes** described in that checkpoint; those original changes must be reconciled by source identity rather than recreated blindly.

**Never report OS-GPU registration, 3D/game compatibility, full software LLM inference or protected live production inference as passed on the basis of this native renderer alone.**
