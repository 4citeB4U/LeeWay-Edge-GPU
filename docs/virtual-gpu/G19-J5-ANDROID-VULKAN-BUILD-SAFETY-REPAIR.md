# G19 J-5 Samsung native build-safety checkpoint — 2026-10-16

Read newest CONTRIBUTORS.md including J-7 Apple Windows-device-access note before acting. J-5 scope Windows and Samsung; J-7 Apple unchanged.

## Source defects corrected

1. Native `main.cpp` no longer casts a `std::vector<char>` pointer to potentially misaligned `uint32_t*` for Vulkan shader module creation; shader words are copied to aligned `std::vector<uint32_t>` and passed to `VkShaderModuleCreateInfo`.
2. Vulkan output allocation is explicitly filled with `0xFF` sentinel bytes before compute submission, so stale/uninitialized contents cannot accidentally be presented as deliberate shader output.
3. Android `CMakeLists.txt` now links `find_library(ANDROID_VULKAN_LIBRARY vulkan REQUIRED)` from NDK sysroot, instead of depending on desktop `find_package(Vulkan REQUIRED)`. Android-only build target retained.

## Verification

Ran `node --test native/android/vulkan-probe/source-contract.test.mjs native/android/vulkan-probe/build-safety.test.mjs`: **8 tests, 8 passed, 0 failed**. These are static source-level checks. They do not establish Android C++ compilation, SPIR-V validity, or Vulkan dispatch/readback on actual phone.

## Toolchain

Bounded inspection: Android SDK platforms/platform-tools/build-tools 34.0.0 present. No NDK or cmdline-tools observed in default `C:\Users\Leona\AppData\Local\Android\Sdk`; native clang/glslangValidator/cmake/ninja missing on PATH. Toolchain qualification and owner-approved installation remain pending. Do not transfer/execute native binary on Samsung without explicit approval.

G19 model inference authorization still blocked on real Formula, Runtime Fabric, LDWMD, Continuum and Veritas receipts. Windows WDK ready; safe native Windows driver guest not available. No device/app install, model inference, driver activation, reboot, credentials, security change, Git commit/push or live Diagnostics edit performed.
