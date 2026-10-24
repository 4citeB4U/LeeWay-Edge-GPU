/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.D3D11_UMD
TAG: LEEWAY_UMD_LAB_ONLY_RENDERER_EXECUTION_BINDING_V1
WHO: Owner-authorized LeeWay engineering.
WHAT: Connect existing first-party software command core to the D3D11 UMD lab DLL.
WHY: Verify real borrowed-buffer execution without claiming a Windows graphics adapter.
WHERE: native/windows/d3d11-umd. WHEN: 2026-10-24.
HOW: Explicit diagnostics-only envelope, request digest, original native queue and fences.
AUTHORITY: TEST_ONLY; NEVER used to authorize Runtime, Veritas, or WDDM driver admission.
LICENSE: Existing LeeWay repository terms.
*/
#include "leeway-umd-lab-bridge.h"
#include <cstring>
#if !defined(LEEWAY_UMD_LAB_BRIDGE)
#error LEEWAY_DIAGNOSTIC_BRIDGE_MUST_NOT_BUILD_OUTSIDE_TEST_CONFIGURATION
#endif
namespace {
bool validEnvelope(const LeeWayUmdLabEnvelope* envelope, const LeeWaySwQueue* queue) {
  return envelope && queue &&
      envelope->abiVersion == LEEWAY_UMD_LAB_ABI_V1 &&
      envelope->diagnosticOnly == LEEWAY_UMD_LAB_DIAGNOSTIC_ONLY &&
      std::memcmp(envelope->requestSha256, queue->requestSha256, 32) == 0;
}
}
extern "C" LeeWaySwStatus __cdecl LeeWayUmdLabSubmit(
  const LeeWayUmdLabEnvelope* envelope, LeeWaySwQueue* queue,
  const LeeWaySwResourceView* resources, size_t resourceCount,
  const LeeWaySwCommand* commands, size_t commandCount, uint64_t* fenceOut) {
  if (fenceOut) *fenceOut = 0;
  if (!validEnvelope(envelope, queue)) return LW_SW_REQUEST_IDENTITY_MISMATCH;
  // Never replace the original LeeWay software engine or memory owner.
  return leeway_sw_submit_commands(queue, resources, resourceCount,
                                   commands, commandCount, fenceOut);
}
extern "C" LeeWaySwStatus __cdecl LeeWayUmdLabReadback(
  const LeeWayUmdLabEnvelope* envelope, const LeeWaySwQueue* queue,
  const LeeWaySwResourceView* resources, size_t resourceCount,
  uint64_t resourceId, uint64_t fence,
  void* output, size_t capacity, size_t* written) {
  if (written) *written = 0;
  if (!validEnvelope(envelope, queue)) return LW_SW_REQUEST_IDENTITY_MISMATCH;
  return leeway_sw_readback_resource(queue, resources, resourceCount,
                                     resourceId, fence, output, capacity, written);
}
