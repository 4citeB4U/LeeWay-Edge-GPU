# LeeWay GPU Vulkan explicit layer — test candidate only

This folder contains a native x64 **Vulkan pass-through observation layer**. It is not a production GPU driver, an ICD, a Vulkan compute substitution engine or a Formula-authorized dispatch handler.

## Build and verify (Windows only)
1. Requires MSVC Build Tools and Vulkan SDK at `C:\VulkanSDK\1.4.363.0`.
2. Run `build-layer.ps1`. The result is `build/leeway_gpu_layer.dll` and a `VK_LAYER_LEEWAY_gpu_optin.json` manifest.
3. Run `node --test layer-probe.test.mjs`. A baseline Vulkan query and a child-process-only explicit layer query must both pass. No registry writes.
4. The shared LeeWay GPU control center at `http://127.0.0.1:4178/` has an ON/OFF preference. Run `probe-selected-layer.ps1` to compare: OFF invokes normal Vulkan, ON loads the layer into the **diagnostic probe process only**. Both still use the host's native GPU driver.

Per-process layer activation uses `VK_LAYER_PATH` and `VK_INSTANCE_LAYERS` only in the spawned process. Do **not** install this DLL into the system Vulkan registry, set global `VK_LAYER_PATH`, or inject it into arbitrary applications. Do not treat this as production-safe despite a successful `vulkaninfo` smoke test.

## Gate before widening compatibility
- Correct handling of multiple Vulkan instances, all physical-device enumeration paths and device dispatch tables.
- Thread-safe lifetimes, Vulkan CTS and compatibility regression for targeted applications.
- Signed per-app authorization from Runtime Fabric and a request-correlated pre-dispatch Formula decision.
- GPU resource ownership delegated to LDWMD and lineage to Continuum, with independent Veritas receipts.
- A separate Linux .so compilation and qualification. Android's Vulkan layer deployment is constrained to Android-supported debug/app-scoped mechanisms.

For arbitrary Windows D3D12 applications, this Vulkan layer is irrelevant. That requires dedicated supported application integrations or a fully developed, signed WDDM-compatible driver. Never call the candidate an operating-system-enumerated virtual GPU.
