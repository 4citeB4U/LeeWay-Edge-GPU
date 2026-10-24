# G19 J-5 Windows and Fold6 hardware observation checkpoint

2026-10-16. Creator assignment: J-5 Windows + Samsung, J-7 Apple only. Read-only hardware discovery and source-only parsing tests.

## Observed Windows
- Win32_VideoController: `Intel(R) Graphics`, driver `32.0.101.8724`; `NVIDIA GeForce RTX 5060 Laptop GPU`, driver `32.0.15.9201`.
- Windows Kits WDK 10.0.26100.0 km/wdm.h present; build readiness only, NOT host driver installation or separate OS-native LeeWay adapter.
- AdapterRAM Win32 values are not trusted as model residency or verified VRAM capacity. Driver proof remains J-7's earlier D3D12 kernel dispatch, not authorized model inference.

## Observed Fold6
- ADB SM-F956U connected, graphics hardware `adreno`, Android API 37; SurfaceFlinger GLES reports Qualcomm `Adreno (TM) 750`.
- System Vulkan loader `/system/lib64/libvulkan.so` and Qualcomm vendor Vulkan ICD `/vendor/lib64/hw/vulkan.adreno.so` exist. This is GPU API discovery, NOT Vulkan compute device submission, readback, GPU model inference or phone-local model presence. SurfaceFlinger `vulkan_renderengine:false` refers to display compositor behavior and does not establish Vulkan compute unsupported.
- Android NDK not found in inspected `C:\Users\Leona\AppData\Local\Android\Sdk\ndk` path. No NDK installation requested or performed.

## Implemented
`contracts/g19-device-inventory.mjs` and `.test.mjs`: seven synthetic checks (7/7 PASS). Source parsing separates observed hardware identity from model execution qualification, retains no sensitive Android device serial, and suppresses unverified Win32 AdapterRAM from memory telemetry.

## Open Gates
1. Windows: request-specific canonical Formula/Runtime Fabric model execution permit, LDWMD memory lease and GPU Veritas receipt; then join trusted observation into Digital Brain and Diagnostics.
2. Android: locate a truly local model, verify supported Vulkan compute pipeline/dispatch/readback on Adreno 750, and bind canonical authority and evidence before testing inference.
3. Apple: J-7 lane; no J-5 implementation action.

No inference or driver installation, Android app mutation, production UI modification, reboot, Git commit or push.
