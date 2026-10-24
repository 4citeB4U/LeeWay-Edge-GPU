/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.SOFTWARE_GRAPHICS
TAG: LEEWAY_SWGPU_BORROWED_FRAMEBUFFER_CORE_V1
WHO: Creator-authorized LeeWay engineering.
WHAT: Deterministic software framebuffer operations.
WHY: A software renderer must not silently use a GPU, allocate unadmitted memory,
     or claim to be an OS graphics driver.
WHERE: native/windows/software-gpu.
WHEN: 2026-10-24.
HOW: Checked arithmetic, clipped integer regions, borrowed buffers.
AUTHORITY: Render backend only; no WDDM registration or execution grants.
LICENSE: Existing LeeWay repository terms.
*/
#include "leeway-swgraphics.h"
#include <algorithm>
#include <cstdint>
#include <cstring>
#include <limits>

namespace {
bool addOverflows(size_t a, size_t b) {
  return b > std::numeric_limits<size_t>::max() - a;
}
bool mulOverflows(size_t a, size_t b) {
  return a && b > std::numeric_limits<size_t>::max() / a;
}
bool overlaps(const void* a, size_t an, const void* b, size_t bn) {
  const auto x = reinterpret_cast<uintptr_t>(a);
  const auto y = reinterpret_cast<uintptr_t>(b);
  if (an > std::numeric_limits<uintptr_t>::max() - x ||
      bn > std::numeric_limits<uintptr_t>::max() - y) return true;
  return x < y + bn && y < x + an;
}
}
extern "C" LeeWaySwStatus leeway_sw_validate(const LeeWaySwSurface* s) {
  if (!s || !s->pixels || !s->width || !s->height || s->stridePixels < s->width ||
      reinterpret_cast<uintptr_t>(s->pixels) % alignof(uint32_t))
    return LW_SW_INVALID_SURFACE;
  const size_t rows = static_cast<size_t>(s->height - 1);
  const size_t stride = static_cast<size_t>(s->stridePixels);
  if (mulOverflows(rows, stride) || addOverflows(rows * stride, s->width))
    return LW_SW_INVALID_SURFACE;
  const size_t requiredPixels = rows * stride + s->width;
  if (mulOverflows(requiredPixels, sizeof(uint32_t)) ||
      requiredPixels * sizeof(uint32_t) > s->bufferBytes)
    return LW_SW_INSUFFICIENT_BUFFER;
  return LW_SW_OK;
}
extern "C" LeeWaySwStatus leeway_sw_clear(LeeWaySwSurface* s, uint32_t bgra) {
  const auto status = leeway_sw_validate(s);
  if (status != LW_SW_OK) return status;
  for (uint32_t y = 0; y < s->height; ++y) {
    auto* row = s->pixels + static_cast<size_t>(y) * s->stridePixels;
    std::fill_n(row, s->width, bgra);
  }
  return LW_SW_OK;
}
extern "C" LeeWaySwStatus leeway_sw_fill_rect(
    LeeWaySwSurface* s, int32_t x, int32_t y,
    uint32_t width, uint32_t height, uint32_t bgra) {
  const auto status = leeway_sw_validate(s);
  if (status != LW_SW_OK) return status;
  if (!width || !height) return LW_SW_INVALID_REGION;
  const int64_t left = std::max<int64_t>(0, x);
  const int64_t top = std::max<int64_t>(0, y);
  const int64_t right = std::min<int64_t>(s->width, static_cast<int64_t>(x) + width);
  const int64_t bottom = std::min<int64_t>(s->height, static_cast<int64_t>(y) + height);
  if (left >= right || top >= bottom) return LW_SW_OK;
  for (int64_t j = top; j < bottom; ++j) {
    auto* row = s->pixels + static_cast<size_t>(j) * s->stridePixels;
    std::fill(row + left, row + right, bgra);
  }
  return LW_SW_OK;
}
extern "C" LeeWaySwStatus leeway_sw_blit_opaque(
    const LeeWaySwSurface* source, LeeWaySwSurface* dest, uint32_t sx, uint32_t sy,
    int32_t dx, int32_t dy, uint32_t width, uint32_t height) {
  auto st = leeway_sw_validate(source);
  if (st != LW_SW_OK) return st;
  st = leeway_sw_validate(dest);
  if (st != LW_SW_OK) return st;
  if (!width || !height || sx >= source->width || sy >= source->height)
    return LW_SW_INVALID_REGION;
  if (overlaps(source->pixels, source->bufferBytes, dest->pixels, dest->bufferBytes))
    return LW_SW_OVERLAPPING_BUFFERS;
  const int64_t left = std::max<int64_t>(0, dx);
  const int64_t top = std::max<int64_t>(0, dy);
  const int64_t right = std::min<int64_t>({
    dest->width, static_cast<int64_t>(dx) + width,
    static_cast<int64_t>(dx) + (source->width - sx)
  });
  const int64_t bottom = std::min<int64_t>({
    dest->height, static_cast<int64_t>(dy) + height,
    static_cast<int64_t>(dy) + (source->height - sy)
  });
  if (left >= right || top >= bottom) return LW_SW_OK;
  const size_t copyBytes = static_cast<size_t>(right - left) * sizeof(uint32_t);
  for (int64_t y = top; y < bottom; ++y) {
    const size_t srcIndex = (static_cast<size_t>(sy) + static_cast<size_t>(y - dy)) *
      source->stridePixels + sx + static_cast<size_t>(left - dx);
    const size_t dstIndex = static_cast<size_t>(y) * dest->stridePixels + static_cast<size_t>(left);
    std::memcpy(dest->pixels + dstIndex, source->pixels + srcIndex, copyBytes);
  }
  return LW_SW_OK;
}
extern "C" LeeWaySwStatus leeway_sw_readback(
    const LeeWaySwSurface* s, void* output, size_t capacity, size_t* written) {
  if (written) *written = 0;
  const auto status = leeway_sw_validate(s);
  if (status != LW_SW_OK) return status;
  if (!output || !written) return LW_SW_INVALID_OUTPUT;
  if (mulOverflows(s->width, s->height) ||
      mulOverflows(static_cast<size_t>(s->width) * s->height, sizeof(uint32_t)))
    return LW_SW_INVALID_SURFACE;
  const size_t total = static_cast<size_t>(s->width) * s->height * sizeof(uint32_t);
  if (capacity < total) return LW_SW_INSUFFICIENT_BUFFER;
  if (overlaps(s->pixels, s->bufferBytes, output, total))
    return LW_SW_OVERLAPPING_BUFFERS;
  auto* dst = static_cast<uint8_t*>(output);
  for (uint32_t y = 0; y < s->height; ++y) {
    const auto* row = s->pixels + static_cast<size_t>(y) * s->stridePixels;
    std::memcpy(dst + static_cast<size_t>(y) * s->width * sizeof(uint32_t),
                row, static_cast<size_t>(s->width) * sizeof(uint32_t));
  }
  *written = total;
  return LW_SW_OK;
}
