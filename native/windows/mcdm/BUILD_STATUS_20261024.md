# LeeWay Windows native compute-driver build checkpoint

LEEWAY HEADER — DO NOT REMOVE

**Compiler qualification:** Real Microsoft Compute Only Sample Driver (MIT), unchanged original source pinned under `third_party/`, compiled on Agent-Lee (MSVC 19.44, Windows SDK/WDK 10.0.26100) with test-only artifacts under TEMP.

| Layer | Compiled | Remaining |
| --- | ---: | --- |
| KMD source modules | 5 of 11 | Six modules require correct WPP tracing setup and remaining kernel interfaces |
| D3D12 UMD source modules | 26 of 26 | Linking and runtime integration |
| Original LeeWay software graphics engine | Independently tested | Must be wired to protected driver dispatch, not replaced |
| Windows OS adapter | None | Legitimate signed PnP device and functional WDDM KMD/UMD |

**KMD objects actually compiled:** `CosKmdMetaCommand.cpp`, `CosKmdLogging.cpp`, `CosKmdAcpi.cpp`, `CosKmdDdi.cpp`, `CosKmdSoftAdapter.cpp`. WPP headers for three modules were generated with the real WDK `TraceWPP`. Compilation warns that upstream `ExAllocatePoolWithTag` is deprecated; this will require a reviewed driver modernization before release.

**UMD objects actually compiled:** all 26 `cosumd12/*.cpp` translation units. The first DLL link exposed unresolved `D3DCreateBlob` and sample-specific `vpu_compiler`. Linking the installed Windows SDK's `d3dcompiler.lib` resolves `D3DCreateBlob` correctly. A second actual link probe now reports **only one unresolved symbol: `__imp_vpu_compiler`**. The latter comes from a separate old LLVM/DXC-based VPU compiler. This is **not** equivalent to the LeeWay original software compute operator or a working generic D3D12 shader compiler. The SDK blob dependency is resolved. The remaining shader-compiler ABI must be bound to a **qualified LeeWay compiler/dispatch implementation**, not a dummy symbol or borrowed GPU engine.

The original sample's INF points to `ACPI\\COMPUTEONLYSAMPLE` and is not a LeeWay device. **Do not install it.** A separate first-party signed PnP device and full native D3D12/WDDM interface are still necessary. Windows compute-only MCDM enumeration is not the same as a general-purpose display-capable GPU. For a general-purpose graphics adapter, applicable WDDM user-mode graphics functionality and rendering support are additional requirements.

The actual LDWMD, Runtime Fabric grant, Formula decision, Veritas PRE/POST, Continuum and Receipt/Learning Ledgers remain the only permitted production authorization path. The Microsoft sample's internal memory implementation is not a substitute for LDWMD.

**Isolation:** Agent-Lee has no previously qualified disposable Windows driver-test VM. Checking Windows hypervisor/sandbox feature enablement requires elevation; no signed driver package is available for installation. No host display, boot, signing or policy state was altered.

To reproduce **object compilation only** in a Windows development environment:

```powershell
./native/windows/mcdm/compile-kernel-five-objects.ps1
./native/windows/mcdm/compile-umd26-objects.ps1
```

Do not label the product Windows native-GPU certified until the whole driver links and signs, isolated install/uninstall/recovery passes, real LeeWay PnP/DXGI enumeration is independently observed, and a same-device executed command is verified with the canonical protected ledger sequence.
