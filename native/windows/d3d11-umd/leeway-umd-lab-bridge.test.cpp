/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.D3D11_UMD
TAG: LEEWAY_UMD_LAB_NATIVE_SOFTWARE_COMMAND_INTEGRATION_TEST
WHO: Creator-authorized LeeWay engineering.
WHAT: Execute original software renderer through lab-only UMD DLL boundary.
WHEN: 2026-10-24. WHERE: native/windows/d3d11-umd.
WHY: Verify actual execution, same-request readback and rejection across components.
HOW: Win32 dynamic loading, independent reference bytes and failure assertions.
AUTHORITY: LAB_ONLY; no OS display driver, no production grant/ledger claim.
LICENSE: LeeWay.
*/
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <array>
#include <cstdint>
#include <cstring>
#include <iostream>
#define LEEWAY_UMD_LAB_BRIDGE 1
#include "leeway-umd-lab-bridge.h"

using Submit = LeeWaySwStatus (__cdecl*)(
 const LeeWayUmdLabEnvelope*,LeeWaySwQueue*,
 const LeeWaySwResourceView*,size_t,const LeeWaySwCommand*,size_t,uint64_t*);
using Readback = LeeWaySwStatus (__cdecl*)(
 const LeeWayUmdLabEnvelope*,const LeeWaySwQueue*,
 const LeeWaySwResourceView*,size_t,uint64_t,uint64_t,void*,size_t,size_t*);
#define REQUIRE(expr) do {if(!(expr)){std::cerr<<"FAIL_LINE="<<__LINE__<<": " #expr "\n";return 1;}}while(false)
int wmain(int argc,wchar_t** argv) {
 if(argc!=2)return 2;
 HMODULE dll=LoadLibraryW(argv[1]);
 REQUIRE(dll!=nullptr);
 auto submit=reinterpret_cast<Submit>(GetProcAddress(dll,"LeeWayUmdLabSubmit"));
 auto readback=reinterpret_cast<Readback>(GetProcAddress(dll,"LeeWayUmdLabReadback"));
 REQUIRE(submit && readback);
 REQUIRE(GetProcAddress(dll,"OpenAdapter10_2")!=nullptr);
 LeeWaySwQueue queue{};
 queue.abiVersion=LEEWAY_SWGPU_COMMAND_ABI_V1;
 queue.requestSha256[0]=0xA5;
 queue.requestSha256[31]=0xCD;
 LeeWayUmdLabEnvelope envelope{};
 envelope.abiVersion=LEEWAY_UMD_LAB_ABI_V1;
 envelope.diagnosticOnly=LEEWAY_UMD_LAB_DIAGNOSTIC_ONLY;
 std::memcpy(envelope.requestSha256,queue.requestSha256,32);
 std::array<uint32_t,16> pixels{};
 LeeWaySwResourceView surface{};
 surface.resourceId=77;
 surface.surface={pixels.data(),4,4,4,sizeof(pixels)};
 std::memcpy(surface.requestSha256,queue.requestSha256,32);
 std::array<LeeWaySwCommand,2> commands{};
 commands[0].opcode=LW_SW_OP_CLEAR;
 commands[0].destinationResourceId=77;
 commands[0].bgra=0xFF000000;
 commands[1].opcode=LW_SW_OP_FILL_RECT;
 commands[1].destinationResourceId=77;
 commands[1].destinationX=1;
 commands[1].destinationY=1;
 commands[1].width=2;
 commands[1].height=2;
 commands[1].bgra=0xFF123456;
 uint64_t fence=0;
 size_t written=0;
 std::array<uint32_t,16> result{};
 REQUIRE(readback(&envelope,&queue,&surface,1,77,1,result.data(),
   sizeof(result),&written)==LW_SW_FENCE_UNAVAILABLE);
 REQUIRE(written==0);
 // Explicit lab-only opt-in; not a cryptographic grant.
 envelope.diagnosticOnly=0;
 REQUIRE(submit(&envelope,&queue,&surface,1,commands.data(),
                commands.size(),&fence)==LW_SW_REQUEST_IDENTITY_MISMATCH);
 REQUIRE(fence==0 && queue.completedFence==0);
 envelope.diagnosticOnly=LEEWAY_UMD_LAB_DIAGNOSTIC_ONLY;
 REQUIRE(submit(&envelope,&queue,&surface,1,commands.data(),
                commands.size(),&fence)==LW_SW_OK);
 REQUIRE(fence==1 && queue.completedFence==1);
 REQUIRE(readback(&envelope,&queue,&surface,1,77,1,result.data(),
   sizeof(result),&written)==LW_SW_OK);
 REQUIRE(written==64);
 std::array<uint32_t,16> expected{};
 expected.fill(0xFF000000);
 expected[5]=0xFF123456;
 expected[6]=0xFF123456;
 expected[9]=0xFF123456;
 expected[10]=0xFF123456;
 REQUIRE(pixels==expected && result==expected);
 const auto preserved=pixels;
 surface.requestSha256[8]=1;
 REQUIRE(submit(&envelope,&queue,&surface,1,commands.data(),
     commands.size(),&fence)==LW_SW_REQUEST_IDENTITY_MISMATCH);
 REQUIRE(queue.completedFence==1 && fence==0 && pixels==preserved);
 REQUIRE(readback(&envelope,&queue,&surface,1,77,1,result.data(),
     sizeof(result),&written)==LW_SW_REQUEST_IDENTITY_MISMATCH);
 REQUIRE(written==0);
 surface.requestSha256[8]=0;
 envelope.requestSha256[2]=0x99;
 REQUIRE(submit(&envelope,&queue,&surface,1,commands.data(),
     commands.size(),&fence)==LW_SW_REQUEST_IDENTITY_MISMATCH);
 REQUIRE(pixels==preserved);
 REQUIRE(readback(&envelope,&queue,&surface,1,77,1,result.data(),
     sizeof(result),&written)==LW_SW_REQUEST_IDENTITY_MISMATCH);
 REQUIRE(written==0);
 envelope.requestSha256[2]=0;
 REQUIRE(readback(&envelope,&queue,&surface,1,77,2,result.data(),
     sizeof(result),&written)==LW_SW_FENCE_UNAVAILABLE);
 REQUIRE(written==0);
 FreeLibrary(dll);
 std::cout<<"LEEWAY_D3D11_UMD_LAB_SOFTWARE_ENGINE_PASS "
            <<"nativeDll=true borrowedPixels=16 requestScoped=true "
            <<"fence=1 independentReadback=true foreignRejected=true "
            <<"protectedAdmission=false dxgiLeeWayRegistered=false\n";
 return 0;
}
