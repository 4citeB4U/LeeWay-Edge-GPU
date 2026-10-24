# LeeWay Windows WDDM driver — source integration milestone

LEEWAY HEADER — DO NOT REMOVE

**Status: WDK typed KMD entry-point COMPILED; no working Windows GPU adapter registered.**

This folder contains a real WDK-typed `DriverEntry` structural source proving compilation against the installed Windows graphics-kernel ABI. The source intentionally returns `STATUS_NOT_SUPPORTED` before any graphics-kernel activation. Its `DxgkDdiAddDevice` refuses all devices. It cannot operate as a WDDM GPU driver and should never be given a real device binding or `.inf`.

`build-bootstrap.ps1` auto-discovers the installed Visual Studio C++ compiler and newest WDK headers, compiles one kernel-mode object with `/W4 /WX /kernel`, and stores it outside the repository. It does **not** link a `.sys`, install, register, alter test-signing, or reboot.

## Required before authentic WDDM registration

- Implement all appropriate mandatory WDDM miniport DDIs, graphics-kernel device lifecycle, allocation/residency, context and device ownership, scheduling, fence/interrupt completion, reset/TDR, paging, child topology, power transitions, and isolation.
- Implement a real Direct3D user-mode display driver (UMD) that binds the command ABI and LeeWay original LDWMD leased buffers under Runtime Fabric and independent Veritas evidence.
- Choose the correct driver class: `Display` WDDM for a genuine Windows display/graphics adapter; Microsoft Compute Driver Model `ComputeAccelerator` for a narrower compute-only device. The two have different visibility and compliance. A software-only service and a display-only virtual monitor are **not** substitutes for either.
- Supply authentic software-device PnP enumeration/ownership, supported protected signing and packaging, matched WDK toolchain, Driver Verifier/HLK checks as applicable, and an isolated sacrificial Windows driver test machine or VM.
- Demonstrate **actual** PnP + DXGI correlation and Direct3D command, fence, readback, reset, unload/recovery, then separately cross-check canonical Veritas/Continuum/ledgers. Test on supported Windows images with rollback before any main-device installation.

## Current verified boundaries

- User-mode software raster execution and borrowed framebuffer: merged GPU PR #14.
- Request-correlated pointer-free command packets and checked fences: merged GPU PR #15.
- Actual Windows WDK types: compile-only bootstrap here.
- WDDM miniport working: **NO**.
- D3D UMD working: **NO**.
- Device enumerated by Windows: **NO**.
- Isolated WDDM installation validation: **NO**.

The original `leeway.gpu.service` is a standalone LeeWay application endpoint, not an operating-system graphics driver. None of its earlier Formula/LDWMD/model tests implies WDDM registration.
