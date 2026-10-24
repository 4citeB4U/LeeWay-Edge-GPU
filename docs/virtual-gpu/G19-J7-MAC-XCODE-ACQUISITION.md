# G19 J-7 Mac host and Xcode acquisition log

**Observed:** 2026-10-16T21:41:47.924305+00:00 UTC
**Owner:** J-7 — Apple iPhone / Metal lane
**Current gate:** **BLOCKED BEFORE XCODE DOWNLOAD** because no accessible Mac host is registered or configured.

## Assignment and scope

The latest ownership correction in `docs/virtual-gpu/G19-J5-WINDOWS-SAMSUNG-J7-APPLE-OWNERSHIP.md` assigns Apple iPhone/Metal to J-7 and Windows/Samsung to J-5. J-7 acknowledges. The Creator directed this work to focus on Mac/toolchain acquisition and document each action.

## Checks performed

1. Local OS query: `Microsoft Windows 11 Home`, version `10.0.26200`, build `26200`; this is not a macOS host.
2. Remote Desktop Commander inventory: one online machine, `Agent-Lee` (the Windows workstation); no Mac host.
3. SSH discovery: user SSH config file not found. No SSH target was configured or guessed.
4. Tool discovery: `xcodebuild`, `xcrun`, and `swift` are absent from PATH.
5. `winget search --name Xcode --source winget`: no package found. Xcode acquisition is through Apple's developer channels for compatible macOS; an Xcode package cannot be installed or used on this Windows host. Apple lists host requirements at [Xcode system requirements](https://developer.apple.com/xcode/system-requirements).
6. `winget search/show` found Apple's official Microsoft Store **Apple Devices** app, product `9NP83LWLPZ9K`. `winget install` reported it was already installed at **1.1540.24088.0**, with no available upgrade. No download or package change occurred.
7. The existing Apple Devices app was launched. Processes `AppleDevices`, `AppleMobileDeviceLauncher`, and `AppleMobileDeviceProcess` were observed. The UI was not inspected and no trust prompt was accepted. This Windows utility does not provide Xcode or Metal.

## Evidence state

- Mac host present/reachable: **NOT FOUND**.
- macOS version and Apple Silicon/Intel identity: **UNAVAILABLE**.
- Xcode/Metal SDK download/install: **NOT STARTED**, since no Mac is available and the current host cannot run it.
- iPhone development pairing/trust: **NOT VERIFIED**.
- Apple Devices for Windows: **ALREADY INSTALLED; LAUNCHED**.
- Native Metal build, command submission, readback: **NOT EXECUTED**.

No Mac VM was created, no unofficial Xcode package was used, no credentials were accessed, and no phone trust/app/model state was changed.

Machine-readable evidence: `evidence-staging/native-gpu-readiness-g19/mac-host-discovery-20261016/mac-host-discovery.json`
SHA-256: `033b9452ad4664f8108e84392620f3640375ec567a4fd253b1b43bb0d04a7ec1`

## Gate to resume

Make a compatible Mac reachable through the authorized device/remote-shell mechanism. Then inspect macOS version, select the matching supported Xcode release, download from Apple, verify install/version, and pair the iPhone through the normal trust flow. Only then begin the native Metal probe and physical dispatch/readback tests.

## 2026-10-16 continuation recheck

**Observed:** 2026-10-16T21:43:16.0130415Z UTC. The active device inventory again contains only Agent-Lee (online Windows workstation). No compatible Mac is registered or reachable. Xcode version selection remains deferred until a Mac's macOS version and hardware are observed; Apple changes the compatible release matrix over time.

**Official acquisition routes checked:** [Xcode on the Mac App Store](https://apps.apple.com/us/app/xcode/id497799835), [Apple Developer downloads](https://developer.apple.com/download/), and [Xcode system requirements](https://developer.apple.com/xcode/system-requirements). These routes require an accessible compatible Mac for installation/use. No Xcode download was started because the only available host is Windows; no package or device was changed.

**LeeWay session check:** canonical skills source 881a36235a8216056383b5a25e1846983117d20a, 493 skills; Formula and Notebook health endpoints responded. The session check reports PARTIAL_UNTIL_TASK_SPECIFIC_RUNTIME_GATES_VERIFIED; Formula task evaluation remains NOT_EXECUTED. This health response does not change the Mac blocker.

**Gate:** BLOCKED_BEFORE_XCODE_DOWNLOAD. Resume when a compatible Mac is added to the authorized device inventory or otherwise made reachable through an approved remote-shell/device adapter. Then record Mac model, macOS version, storage, and iPhone connection; choose the matching Apple Xcode release; download from the official route; verify signature/version and xcodebuild -version; only then compile and run the Metal dispatch/readback probe.

Machine evidence updated: `evidence-staging/native-gpu-readiness-g19/mac-host-discovery-20261016/mac-host-discovery.json`. SHA-256: `b4eea7a9ee27775c42bad8212073197527626b863a549bf2faa577a38b52078e`.


## Scope correction — Windows iPhone developer transport verified

The prior Mac-only gate applies to acquiring/running Xcode. It is not a blocker for paired iPhone inspection: J-7 installed isolated Windows tooling and verified USB usbmux + authenticated Lockdown access to the iPhone 11. Developer Mode reports DISABLED; iOS refused remote enablement because the phone has a passcode set. The owner must enable Developer Mode and confirm after restart on the device. See docs/virtual-gpu/G19-J7-IPHONE11-WINDOWS-DEV-ACCESS.md for current evidence. Xcode/build and Metal execution remain separate gates.
