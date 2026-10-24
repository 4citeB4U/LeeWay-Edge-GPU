# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.SOFTWARE_GRAPHICS
# TAG: LEEWAY_SWGPU_NATIVE_BUILD_V1
# WHO: Creator-authorized engineering. WHAT: Build first-party software framebuffer.
# WHY: Validate native CPU rendering without registering a fake Windows GPU.
# WHERE: native/windows/software-gpu. WHEN: 2026-10-24.
# HOW: Native toolchain, borrowed LDWMD-compatible memory.
# AUTHORITY: Lab only; no driver installation. LICENSE: LeeWay.
cmake_minimum_required(VERSION 3.20)
project(LeeWaySoftwareGraphics LANGUAGES CXX)
add_library(leeway_swgraphics SHARED leeway-swgraphics.cpp leeway-swgraphics-command.cpp)
target_compile_features(leeway_swgraphics PRIVATE cxx_std_17)
target_compile_definitions(leeway_swgraphics PRIVATE LEEWAY_SWGRAPHICS_SHARED LEEWAY_SWGRAPHICS_EXPORTS)
target_compile_definitions(leeway_swgraphics INTERFACE LEEWAY_SWGRAPHICS_SHARED)
target_include_directories(leeway_swgraphics PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
if(MSVC)
 target_compile_options(leeway_swgraphics PRIVATE /W4 /WX /permissive-)
endif()
add_executable(leeway_swgraphics_test leeway-swgraphics.test.cpp)
target_compile_features(leeway_swgraphics_test PRIVATE cxx_std_17)
target_link_libraries(leeway_swgraphics_test PRIVATE leeway_swgraphics)
enable_testing()
add_test(NAME LeeWaySoftwareGraphicsBorrowedBuffers COMMAND leeway_swgraphics_test)
add_executable(leeway_swgraphics_command_test leeway-swgraphics-command.test.cpp)
target_compile_features(leeway_swgraphics_command_test PRIVATE cxx_std_17)
target_link_libraries(leeway_swgraphics_command_test PRIVATE leeway_swgraphics)
add_test(NAME LeeWaySoftwareGraphicsRequestBoundCommands COMMAND leeway_swgraphics_command_test)
