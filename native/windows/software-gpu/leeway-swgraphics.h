/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.SOFTWARE_GRAPHICS
TAG: LEEWAY_SWGPU_BORROWED_FRAMEBUFFER_ABI_V1
WHO: LeeWay owner-authorized GPU engineering.
WHAT: First-party software graphics operations over caller-owned pixel memory.
WHY: Provide a real portable rendering backend without a hardware GPU or a second memory owner.
WHERE: native/windows/software-gpu.
WHEN: 2026-10-24.
HOW: Strict checked BGRA8 surface views, opaque fills/blits and deterministic readback.
AUTHORITY: Backend ONLY; caller must provide Runtime/Formula/LDWMD/Veritas admission.
LICENSE: Existing LeeWay repository terms.
*/
#pragma once
#include <stddef.h>
#include <stdint.h>
#if defined(_WIN32) && defined(LEEWAY_SWGRAPHICS_SHARED)
 #if defined(LEEWAY_SWGRAPHICS_EXPORTS)
  #define LW_API __declspec(dllexport)
 #else
  #define LW_API __declspec(dllimport)
 #endif
#else
 #define LW_API
#endif
#ifdef __cplusplus
extern "C" {
#endif

typedef enum LeeWaySwStatus {
  LW_SW_OK = 0,
  LW_SW_INVALID_SURFACE = 1,
  LW_SW_INVALID_REGION = 2,
  LW_SW_INSUFFICIENT_BUFFER = 3,
  LW_SW_OVERLAPPING_BUFFERS = 4,
  LW_SW_INVALID_OUTPUT = 5,
  LW_SW_INVALID_COMMAND = 6,
  LW_SW_RESOURCE_NOT_FOUND = 7,
  LW_SW_REQUEST_IDENTITY_MISMATCH = 8,
  LW_SW_FENCE_EXHAUSTED = 9,
  LW_SW_FENCE_UNAVAILABLE = 10,
  LW_SW_DUPLICATE_RESOURCE = 11
} LeeWaySwStatus;

// Buffer and its lifetime are owned by LDWMD or the admitted caller.
// stridePixels includes any row padding. Pixels are 32-bit BGRA8.
typedef struct LeeWaySwSurface {
  uint32_t* pixels;
  uint32_t width;
  uint32_t height;
  uint32_t stridePixels;
  size_t bufferBytes;
} LeeWaySwSurface;

LW_API LeeWaySwStatus leeway_sw_validate(const LeeWaySwSurface* surface);
LW_API LeeWaySwStatus leeway_sw_clear(LeeWaySwSurface* surface, uint32_t bgra);
LW_API LeeWaySwStatus leeway_sw_fill_rect(
    LeeWaySwSurface* surface, int32_t x, int32_t y,
    uint32_t width, uint32_t height, uint32_t bgra);
LW_API LeeWaySwStatus leeway_sw_blit_opaque(
    const LeeWaySwSurface* source, LeeWaySwSurface* destination,
    uint32_t sourceX, uint32_t sourceY, int32_t destinationX,
    int32_t destinationY, uint32_t width, uint32_t height);
LW_API LeeWaySwStatus leeway_sw_readback(
    const LeeWaySwSurface* surface, void* output,
    size_t outputCapacityBytes, size_t* bytesWritten);
#ifdef __cplusplus
}
#endif
