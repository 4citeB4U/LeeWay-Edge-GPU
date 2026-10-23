# G19 J-5 owner-authorized Windows Android toolchain — VERIFIED BUILD

2026-10-16. Owner approved installation on Windows of official Android NDK, CMake/Ninja, and GLSL-to-SPIR-V tooling. No on-phone application/native execution authorized. J-7 continues Apple independent. The recently restored LeeWay Voice Fabric settings were not accessed or changed.

## Tool versions and integrity
- Kitware CMake 4.4.4, Ninja 1.13.2, LunarG Vulkan SDK 1.4.363.0: installed with WinGet hash verification and successful exit codes.
- Google Android command-line tools 22.0 archive SHA-256 `90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a`, matched Google's published checksum before extraction.
- Official Google Android NDK r27c `27.2.12479018` installed by sdkmanager into current Android SDK. NDK Clang 18.0.3 verified at `C:\Users\Leona\AppData\Local\Android\Sdk\ndk\27.2.12479018\toolchains\llvm\prebuilt\windows-x86_64\bin`.

## Actual compilation results
- `glslangValidator -V --target-env vulkan1.0` compiled `native/android/vulkan-probe/shader.comp`; `spirv-val --target-env vulkan1.0` exited 0. 996-byte shader SHA256 `5cf00af46ec92dcff403bb58fbe9acc5c3f68e364b0e4331a924198d5de6f0a5`.
- The native C++ probe passed independent MSVC x64 syntax check `/EHsc /std:c++17 /Zs`.
- `E:\LeeWay-Work\evidence-staging\g19-android-toolchain\build-android-vulkan-probe.ps1` configured NDK CMake for `arm64-v8a` / Android API 28, compiled with NDK Clang 18.0.3 and linked with Ninja. Build exit code 0. Expected NDK CMake minimum-version deprecation warnings occurred, not build errors.
- Android ARM64 executable: `E:\LeeWay-Work\evidence-staging\g19-android-toolchain\arm64-build\leeway-g19-vulkan` (1,540,440 bytes). SHA-256 `2dbb0dd664f1fcf30a30b757dbce3c7b1382494477473f6f73ee152c7f03c704`.
- NDK llvm-readelf confirms ELF64, AArch64, DYN position-independent executable, and dynamic dependency on Android `libvulkan.so`, `libm.so`, `libdl.so`, `libc.so`.
- Native static regression tests 12/12 PASS. They are source checks; native ARM64 compilation is independently verified above.

## Claim limits / next authorization
**G19 Windows-side native build qualified. Samsung Vulkan dispatch/readback NOT EXECUTED; no model inference, phone-local model qualification, Runtime Fabric permit, LDWMD lease or canonical Veritas GPU receipt.** Next gate needs owner's separate approval for transient transfer/execute/readback on Fold6. Do not install an APK or mutate Pocket, graphics drivers, security, settings, pairing or Voice Fabric. Apple remains J-7 lane. No Git commit/push or Windows driver/production UI changes.
