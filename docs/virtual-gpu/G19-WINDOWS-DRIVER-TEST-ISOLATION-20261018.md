# G19 — Windows virtual GPU driver-test isolation qualification — 2026-10-18

## Investigate
Read-only Agent-Lee host inspection reports OS build 26200.9711 via cmd ver. Get-ComputerInfo reports OsBuildNumber 26200 and HyperVisorPresent=True, though its WindowsProductName strings say Windows 10 Home; do not infer precise Windows edition from the inconsistent product label. VirtualMachinePlatform and HypervisorPlatform optional features both InstallState=1. vmcompute service Running; WSL lists Ubuntu and docker-desktop. vmms/Get-VM command not found in inspected host environment. WDK wdm.h and InfVerif were confirmed in preceding checkpoint.

Found Microsoft signtool.exe at C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe (also other architectures and App Certification Kit). It is not in PATH; this is not absence of the tool. No signing operation performed.

## Diagnose
A hypervisor being active and WSL/VM platform enabled is NOT proof of a qualified isolated Windows VM suitable for graphics driver build/install/recovery. VMware/VirtualBox or other VM inventory has not been established; the host lacks the inspected Hyper-V VM management surface. The LeeWay graphics driver (.inf/.sys) and OS-enumerated adapter remain unimplemented/unverified in repository and host checks.

## Test / Validate
Ran read-only Get-ComputerInfo, Get-Service, Get-Command, wsl --list, cmd /c ver, Get-CimInstance Win32_OptionalFeature and filesystem signtool inventory. No VM created or started; no INF validation against a LeeWay driver (none found); no Windows driver installed.

## Next smallest action
Discover already available supported hypervisor/Windows guest tooling and potential test guest without system mutation. If absent, qualify a separate sacrificial Windows test machine/VM and recovery method before writing/attempting an OS graphics driver installation. Document signing and acceptance law: only a registered LeeWay adapter from legitimate provider and demonstrated rendering/compute receives PASS. Continue J-5 Fold6 Q4_K shader correctness separately.

## Governance
No production GPU drivers, OS features, test-signing, Secure Boot, phone or Apple J-7 changes. No canonical Veritas receipt; Learning Ledger unchanged.
