# G17 — LeeWay Edge GPU three-device native provider architecture

## Owner requirements (2026-10-16)

- Product identity: **LeeWay Edge GPU**, manufacturer **LeeWay Industries**.
- Modes: `LEEWAY_ONLY` (LeeWay-controlled execution backend; hardware attribution mandatory), `LEEWAY_ASSIST` (LeeWay schedules work on supported physical GPU), and `UNAVAILABLE` (no qualified GPU path). Never silently substitute CPU neural inference or software rasterization for native GPU execution.
- Windows first for driver implementation; parallel Android Vulkan and Apple Metal capability work; Linux Vulkan design.
- Native OS adapter identity is a separate qualification from LeeWay compute-provider identity. Never fabricate PCI IDs, GPU memory, command queues, a second physical GPU, or a system-visible Metal device.
- Preserve Intel and NVIDIA drivers; VM-first driver testing; host install/security changes and GitHub publication require separate owner approval.

## Device observations (read-only)

| Device | Native graphics | Discovery evidence | LeeWay status |
|---|---|---|---|
| Windows PC | Intel Graphics + NVIDIA RTX 5060 Laptop GPU | PnP Display / Win32_VideoController | LeeWay native adapter NOT ENUMERATED |
| Galaxy Z Fold6 | Qualcomm Adreno 750 | ADB SurfaceFlinger GLES vendor/renderer; Vulkan compute feature | LeeWay Vulkan backend NOT EXECUTED |
| Apple iPhone | GPU not yet independently identified | Apple USB device and iPhone detected by Windows | Metal backend NOT EXECUTED; native second-GPU registration unsupported as a general app capability |

## Unified Device Provider Interface (UDPI) — proposal, not another authority

Device Bridge remains the discovery and permission authority. UDPI is a versioned adapter-consumer contract within LeeWay Edge GPU, not a replacement registry or driver.

- `providerId`, `platform`, `providerKind` (`OS_NATIVE_ADAPTER` / `LEEWAY_MANAGED_COMPUTE`), `displayName`, `providerManufacturer`, `hardwareManufacturer`, `hardwareName`, `physicalDeviceId` (when authorized).
- `nativeRecognition`: API, observed ID, actual evidence source and verification state; `NOT_RECOGNIZED` when absent.
- `execution`: backend API (`D3D12`, `VULKAN`, `METAL`), command submission proof, readback proof, workload attribution; `NOT_EXECUTED` until verified.
- `memory`: LDWMD residency identity, actual measured allocation/capacity, unknown instead of fabricated VRAM.
- `mode`: `LEEWAY_ONLY`, `LEEWAY_ASSIST`, or `UNAVAILABLE`, subject to Runtime Fabric authorization, Formula evaluation and Veritas receipts.

## Platform-specific qualification

**Windows:** WDDM native adapter registration requires real supported graphics driver and API-level execution. A UMD stub cannot manufacture a PCI device or guarantee DXGI enumeration. In parallel, a LeeWay-managed D3D12 compute provider can use Intel/NVIDIA hardware but must not claim a third OS GPU.

**Android:** use application-supported Vulkan compute and the installed vendor driver. A Vulkan ICD JSON manifest is not generally sufficient for arbitrary non-privileged Android apps to register a new system GPU. Preserve Qualcomm identity and report LeeWay as provider, not hardware manufacturer.

**Apple:** use a supported `MTLCreateSystemDefaultDevice`/`MTLCopyAllDevices` (where available) and command queues on real Apple hardware. A custom app `MTLDevice` wrapper does not register a second system GPU. MLX is an optional model framework, not a Metal driver registration mechanism; do not count native MLX execution as exclusive LeeWay inference without governance qualification.

**Linux:** an installable Vulkan ICD manifest is meaningful only when paired with a complete, working Vulkan implementation and valid loader registration. Vulkan discovery does not imply Linux DRM kernel GPU registration. No dummy `VkPhysicalDevice` allowed.

## Diagnostics acceptance

Present separate views of `PHYSICAL_GPU` (Intel/NVIDIA/Qualcomm/Apple manufacturer) and `LEEWAY_COMPUTE_PROVIDER` (LeeWay Industries). Count an extra `OS_NATIVE_GPU` only when the host OS and graphics API actually enumerate it and command execution/readback are independently verified. Display real backend, mode, allocation, throughput, errors, thermals when available; unknown is unknown.

## Current gate

Windows native LeeWay GPU: NOT ENUMERATED. Android Vulkan LeeWay execution: NOT EXECUTED. Apple Metal LeeWay execution: NOT EXECUTED. Linux: NOT TESTED. No claim of a second OS GPU on any device. No driver installed, host graphics changed, or GitHub published.
