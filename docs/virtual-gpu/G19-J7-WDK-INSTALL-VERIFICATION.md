# G19 J-7 WDK installation and verification

Official build-tool installation was covered by the existing contributor-note authorization. Winget installed Microsoft's Windows Driver Kit 10.1.26100.6584; the downloaded installer hash was verified by winget before setup. The installed pair matches Visual Studio 2022 Build Tools and Windows SDK 10.0.26100.0.

Verified after installation:

- km/wdm.h is present.
- WindowsDriver.Common.targets is present.
- InfVerif.exe reports version 10.0.26100.6584, its Authenticode signature is valid and names Microsoft Corporation, and InfVerif /? exits 0.
- No GPU driver was built or installed; no test-signing/security setting or OS feature changed; no reboot occurred.

The driver-validation environment remains open. This machine runs Windows 11 Home, where Microsoft's Client Hyper-V feature is unavailable; local checks also found no vmms service, Hyper-V Get-VM, VMware, or VirtualBox. WSL/Docker do not constitute an isolated Windows guest for WDDM driver testing. See [Microsoft's Windows 11 feature requirements](https://learn.microsoft.com/en-us/windows/whats-new/windows-11-requirements) and [Hyper-V installation requirements](https://learn.microsoft.com/en-us/windows-server/virtualization/hyper-v/get-started/install-hyper-v).

Machine-readable verification: `evidence-staging/native-gpu-readiness-g19/wdk-install-verification.json`, SHA-256 `e7a417121fb36116fe2ad30f150a1cbe3b6662f99323ab18b78e9d9aee77edc4`.

Status: **WDK TOOLCHAIN READY FOR SOURCE BUILDS; ISOLATED DRIVER TEST GATE NOT READY**. The native OS LeeWay GPU is not enumerated.
