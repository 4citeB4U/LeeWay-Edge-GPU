/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.SOFTWARE_GRAPHICS
TAG: LEEWAY_SWGPU_DRIVER_PACKET_REPLAY_GUARD_TEST
WHO: Creator-authorized LeeWay engineering.
WHAT: Test packet commands, resources, request identity, fences and readback.
WHERE: native/windows/software-gpu. WHEN: 2026-10-24.
WHY: Driver frontends cannot accept wrong-request, foreign, partial,
     aliased, exhausted or uncompleted command evidence.
HOW: Independent reference pixels and negative mutation assertions.
AUTHORITY: Test-only; not protected Runtime enrollment or WDDM driver.
LICENSE: Existing LeeWay repository terms.
*/
#include "leeway-swgraphics-command.h"
#include <array>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <limits>
#define REQUIRE(x) do {if(!(x)){std::cerr<<"FAIL at "<<__LINE__<<": " #x "\n";return 1;}}while(false)
int main() {
  std::array<uint32_t,16> dst{};
  std::array<uint32_t,4> src{1,2,3,4};
  LeeWaySwQueue q{};
  q.abiVersion=LEEWAY_SWGPU_COMMAND_ABI_V1;
  q.requestSha256[0]=0xAB;
  q.requestSha256[31]=0xCD;
  std::array<LeeWaySwResourceView,2> resources{};
  resources[0].resourceId=11;
  resources[0].surface={dst.data(),4,4,4,sizeof(dst)};
  resources[1].resourceId=22;
  resources[1].surface={src.data(),2,2,2,sizeof(src)};
  for(auto& v:resources)std::memcpy(v.requestSha256,q.requestSha256,32);
  std::array<LeeWaySwCommand,3> cmds{};
  cmds[0].opcode=LW_SW_OP_CLEAR;
  cmds[0].destinationResourceId=11;
  cmds[0].bgra=0xFF111111;
  cmds[1].opcode=LW_SW_OP_FILL_RECT;
  cmds[1].destinationResourceId=11;
  cmds[1].destinationX=-1;
  cmds[1].destinationY=0;
  cmds[1].width=3;
  cmds[1].height=1;
  cmds[1].bgra=0xFF223344;
  cmds[2].opcode=LW_SW_OP_BLIT_OPAQUE;
  cmds[2].destinationResourceId=11;
  cmds[2].sourceResourceId=22;
  cmds[2].destinationX=1;
  cmds[2].destinationY=1;
  cmds[2].width=2;
  cmds[2].height=2;
  uint64_t fence=0;
  REQUIRE(leeway_sw_readback_resource(&q,resources.data(),2,11,1,dst.data(),sizeof(dst),nullptr)==LW_SW_FENCE_UNAVAILABLE);
  REQUIRE(leeway_sw_submit_commands(&q,resources.data(),2,cmds.data(),cmds.size(),&fence)==LW_SW_OK);
  REQUIRE(fence==1 && q.completedFence==1);
  std::array<uint32_t,16> expected{};
  expected.fill(0xFF111111);
  expected[0]=0xFF223344;expected[1]=0xFF223344;
  expected[5]=1;expected[6]=2;expected[9]=3;expected[10]=4;
  REQUIRE(dst==expected);
  std::array<uint32_t,16> packed{};
  size_t written=0;
  REQUIRE(leeway_sw_readback_resource(&q,resources.data(),2,11,1,packed.data(),sizeof(packed),&written)==LW_SW_OK);
  REQUIRE(written==64 && packed==expected);
  REQUIRE(leeway_sw_readback_resource(&q,resources.data(),2,11,2,packed.data(),sizeof(packed),&written)==LW_SW_FENCE_UNAVAILABLE);
  REQUIRE(written==0);
  // Foreign source identity rejected before mutation and fence increment.
  const auto before=dst;
  resources[1].requestSha256[1]=1;
  REQUIRE(leeway_sw_submit_commands(&q,resources.data(),2,cmds.data(),cmds.size(),&fence)==LW_SW_REQUEST_IDENTITY_MISMATCH);
  REQUIRE(fence==0 && dst==before && q.completedFence==1);
  REQUIRE(leeway_sw_readback_resource(&q,resources.data(),2,11,1,packed.data(),sizeof(packed),&written)==LW_SW_REQUEST_IDENTITY_MISMATCH);
  resources[1].requestSha256[1]=0;
  // Later wrong handle invalidates the whole packet, including earlier valid clear.
  cmds[2].sourceResourceId=9999;
  REQUIRE(leeway_sw_submit_commands(&q,resources.data(),2,cmds.data(),cmds.size(),&fence)==LW_SW_RESOURCE_NOT_FOUND);
  REQUIRE(dst==before && q.completedFence==1);
  cmds[2].sourceResourceId=22;
  resources[1].resourceId=11;
  REQUIRE(leeway_sw_submit_commands(&q,resources.data(),2,cmds.data(),cmds.size(),&fence)==LW_SW_DUPLICATE_RESOURCE);
  REQUIRE(dst==before);
  resources[1].resourceId=22;
  auto originalSurface=resources[1].surface;
  resources[1].surface.pixels=dst.data();
  resources[1].surface.bufferBytes=sizeof(dst);
  REQUIRE(leeway_sw_submit_commands(&q,resources.data(),2,cmds.data(),cmds.size(),&fence)==LW_SW_OVERLAPPING_BUFFERS);
  REQUIRE(dst==before);
  resources[1].surface=originalSurface;
  q.completedFence=UINT64_MAX;
  REQUIRE(leeway_sw_submit_commands(&q,resources.data(),2,cmds.data(),cmds.size(),&fence)==LW_SW_FENCE_EXHAUSTED);
  REQUIRE(dst==before);
  q.completedFence=1;
  q.requestSha256[0]=0; q.requestSha256[31]=0;
  REQUIRE(leeway_sw_submit_commands(&q,resources.data(),2,cmds.data(),cmds.size(),&fence)==LW_SW_INVALID_COMMAND);
  REQUIRE(dst==before);
  std::cout<<"LEEWAY_SOFTWARE_COMMAND_QUEUE_PASS packetCommands=3 requestCorrelated=true "
    <<"foreignRejected=true atomicPreflight=true fenceReadback=true hardwareGpuRequired=false "
    <<"wddmRegistered=false\n";
  return 0;
}
