/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.SOFTWARE_GRAPHICS
TAG: LEEWAY_SWGPU_DRIVER_FACING_COMMAND_EXECUTION_V1
WHO: Owner-authorized LeeWay GPU engineering.
WHAT: Validate and execute pointer-free software graphics packets.
WHY: A real software adapter needs strict resource and fence correlation,
     not a friendly device name or an unguarded graphics operation.
WHERE: native/windows/software-gpu. WHEN: 2026-10-24.
HOW: Prevalidate entire packet, then invoke existing LeeWay raster library.
AUTHORITY: Not Veritas, not OS GPU registration, not LDWMD memory allocation.
LICENSE: Existing LeeWay repository terms.
*/
#include "leeway-swgraphics-command.h"
#include <cstdint>
#include <cstring>
#include <limits>

static_assert(sizeof(LeeWaySwCommand)==56, "LEEWAY_SWGPU_PACKET_ABI_SIZE_CHANGED");
static_assert(alignof(LeeWaySwCommand)==8, "LEEWAY_SWGPU_PACKET_ABI_ALIGN_CHANGED");

namespace {
bool allZero(const uint8_t* p) {
  uint8_t result = 0;
  for (unsigned i = 0; i != 32; ++i) result |= p[i];
  return result == 0;
}
bool inScope(const LeeWaySwQueue* q, const LeeWaySwResourceView& view) {
  return std::memcmp(q->requestSha256, view.requestSha256, 32) == 0;
}
bool validQueue(const LeeWaySwQueue* q) {
  return q && q->abiVersion == LEEWAY_SWGPU_COMMAND_ABI_V1 &&
         q->reserved == 0 && !allZero(q->requestSha256);
}
const LeeWaySwResourceView* lookup(
  const LeeWaySwResourceView* views, size_t count, uint64_t id) {
  if (!id) return nullptr;
  for (size_t i = 0; i < count; ++i)
    if (views[i].resourceId == id) return &views[i];
  return nullptr;
}
LeeWaySwStatus validateViews(
  const LeeWaySwQueue* q,
  const LeeWaySwResourceView* views, size_t count) {
  if (!views || count == 0 || count > LEEWAY_SWGPU_MAX_PACKET_RESOURCES)
    return LW_SW_INVALID_COMMAND;
  for (size_t i = 0; i < count; ++i) {
    if (!views[i].resourceId || !inScope(q, views[i]))
      return LW_SW_REQUEST_IDENTITY_MISMATCH;
    const auto valid = leeway_sw_validate(&views[i].surface);
    if (valid != LW_SW_OK) return valid;
    const auto a = reinterpret_cast<uintptr_t>(views[i].surface.pixels);
    const auto an = views[i].surface.bufferBytes;
    if (an > UINTPTR_MAX - a) return LW_SW_INVALID_SURFACE;
    for (size_t j = 0; j < i; ++j) {
      if (views[j].resourceId == views[i].resourceId)
        return LW_SW_DUPLICATE_RESOURCE;
      const auto b = reinterpret_cast<uintptr_t>(views[j].surface.pixels);
      const auto bn = views[j].surface.bufferBytes;
      if (bn > UINTPTR_MAX - b) return LW_SW_INVALID_SURFACE;
      if (a < b + bn && b < a + an)
        return LW_SW_OVERLAPPING_BUFFERS;
    }
  }
  return LW_SW_OK;
}
LeeWaySwStatus validateCommand(
  const LeeWaySwResourceView* views, size_t count,
  const LeeWaySwCommand& c) {
  if (c.reserved) return LW_SW_INVALID_COMMAND;
  const auto* dst = lookup(views, count, c.destinationResourceId);
  if (!dst) return LW_SW_RESOURCE_NOT_FOUND;
  if (c.opcode == LW_SW_OP_CLEAR) {
    if (c.sourceResourceId || c.width || c.height || c.sourceX ||
        c.sourceY || c.destinationX || c.destinationY)
      return LW_SW_INVALID_COMMAND;
    return LW_SW_OK;
  }
  if (!c.width || !c.height) return LW_SW_INVALID_REGION;
  if (c.opcode == LW_SW_OP_FILL_RECT) {
    if (c.sourceResourceId || c.sourceX || c.sourceY)
      return LW_SW_INVALID_COMMAND;
    return LW_SW_OK;
  }
  if (c.opcode != LW_SW_OP_BLIT_OPAQUE) return LW_SW_INVALID_COMMAND;
  if (c.bgra) return LW_SW_INVALID_COMMAND;
  const auto* src = lookup(views, count, c.sourceResourceId);
  if (!src) return LW_SW_RESOURCE_NOT_FOUND;
  if (c.sourceX >= src->surface.width || c.sourceY >= src->surface.height)
    return LW_SW_INVALID_REGION;
  // All views are caller-owned, and aliasing must be refused before
  // any command mutates any destination in the packet.
  const auto srcBegin = reinterpret_cast<uintptr_t>(src->surface.pixels);
  const auto dstBegin = reinterpret_cast<uintptr_t>(dst->surface.pixels);
  const auto srcLen = src->surface.bufferBytes;
  const auto dstLen = dst->surface.bufferBytes;
  if (srcLen > UINTPTR_MAX - srcBegin || dstLen > UINTPTR_MAX - dstBegin)
    return LW_SW_OVERLAPPING_BUFFERS;
  if (srcBegin < dstBegin + dstLen && dstBegin < srcBegin + srcLen)
    return LW_SW_OVERLAPPING_BUFFERS;
  return LW_SW_OK;
}
}
extern "C" LeeWaySwStatus leeway_sw_submit_commands(
  LeeWaySwQueue* queue,
  const LeeWaySwResourceView* views, size_t resourceCount,
  const LeeWaySwCommand* commands, size_t commandCount,
  uint64_t* fenceOut) {
  if (fenceOut) *fenceOut = 0;
  if (!fenceOut || !validQueue(queue) || !commands ||
      commandCount == 0 || commandCount > LEEWAY_SWGPU_MAX_PACKET_COMMANDS)
    return LW_SW_INVALID_COMMAND;
  if (queue->completedFence == UINT64_MAX) return LW_SW_FENCE_EXHAUSTED;
  auto result = validateViews(queue, views, resourceCount);
  if (result != LW_SW_OK) return result;
  for (size_t i = 0; i < commandCount; ++i) {
    result = validateCommand(views, resourceCount, commands[i]);
    if (result != LW_SW_OK) return result;
  }
  // Entire packet is validated before the first side effect.
  for (size_t i = 0; i < commandCount; ++i) {
    const auto& c = commands[i];
    auto dst = lookup(views, resourceCount, c.destinationResourceId)->surface;
    if (c.opcode == LW_SW_OP_CLEAR)
      result = leeway_sw_clear(&dst, c.bgra);
    else if (c.opcode == LW_SW_OP_FILL_RECT)
      result = leeway_sw_fill_rect(
        &dst, c.destinationX, c.destinationY, c.width, c.height, c.bgra);
    else
      result = leeway_sw_blit_opaque(
        &lookup(views, resourceCount, c.sourceResourceId)->surface,
        &dst, c.sourceX, c.sourceY, c.destinationX, c.destinationY,
        c.width, c.height);
    if (result != LW_SW_OK) return result;
  }
  ++queue->completedFence;
  *fenceOut = queue->completedFence;
  return LW_SW_OK;
}
extern "C" LeeWaySwStatus leeway_sw_readback_resource(
  const LeeWaySwQueue* queue,
  const LeeWaySwResourceView* views, size_t resourceCount,
  uint64_t resourceId, uint64_t requiredFence,
  void* output, size_t capacity, size_t* written) {
  if (written) *written = 0;
  if (!validQueue(queue) || requiredFence == 0 ||
      requiredFence > queue->completedFence || !written)
    return LW_SW_FENCE_UNAVAILABLE;
  const auto checked = validateViews(queue, views, resourceCount);
  if (checked != LW_SW_OK) return checked;
  const auto* resource = lookup(views, resourceCount, resourceId);
  if (!resource) return LW_SW_RESOURCE_NOT_FOUND;
  return leeway_sw_readback(
    &resource->surface, output, capacity, written);
}
