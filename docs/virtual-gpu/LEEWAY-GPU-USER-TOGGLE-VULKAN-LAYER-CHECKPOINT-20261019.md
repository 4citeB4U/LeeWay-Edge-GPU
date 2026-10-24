# LeeWay GPU — User switch and native interception checkpoint (2026-10-19)

## Owner intent
Install independent LeeWay GPU applications for Windows, Samsung Android and Linux with one shared service identity `leeway.gpu.service`. Every participating LeeWay application should discover it through Device Bridge; other applications may opt in through a supported client SDK, approved Vulkan layer or, eventually, a separately qualified system driver. A user can choose LeeWay GPU with one visible switch. This does not permit a caller to bypass Runtime Fabric.

## Implemented
- Windows dashboard `http://127.0.0.1:4178/` now contains a **Use LeeWay GPU** ON/OFF switch. Selection is stored atomically in `%LOCALAPPDATA%\LeeWayGPU\preferences.json`, protected by same-origin POST + a per-process CSRF token. Status reflects `requestedEnabled`, `active=false`, `dispatchAllowed=false`. Tests cover restart-safe preference reads, spoofed requests, corrupted settings and direct dispatch denial.
- Samsung/Fold6 `industries.leeway.gpu` app has an Android `Switch` persisted in private SharedPreferences. Its bound Messenger service exposes a read-only `requestedEnabled` status and continues to reject execution messages. Debug APK built, signed, installed and same-app IPC log `SERVICE_BIND_PASS_LOCKED`; physical switch tapping was not witnessed because the UI inspection showed the device lock screen.
- Node SDK `selectGpuRoute` always stays `SYSTEM_NATIVE` absent a canonical signed execution grant. OFF yields `USER_OPTED_OUT`; ON yields `LEEWAY_GPU_PENDING_AUTHORIZATION`. Spontaneous service discovery must never be treated as native dispatch permission.
- Windows Vulkan SDK 1.4.363 / MSVC: a native 64-bit **explicit** Vulkan layer candidate `VK_LAYER_LEEWAY_gpu_optin` was compiled in `applications/vulkan-layer-candidate`. It observes instance/device creation and forwards to the real Vulkan driver. No global layer registration, driver replacement, system environment change or all-app injection occurred.
- On the Windows laptop, isolated `vulkaninfo --summary` baseline and opt-in layer tests both passed: Intel Graphics and NVIDIA RTX 5060 Laptop GPU remained discoverable. The initial candidate caused an isolated Vulkan access violation; this was repaired by implementing the Vulkan device-create/dispatch forwarding chain. The corrected candidate passes 2/2 baseline-vs-layer regression tests.
- The Windows owner preference was exercised ON and OFF with `probe-selected-layer.ps1`: ON loaded the candidate layer in one diagnostic process; OFF used normal Vulkan; both passes, and preference was restored OFF.
- Linux `install-linux.sh` systemd-user service script passed a bash syntax check. No Linux physical deployment or Vulkan layer binary is qualified.

## Important production boundaries
1. Current switch is a **request preference**, not OS-wide GPU device selection or production execution authorization.
2. The native Windows Vulkan candidate is **pass-through observation** only; it does not yet interpose queue submissions, memory binding or Formula decisions. It is not production-qualified for multi-instance, concurrency, all extensions, or graphics applications.
3. Windows universal D3D12 GPU selection/interception would require a genuine, signed WDDM-compatible driver or explicit per-app integration; an indirect-display driver is not a generic GPU compute driver. No signed WDDM virtual adapter was produced or installed.
4. Linux Vulkan integration requires a separately compiled, tested ELF layer or ICD; the Windows DLL cannot be installed on Linux. Native D3D/OpenGL/Vulkan apps differ in routing.
5. Android does not support arbitrary globally installed implicit Vulkan layers for regular apps. Debug Vulkan layers have app-scoped prerequisites. A normal APK cannot silently replace GPU drivers for all Samsung applications.
6. Cross-app mandatory use requires each LeeWay application to bind the SDK/IPC or an approved platform loader. Arbitrary third-party apps cannot be promised automatic LeeWay interception today.

## Production gates not completed
- Canonical owner-controlled Runtime Fabric GPU grant issuer and trusted key provisioning.
- Approved pre-dispatch Formula GPU scheduling policy (real telemetry Formula calculations were provisional).
- Runtime Fabric-authorized physical LDWMD leases and live Continuum owner admission on the *same request*.
- Governed D3D12 and Android/Linux Vulkan dispatch plus independently signed canonical Veritas receipt.
- Rollout and enforcement in every LeeWay product; third-party opt-in protocol and application compatibility testing.
- OS-signed Windows virtual GPU driver, Linux Vulkan ICD and unrestricted third-party interception (separate, much larger qualifications).

## Evidence and source locations
Device Bridge: `packages/leeway-gpu-service/{service.mjs,preferences.mjs,client.mjs,dashboard.html,preferences.test.mjs}`.
Native candidate: `LeeWay-Edge-GPU/applications/vulkan-layer-candidate/{leeway_layer.cpp,build-layer.ps1,layer-probe.test.mjs,probe-selected-layer.ps1}`.
Windows installation: `%LOCALAPPDATA%\LeeWayGPU`; Android package: `industries.leeway.gpu`.
References: Khronos Vulkan loader layer interface and discovery documents; Microsoft WDDM architecture and Windows kernel driver signing requirements; Android NDK Vulkan layer setup documentation.
