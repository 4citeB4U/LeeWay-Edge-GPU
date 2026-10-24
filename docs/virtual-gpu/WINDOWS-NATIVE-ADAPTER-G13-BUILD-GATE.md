# G13 — Windows native LeeWay GPU adapter build gate

Scope: LeeWay-Edge-GPU native Windows adapter development; no driver or development tool installation in this checkpoint.

## Observed environment

- Windows 11 Home, x64, build 26200.
- Intel Graphics and NVIDIA GeForce RTX 5060 Laptop GPU enumerate as OK. LeeWay does not enumerate in PnP Display or Win32_VideoController.
- No LeeWay graphics driver service detected.
- MSVC, MSBuild, Windows Driver Kit verification/signing tools not found. Existing Node.js and .NET SDK do not constitute a WDDM build toolchain.
- Official winget metadata lists Microsoft.VisualStudio.2022.BuildTools version 17.14.41 and Microsoft.WindowsWDK.10.0.26100 version 10.1.26100.6584. Installer listing is not installation or SDK/WDK compatibility verification.

## Native recognition design boundary

1. A LeeWay compute application or registered software/PnP device is **not** automatically a Windows WDDM graphics adapter. A legitimate display adapter needs a working Windows graphics driver stack and API-level qualification.
2. A user-mode graphics compute runtime may execute workloads over existing Intel/NVIDIA hardware but must not be represented as a separate Windows GPU. Underlying hardware remains identified truthfully.
3. A virtual display/indirect display driver is not equivalent to a general-purpose compute GPU and does not satisfy LeeWay GPU inference admission.
4. Keep Runtime Fabric as execution authority, canonical Formula as mathematical authority, LDWMD as memory residency authority, Continuum as state authority, and Veritas as acceptance authority. Do not create a second orchestration or memory authority.
5. The LeeWay Diagnostics Matrix must show two distinct facts: Windows-recognized adapters and LeeWay's software-defined compute capability. Do not label the latter as native until actual device enumeration and command submission pass.

## Required implementation gates

- Build environment: owner-approved installation of compatible Visual Studio C++ Build Tools, Windows SDK, WDK; verify version compatibility and tool signatures.
- Isolated source: define Windows device/backend interface and documented driver model. Do not register arbitrary PCI IDs or use identity/feature spoofing.
- Build: compile, static analyze, verify INF/signature; retain reproducible source and hashes.
- Safety: isolate test deployment; provide explicit uninstall, rollback, and restore point strategy before any test-signing or driver installation; preserve Intel/NVIDIA graphics.
- Recognition: correlate Get-PnpDevice Display, Win32_VideoController, and installed driver; inspect driver state and errors.
- Function: independently verify actual command submission, resource allocation, results/readback, API support, and driver failure recovery. Do not substitute a native model server or CPU neural fallback for LeeWay-owned inference.
- Diagnostics: bind only measured adapter capabilities and workload telemetry; unavailable temperature/VRAM must remain unavailable.
- Cross-platform: design distinct Linux, Android, macOS, iOS adapters; Windows driver mechanisms cannot be transplanted to Apple mobile or Android.

## Acceptance

G13: planning/toolchain metadata only. Native Windows adapter: BLOCKED. GPU inference: NOT EXECUTED. Diagnostics native integration: NOT EXECUTED. C3/Veritas canonical receipt: NOT CREATED. Learning Ledger: NOT UPDATED.
