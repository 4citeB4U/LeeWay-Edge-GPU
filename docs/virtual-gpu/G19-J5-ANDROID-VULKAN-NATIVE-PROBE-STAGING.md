# G19 J-5 Android Vulkan native probe staging — 2026-10-16

Read latest CONTRIBUTORS notes including J-7 iPhone 11 Windows developer-mode Lockdown discovery before implementation. Platform separation preserved: J-5 Windows/Samsung, J-7 Apple.

Observed Android `pm list features`: hardware Vulkan compute advertised, Vulkan level=1, Vulkan version=4206592. Hardware loader/vendor ICD libraries present; physical GPU Adreno 750 observed by SurfaceFlinger. Native runtime execution remains unproven.

Implemented under `native/android/vulkan-probe/`: `shader.comp` (256 unsigned output lanes), `main.cpp` (physical Vulkan GPU enumeration, compute queue, storage buffer, native compute pipeline, dispatch, pipeline barrier, 10-second fence wait, mapped-host readback, exact CPU reference mismatch), `CMakeLists.txt` (Android-only Vulkan target), `source-contract.test.mjs` and bounded `README.md`. Node static contract tests 4/4 PASS. This means source markers and independent reference expression exist; does NOT qualify C++ compiler, SPIR-V shader validation, binary correctness or device execution.

Toolchain discovery: PATH lacks clang/glslangValidator/cmake/ninja; default Android SDK directory has platforms, platform-tools, build-tools but no NDK. Build stage blocked pending reusable or owner-approved Android NDK and GLSL/SPIR-V compiler. No phone filesystem writes, app installs, shader dispatch, inference, new OS GPU, Windows driver activation, UI changes, security changes, reboot or Git publication.

Next gates: qualify native Android toolchain and build, inspect compiled binary and SPIR-V hashes, request explicit approval for temporary Fold6 probe execution, independently verify physical Adreno dispatch/readback, then connect G19 model/Formula/Runtime Fabric/LDWMD/Continuum/Veritas authority. Physical probe success cannot alone count as LeeWay-managed inference.
