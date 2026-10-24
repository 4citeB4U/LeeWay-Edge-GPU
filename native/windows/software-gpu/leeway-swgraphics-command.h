/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.SOFTWARE_GRAPHICS
TAG: LEEWAY_SWGPU_DRIVER_FACING_COMMAND_ABI_V1
WHO: Owner-authorized LeeWay GPU engineering.
WHAT: Pointer-free command packets and request-correlated resource submission.
WHY: Provide a bounded user-mode software command backend for future genuine
     Windows WDDM user-mode and kernel-mode driver integration.
WHERE: native/windows/software-gpu. WHEN: 2026-10-24.
HOW: Versioned packets, stable numeric resource handles, preflight and fences.
AUTHORITY: This module does NOT authenticate a grant or install a driver.
           Runtime Fabric/Formula/Veritas must admit before calling; LDWMD
           must own and lock the resolved surface memory for packet lifetime.
LICENSE: Existing LeeWay repository terms.
*/
#pragma once
#include "leeway-swgraphics.h"

#ifdef __cplusplus
extern "C" {
#endif

#define LEEWAY_SWGPU_COMMAND_ABI_V1 1u
#define LEEWAY_SWGPU_MAX_PACKET_COMMANDS 256u
#define LEEWAY_SWGPU_MAX_PACKET_RESOURCES 64u

typedef enum LeeWaySwOpcode {
  LW_SW_OP_CLEAR = 1,
  LW_SW_OP_FILL_RECT = 2,
  LW_SW_OP_BLIT_OPAQUE = 3
} LeeWaySwOpcode;

// Command packets carry numeric handles, never user/kernel pointers.
typedef struct LeeWaySwCommand {
  uint32_t opcode;
  uint32_t reserved;
  uint64_t destinationResourceId;
  uint64_t sourceResourceId;
  int32_t destinationX;
  int32_t destinationY;
  uint32_t sourceX;
  uint32_t sourceY;
  uint32_t width;
  uint32_t height;
  uint32_t bgra;
} LeeWaySwCommand;

// Resource addresses are resolved on the user-mode host side only.
// The request digest provides correlation, NOT an authorization credential.
typedef struct LeeWaySwResourceView {
  uint64_t resourceId;
  LeeWaySwSurface surface;
  uint8_t requestSha256[32];
} LeeWaySwResourceView;

// Caller-owned queue state, scoped to one independently admitted request.
typedef struct LeeWaySwQueue {
  uint32_t abiVersion;
  uint32_t reserved;
  uint64_t completedFence;
  uint8_t requestSha256[32];
} LeeWaySwQueue;

LW_API LeeWaySwStatus leeway_sw_submit_commands(
  LeeWaySwQueue* queue,
  const LeeWaySwResourceView* views, size_t resourceCount,
  const LeeWaySwCommand* commands, size_t commandCount,
  uint64_t* completedFenceOut);

// No readback unless the requested fence actually completed for this
// request and the resource is still bound to this exact request digest.
LW_API LeeWaySwStatus leeway_sw_readback_resource(
  const LeeWaySwQueue* queue,
  const LeeWaySwResourceView* views, size_t resourceCount,
  uint64_t resourceId, uint64_t requiredFence,
  void* output, size_t outputCapacityBytes, size_t* bytesWritten);

#ifdef __cplusplus
}
#endif
