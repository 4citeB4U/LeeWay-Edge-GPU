/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.SOFTWARE_GRAPHICS
TAG: LEEWAY_SWGPU_RENDER_INDEPENDENT_READBACK_TESTS
WHO: Creator-authorized LeeWay engineering.
WHAT: Deterministic framebuffer verification and negative admission tests.
WHEN: 2026-10-24. WHERE: native/windows/software-gpu.
WHY: A render pass must not claim success on stale/foreign buffers.
HOW: Known independent expected pixels; no physical GPU required.
AUTHORITY: Lab test only; no WDDM or protected production admission.
LICENSE: Existing LeeWay repository terms.
*/
#include "leeway-swgraphics.h"
#include <array>
#include <cstdint>
#include <iostream>
#include <limits>

#define REQUIRE(expr) do { if (!(expr)) { \
 std::cerr << "FAIL line " << __LINE__ << ": " #expr "\n"; return 1; \
} } while (false)

int main() {
  // Borrowed storage simulates an LDWMD-provided span: render core owns no allocation.
  std::array<uint32_t, 12> memory{};
  // 3x3 visible, fourth pixel per row is padding and must remain unchanged.
  LeeWaySwSurface s{memory.data(), 3, 3, 4, memory.size()*sizeof(uint32_t)};
  REQUIRE(leeway_sw_validate(&s)==LW_SW_OK);
  memory[3]=0xAABBCCDD;memory[7]=0xAABBCCDD;memory[11]=0xAABBCCDD;
  REQUIRE(leeway_sw_clear(&s,0xFF000000)==LW_SW_OK);
  REQUIRE(leeway_sw_fill_rect(&s,-1,1,3,3,0xFF112233)==LW_SW_OK);
  // x = -1..1 clipped; only first two visible columns in rows 1,2.
  const std::array<uint32_t,12> expected{
    0xFF000000,0xFF000000,0xFF000000,0xAABBCCDD,
    0xFF112233,0xFF112233,0xFF000000,0xAABBCCDD,
    0xFF112233,0xFF112233,0xFF000000,0xAABBCCDD
  };
  REQUIRE(memory==expected);

  std::array<uint32_t,9> packed{};
  size_t readBytes=0;
  REQUIRE(leeway_sw_readback(&s,packed.data(),packed.size()*sizeof(uint32_t),&readBytes)==LW_SW_OK);
  REQUIRE(readBytes==36);
  REQUIRE(packed[0]==0xFF000000&&packed[3]==0xFF112233&&packed[4]==0xFF112233);
  REQUIRE(packed[6]==0xFF112233&&packed[8]==0xFF000000);
  REQUIRE(memory[3]==0xAABBCCDD&&memory[7]==0xAABBCCDD&&memory[11]==0xAABBCCDD);

  // Original source is not changed by blit; different caller-owned allocation required.
  std::array<uint32_t,16> destination{};
  LeeWaySwSurface d{destination.data(),4,4,4,sizeof(destination)};
  REQUIRE(leeway_sw_clear(&d,0xFFFEFEFE)==LW_SW_OK);
  REQUIRE(leeway_sw_blit_opaque(&s,&d,1,1,2,1,2,2)==LW_SW_OK);
  REQUIRE(destination[1*4+2]==0xFF112233);
  REQUIRE(destination[1*4+3]==0xFF000000);
  REQUIRE(destination[2*4+2]==0xFF112233);
  REQUIRE(destination[0]==0xFFFEFEFE);

  // A request copying from a foreign or aliased allocation may never execute.
  const auto before=destination;
  REQUIRE(leeway_sw_blit_opaque(&d,&d,0,0,0,0,2,2)==LW_SW_OVERLAPPING_BUFFERS);
  REQUIRE(destination==before);
  REQUIRE(leeway_sw_fill_rect(&d,std::numeric_limits<int32_t>::max(),0,1,1,7)==LW_SW_OK);
  REQUIRE(destination==before);
  REQUIRE(leeway_sw_fill_rect(&d,0,0,0,1,7)==LW_SW_INVALID_REGION);
  REQUIRE(destination==before);

  LeeWaySwSurface truncated{memory.data(),3,3,4,8};
  REQUIRE(leeway_sw_validate(&truncated)==LW_SW_INSUFFICIENT_BUFFER);
  REQUIRE(leeway_sw_clear(&truncated,7)==LW_SW_INSUFFICIENT_BUFFER);
  REQUIRE(memory==expected);
  REQUIRE(leeway_sw_readback(&s,packed.data(),4,&readBytes)==LW_SW_INSUFFICIENT_BUFFER);
  REQUIRE(readBytes==0);
  REQUIRE(leeway_sw_readback(&s,memory.data(),sizeof(memory),&readBytes)==LW_SW_OVERLAPPING_BUFFERS);
  REQUIRE(readBytes==0);

  // Nonzero width/height and padded stride are mandatory, but not product-wide tensor ceilings.
  LeeWaySwSurface invalid{memory.data(),3,3,2,sizeof(memory)};
  REQUIRE(leeway_sw_validate(&invalid)==LW_SW_INVALID_SURFACE);

  std::cout<<"LEEWAY_SOFTWARE_GRAPHICS_BGRA8_PASS"
    <<" visiblePixels=9 readbackBytes=36"
    <<" independentExpected=true borrowedMemory=true hardwareGpuRequired=false"
    <<" nativeAdapterRegistered=false\n";
  return 0;
}
