# G19 J-7 Windows driver prerequisite refresh

Observed: 2026-10-16T20:57:53.6777031Z. Read-only inventory on Microsoft Windows 11 Home, build 26200, x64.

- WDK kernel header km/wdm.h: absent from installed Windows Kits include roots.
- WDK InfVerif.exe: absent from the inspected SDK tool paths.
- vmms and the Hyper-V Get-VM cmdlet/module are unavailable. vmcompute is running and a hypervisor is reported active; WSL lists Ubuntu and Docker Desktop. These facts do not establish an isolated Windows guest suitable for driver validation.
- Win32_Processor reports firmware virtualization and SLAT false while Win32_ComputerSystem reports HypervisorPresent=true. Windows optional-feature inspection requires elevation. This inconsistent host report leaves VM readiness unqualified.
- No driver, OS feature, GPU state, security setting, or device was changed. No WDK was installed. No kernel driver source/build was attempted.

Current gate: **BLOCKED — WDK and isolated Windows driver-test target not qualified**. The existing D3D12 physical-GPU prototype remains independently verified for dispatch/readback but is not an OS-enumerated LeeWay adapter.

Machine-readable observation: `evidence-staging/native-gpu-readiness-g19/windows-driver-prerequisite-refresh.json`, SHA-256 `0aa32606f04c9bae7bc24f2b1fc95411b686cbc64e66ef4bfea9b4d08b0843e5`.
