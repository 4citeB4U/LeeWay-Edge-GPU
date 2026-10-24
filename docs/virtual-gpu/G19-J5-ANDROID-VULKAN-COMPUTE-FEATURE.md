# G19 J-5 Samsung Vulkan compute feature qualification — 2026-10-16

Creator allocation: J-5 Microsoft Windows and Samsung Android; J-7 Apple only. Read newest contributor notes before this stride.

## Actual read-only phone observation
ADB `pm list features` on connected Fold6 SM-F956U advertised `android.hardware.vulkan.compute`, `android.hardware.vulkan.level=1` and `android.hardware.vulkan.version=4206592`. `/system/lib64/libvulkan.so` and `/vendor/lib64/hw/vulkan.adreno.so` exist. Graphics observation previously identified Qualcomm Adreno 750. These are advertised API/capability indicators, not proof of an initialized VkDevice, compute pipeline, shader dispatch, fenced readback, or model inference.

## Host tooling gap
`where.exe clang`, `glslangValidator`, `cmake`, and `ninja` found no executables in PATH in this bounded probe; default Android SDK NDK path previously appeared absent. This does not rule out alternate installed toolchains; locate authorized reusable build assets before installing anything.

## Implemented and tested
`contracts/g19-android-vulkan-capability.mjs` and `.test.mjs` parse Android feature lines and explicitly leave dispatch/readback/model flags false. Four new tests PASS. Combined with device-inventory and platform-readiness suites: 19/19 PASS. Synthetic parsers are not Vulkan execution evidence.

## Next bounded engineering gates
1. Discover or reuse an existing Android NDK/Vulkan shader toolchain without modifying device or installing packages.
2. Compile a tiny Vulkan shader + native test harness in an isolated build directory; verify adapter vendor/device and deterministic compute readback on actual Fold6.
3. Locate owner-authorized phone-local language model and runtime; do not reuse the paired-PC model catalog as local proof.
4. Only after Formula/Runtime Fabric/Device Bridge/LDWMD/Continuum/Veritas receipts and Digital Brain/Diagnostics observation correlate, qualify LeeWay-managed model execution.

No Android app install or inference, no production UI changes, host GPU driver deployment, reboot, security change, Git commit or push.
