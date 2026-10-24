/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.D3D11_UMD
TAG: LEEWAY_DIRECT3D11_OPENADAPTER10_2_REAL_ABI_FAIL_CLOSED_V1
WHO: Creator-authorized LeeWay engineering.
WHAT: Windows SDK-typed D3D11 user-mode display-driver entry point.
WHY: The Windows graphics runtime loads the real UMD and invokes this
     exported function; a LeeWay DLL name alone is not Direct3D integration.
WHERE: native/windows/d3d11-umd. WHEN: 2026-10-24.
HOW: Exact d3d10umddi.h ABI; withhold adapter function table until
     matching software KMD, owner-approved resource and device callbacks exist.
AUTHORITY: COMPILE/DIAGNOSTIC ONLY; never advertise an operational GPU.
LICENSE: Existing LeeWay repository terms.
*/
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winternl.h>
#include <d3d10umddi.h>
#include <type_traits>

// The WDDM runtime requests adapter and device callbacks via OpenAdapter10_2.
// No supported D3D11 versions are advertised: LeeWay still lacks its real
// KMD, CreateDevice, allocation/paging, video scheduler, reset and DDI tables.
//
// Opening must never succeed without them. This DLL is a real ABI boundary,
// but NOT a functional Windows D3D UMD and MUST NOT be installed as one.
extern "C" __declspec(dllexport)
HRESULT APIENTRY OpenAdapter10_2(D3D10DDIARG_OPENADAPTER* adapter) {
  if (!adapter) return E_INVALIDARG;
  // Do not assign pAdapterFuncs_2, a device handle or versions.
  // This prevents Direct3D from operating on a fabricated device.
  return DXGI_ERROR_UNSUPPORTED;
}
static_assert(std::is_same_v<decltype(&OpenAdapter10_2), PFND3D10DDI_OPENADAPTER>,
              "LEEWAY_D3D11_OPENADAPTER_ABI_NOT_MATCHED");
