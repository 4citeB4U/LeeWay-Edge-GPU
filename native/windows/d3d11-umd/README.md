# LeeWay Windows Direct3D user-mode driver ABI

LEEWAY HEADER — DO NOT REMOVE

The real Microsoft Direct3D 11 runtime loads a graphics vendor's user-mode driver DLL and calls its `OpenAdapter10_2` export. This module uses the installed Windows SDK's `D3D10DDIARG_OPENADAPTER` and `PFND3D10DDI_OPENADAPTER` types; the compiler checks the signature exactly.

**Verified now:** Native Windows x64 DLL with the real exported symbol, independently loaded through Win32 `LoadLibraryW` / `GetProcAddress`; direct ABI test passes. A null call returns `E_INVALIDARG`, and a non-null adapter-open request returns `DXGI_ERROR_UNSUPPORTED`. It does not populate adapter callback tables, versions, or a device context. No graphics device becomes available, and the OS is not instructed to install it.

**Not yet implemented:** genuine WDDM kernel miniport and software PnP instance; capability-query callbacks; D3D11 `GetSupportedVersions` and `CreateDevice` handling; full D3D11 rendering function table; resource allocations/residency; memory paging; OS scheduling/fences/reset; binding LeeWay's existing first-party software renderer to the admitted D3D device; independent same-adapter execution and Veritas / Continuum / Receipt and Learning Ledger governance.

The existing first-party software raster and pointer-free user-mode command backend remain in `../software-gpu`. Those components must be reused for future D3D operations under the original LDWMD leases; this UMD must never create another authoritative memory store or Formula engine.

Build on Windows:

```powershell
cmake -S native/windows/d3d11-umd -B build/d3d11-umd -G "Visual Studio 17 2022" -A x64
cmake --build build/d3d11-umd --config Release
ctest --test-dir build/d3d11-umd -C Release --output-on-failure
```

## First-party software execution through a lab-only UMD build

An explicit `LEEWAY_ENABLE_UMD_LAB_BRIDGE` CMake option (default **OFF**) links the **original** LeeWay software graphics renderer and command queue into a diagnostic-only UMD DLL. The lab DLL exports `LeeWayUmdLabSubmit` and `LeeWayUmdLabReadback`, accepts numeric resource IDs and borrowed pixel buffers, and delegates to the existing request-correlated/fence-protected software command functions. A caller-provided request digest and `diagnosticOnly=1` must match; neither constitutes a Veritas signature, owner grant, or production authority.

Verified on Agent-Lee with the actual MSVC Windows DLL and native `LoadLibraryW`/`GetProcAddress` test: a 2-command clear/fill renders a 4×4 BGRA surface, returns one completed fence, and readback matches all 16 independently expected pixels. A foreign resource, wrong envelope digest, missing diagnostic flag, or uncompleted fence is rejected without updating the protected queue. All four reused/UMD native tests pass.

**The default build has no diagnostic export and does not link to the software backend.** A separate test asserts those symbols are absent. The test-only DLL is not a release package or a Windows Direct3D execution route. The standard `OpenAdapter10_2` continues returning `DXGI_ERROR_UNSUPPORTED` in both configurations; no app obtains a D3D device from LeeWay.

Run the two isolated build configurations:

```powershell
cmake -S native/windows/d3d11-umd -B build/umd-default -G 'Visual Studio 17 2022' -A x64 -DLEEWAY_ENABLE_UMD_LAB_BRIDGE=OFF
cmake --build build/umd-default --config Release
ctest --test-dir build/umd-default -C Release --output-on-failure
cmake -S native/windows/d3d11-umd -B build/umd-lab -G 'Visual Studio 17 2022' -A x64 -DLEEWAY_ENABLE_UMD_LAB_BRIDGE=ON
cmake --build build/umd-lab --config Release
ctest --test-dir build/umd-lab -C Release --output-on-failure
```

The DLL is deliberately non-installable as a functional driver. There is no signed INF, PnP registration, KMD, supported D3D device, game or video driver acceptance, or production-scope Veritas enrollment. Do not substitute a test-only OpenAdapter export for an OS-recognized LeeWay GPU.
