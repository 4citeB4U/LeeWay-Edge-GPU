# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.D3D11_UMD
# TAG: LEEWAY_D3D11_REAL_OPENADAPTER_ABI_BUILD
# WHO: Creator-authorized engineering. WHAT: Compile typed D3D11 UMD.
# WHEN: 2026-10-24. WHERE: native/windows/d3d11-umd.
# WHY: Test real Windows graphics runtime ABI without a fake driver.
# HOW: Windows SDK + MSVC + direct DLL export test.
# AUTHORITY: Test-only; no WDDM install. LICENSE: LeeWay.
cmake_minimum_required(VERSION 3.20)
project(LeeWayD3D11UmdAbi LANGUAGES CXX)
if(NOT WIN32)
 message(FATAL_ERROR "Windows D3D11 UMD requires Windows SDK")
endif()
add_library(leeway_d3d11_umd MODULE leeway-d3d11-umd.cpp)
set_target_properties(leeway_d3d11_umd PROPERTIES PREFIX "")
target_compile_features(leeway_d3d11_umd PRIVATE cxx_std_17)
if(MSVC)
 target_compile_options(leeway_d3d11_umd PRIVATE /W4 /WX /permissive- /wd4201)
endif()
target_link_libraries(leeway_d3d11_umd PRIVATE dxgi)
add_executable(leeway_d3d11_umd_probe leeway-d3d11-umd.test.cpp)
target_compile_features(leeway_d3d11_umd_probe PRIVATE cxx_std_17)
enable_testing()
add_test(NAME LeeWayD3D11ActualOpenAdapterAbi
 COMMAND leeway_d3d11_umd_probe $<TARGET_FILE:leeway_d3d11_umd>)
