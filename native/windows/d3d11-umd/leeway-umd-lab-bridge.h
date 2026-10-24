/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.D3D11_UMD
TAG: LEEWAY_UMD_LAB_ONLY_EXISTING_RENDERER_BRIDGE_V1
WHO: Owner-authorized LeeWay Engineering.
WHAT: Test-only user-mode bridge to the original LeeWay software graphics engine.
WHY: Qualify exact request/resource/fence handoff before implementing real D3D11 DDIs.
WHERE: native/windows/d3d11-umd. WHEN: 2026-10-24.
HOW: Strict diagnostic-only request envelope and borrowed original LDWMD-style views.
AUTHORITY: LAB_ONLY. No Veritas credential, protected grant, WDDM device, or PnP registration.
LICENSE: Existing LeeWay repository terms.
*/
#pragma once
#include "../software-gpu/leeway-swgraphics-command.h"
#ifdef __cplusplus
extern "C" {
#endif
#define LEEWAY_UMD_LAB_ABI_V1 1u
#define LEEWAY_UMD_LAB_DIAGNOSTIC_ONLY 1u
typedef struct LeeWayUmdLabEnvelope {
  uint32_t abiVersion;
  uint32_t diagnosticOnly;
  uint8_t requestSha256[32];
} LeeWayUmdLabEnvelope;
// The functions below are compiled/exported ONLY when LEEWAY_UMD_LAB_BRIDGE
// is set. No release/production WDDM DLL includes them by default.
#if defined(LEEWAY_UMD_LAB_BRIDGE)
__declspec(dllexport) LeeWaySwStatus __cdecl LeeWayUmdLabSubmit(
  const LeeWayUmdLabEnvelope* envelope, LeeWaySwQueue* queue,
  const LeeWaySwResourceView* resources, size_t resourceCount,
  const LeeWaySwCommand* commands, size_t commandCount,
  uint64_t* completedFenceOut);
__declspec(dllexport) LeeWaySwStatus __cdecl LeeWayUmdLabReadback(
  const LeeWayUmdLabEnvelope* envelope, const LeeWaySwQueue* queue,
  const LeeWaySwResourceView* resources, size_t resourceCount,
  uint64_t resourceId, uint64_t completedFence,
  void* output, size_t outputCapacity, size_t* bytesWritten);
#endif
#ifdef __cplusplus
}
#endif
