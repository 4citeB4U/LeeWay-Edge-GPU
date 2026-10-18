# G19 — Why LeeWay GPU is not OS-registered — 2026-10-18

## Investigate — live host, read-only
Windows Win32_VideoController reports only Intel(R) Graphics (status OK, driver 32.0.101.8724) and NVIDIA GeForce RTX 5060 Laptop GPU (status OK, driver 32.0.15.9201).
`pnputil /enum-devices /class Display` independently lists only those two STARTED display devices, each with a real manufacturer INF (`oem238.inf`, `oem239.inf`). No LeeWay adapter is enumerated.
Repository `native/windows` contains a D3D12 compute directory, adapter contracts/tests and README; inspection found no `*.inf`, `*.sys`, or Vulkan ICD JSON manifest in repository tree. Repository git worktree has 111 entries and was deliberately not cleaned, reset, rebased or committed locally.

## Reconcile canonical existing evidence
Existing `docs/virtual-gpu/G19-J7-WINDOWS-DRIVER-PREREQUISITE-REFRESH.md` dated 2026-10-16 records Windows 11 Home build 26200, WDK header `km/wdm.h` absent, `InfVerif.exe` absent, no qualified isolated Windows guest driver-test environment, no driver installed and no driver build attempted. It explicitly classifies this as `BLOCKED — WDK and isolated Windows driver-test target not qualified`, and distinguishes verified D3D12 physical GPU dispatch/readback from an OS-enumerated LeeWay adapter. This historical inventory was **not** remeasured for WDK installation today.

## Diagnose — three separate registration paths
1. Compute backend/provider: LeeWay can dispatch through physical GPU Vulkan or D3D12, without creating OS hardware registration.
2. Vulkan ICD: a separately implemented and registered ICD (with proper loader manifest and Vulkan driver/device interface) can expose a logical Vulkan physical device to Vulkan clients but does not imply Windows Display-class or Device Manager enumeration.
3. Windows OS graphics adapter: requires an appropriate Windows graphics-driver/adapter model, test-signing/security compliance and tested driver packaging in a proper isolated VM/test system. A general-purpose OS-visible virtual GPU is not delivered simply by shaders, DLL, or a D3D12 prototype. No existing device driver should be replaced or test-signing enabled on the owner's production PC.

## Test / Validate
Two independent current read-only Windows adapter enumerations agree: 2 physical GPU adapters, no LeeWay adapter. Native Windows repo tree inventory shows no driver package, so OS registration is **NOT IMPLEMENTED / NOT OBSERVED** in inspected integration. This does not imply LeeWay compute is nonexistent. Fold6 physical Adreno is vendor driver `com.samsung.gamedriver.sm8650`, not an independently enumerated LeeWay virtual GPU. Q4_K physical GPU inference failure is a separate unresolved correctness gate.

## Plan — reuse before build and acceptance
Classify D3D12/Vulkan dispatch as ALREADY BUILT/PARTIALLY BUILT; OS GPU registration as TRULY MISSING or MISSING GLUE only after a full read-only discovery of any other driver repo. First select exact product target (provider registration vs Vulkan ICD vs true OS-visible virtual adapter), inventory code and WDK/VM prerequisites, write device/authority/driver trust boundary and acceptance tests. For Windows GPU appearance goal, establish WDK and isolated Windows driver-test environment before prototyping a software-only render adapter with compliant interfaces. Android and Apple require independent platform-specific registration surfaces; do not claim parity from Windows prototype.

## Governance and evidence
Read-only host and repo inspection; no production GPU driver, Windows security, INF installation, phone runtime, or J-7 Apple modifications. No canonical Formula execution receipt or Learning Ledger update.
