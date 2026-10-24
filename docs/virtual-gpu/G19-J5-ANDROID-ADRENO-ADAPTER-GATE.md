# G19 J-5 Adreno adapter selection hardening — 2026-10-16

Read latest `CONTRIBUTORS.md`; J-7 Apple lane unchanged.

## Toolchain checks
The inspected host has Android SDK Build Tools 34.0.0 and Visual Studio locator `vswhere.exe`, but no Android NDK at default SDK location, no clang at checked Visual Studio LLVM path, no `C:\VulkanSDK` or default CMake executable. Bounded checks do not prove tools absent everywhere. No toolchain installed.

## Source changes
`native/android/vulkan-probe/main.cpp` now requires vendor ID `0x5143` (Qualcomm), refuses `VK_PHYSICAL_DEVICE_TYPE_CPU`, and requires a compute-capable queue on the selected Qualcomm adapter; no fallback to software or a different physical vendor. SPIR-V loader also checks five-word minimum and magic header `0x07230203` before module creation. Added `adapter-identity.test.mjs` with four static tests. Total native source/build-safety/identity tests: **12/12 PASS**.

## Limitations
Source-only checks do not validate C++ compilation, shader SPIR-V validity, native Vulkan runtime behavior, vendor identity authenticity from a trusted Device Bridge or successful GPU readback. Actual phone test must emit Qualcomm physical adapter identity and zero readback mismatches, then independently verify those facts. The existing standalone GPU kernel, even if executed, will not grant Leeway-governed model inference.

## Next gate
Use an approved Android NDK (ARM64 target), CMake/Ninja, and GLSL-to-SPIR-V compiler to build in isolated staging. No phone transfer/execution until creator separately approves transient probe. Windows request-scoped inference authority and Digital Brain telemetry still blocked on canonical receipts. J-7 retains Apple responsibility. No device or driver installation, reboot, security change, live UI change, inference, Git commit/push.
