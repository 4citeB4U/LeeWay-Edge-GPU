# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.WINDOWS.DXGI_PNP
# WHO: Creator-authorized LeeWay engineering. WHEN: 2026-10-24.
# WHAT: Compile read-only native PnP-to-DXGI adapter correlation.
# WHERE: native/windows/dxgi-probe. WHY: Prevent false OS GPU recognition.
# HOW: Windows SDK SetupAPI, DXGI, D3DKMT. AUTHORITY: DIAGNOSTIC_ONLY.
# LICENSE: LeeWay.
cmake_minimum_required(VERSION 3.20)
project(LeeWayNativeDxgiPnp LANGUAGES CXX)
if(NOT WIN32)
  message(FATAL_ERROR "Native Windows adapter probe requires Windows")
endif()
add_executable(leeway_dxgi_pnp leeway-dxgi-pnp.cpp)
target_compile_features(leeway_dxgi_pnp PRIVATE cxx_std_17)
target_link_libraries(leeway_dxgi_pnp PRIVATE dxgi setupapi cfgmgr32 gdi32)
if(MSVC)
  target_compile_options(leeway_dxgi_pnp PRIVATE /W4 /WX /permissive-)
endif()
