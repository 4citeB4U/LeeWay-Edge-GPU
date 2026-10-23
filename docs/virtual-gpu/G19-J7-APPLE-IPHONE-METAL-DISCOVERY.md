# G19 J-7 Apple iPhone Metal discovery

Observed: 2026-10-16T21:33:57.026778+00:00. Status: **DISCOVERY COMPLETE; METAL QUALIFICATION BLOCKED ON APPLE BUILD/TEST HOST**.

## Creator direction

On 2026-10-16 the Creator corrected the active mobile GPU focus to the Apple iPhone. This supersedes the previous Fold6-first mobile discovery priority for current work. Existing Fold6 evidence is retained as historical evidence and does not satisfy the newly directed Apple-phone lane.

## Evidence

Windows Plug and Play reports a present WPD device named **Apple iPhone**, manufacturer Apple, Inc., with USB vendor ID 05AC and product ID 12A8. Device serial was deliberately not recorded. This probe does not reveal the specific iPhone model or iOS version, and pairing/trust was not tested. The phone filesystem and app-private data were not accessed.

A follow-up host probe reconfirmed the iPhone PnP device and found no matching Apple Mobile Device/usbmux service, `xcrun`, `xcodebuild`, Swift, or libimobiledevice commands. Apple Devices for Windows is already installed (version 1.1540.24088.0, Apple Inc.); winget found no upgrade. The app was launched and its processes are running, but its UI was not inspected and no trust prompt was accepted. The current-user AppX query returned no match and the all-users query returned access denied, so package identity came from winget. Remote Desktop Commander lists only this Windows workstation; no qualified Mac is available. No iOS/Metal project source was found in the inspected workspace roots.

Apple's Metal API uses an `MTLDevice` and its command queue to submit command buffers to that GPU ([Getting the default GPU](https://developer.apple.com/documentation/metal/getting-the-default-gpu), [MTLCommandQueue](https://developer.apple.com/documentation/Metal/MTLCommandQueue)). A hardware qualification therefore requires an iOS app build and on-device dispatch/readback; this Windows host cannot perform that acceptance.

## Gate state

- Physical iPhone presence: **OBSERVED** (Windows PnP only).
- Specific iPhone/GPU identity, iOS version, and Device Bridge pairing: **NOT VERIFIED**.
- Metal device enumeration, command submission, and readback: **NOT EXECUTED**.
- Phone-local model/runtime and inference: **UNKNOWN / NOT EXECUTED**.
- Formula/Runtime Fabric authorization, LDWMD, Continuum, canonical Veritas, and Diagnostics binding: **BLOCKED / UNBOUND**.
- LeeWay OS-native second GPU registration: **NOT CLAIMED**.

No phone files changed; no app launched or installed; no trust prompt accepted; no inference executed.

Machine-readable observation SHA-256: `f90fc287991004cfc44a232b8cf4567fb61d337b9d0c3e244d5f809f6dc317fe`.

## Superseding Windows developer-access checkpoint — 2026-10-16

J-7 corrected the earlier transport conclusion. Native Windows pymobiledevice3 11.33.1 now enumerates the connected iPhone 11 over USB and opens an authenticated Lockdown connection using the existing trusted pairing record. Exact device observed: iPhone 11 product type iPhone12,1, iOS 17.6.1 (21G93). Developer Mode is **DISABLED**. The tool's reveal-option request returned exit 0 (screen visibility not visually verified). Enable request was refused by iOS because a device passcode is set; no reboot occurred. No developer image is mounted, developer command or Metal dispatch/readback ran. Full record: docs/virtual-gpu/G19-J7-IPHONE11-WINDOWS-DEV-ACCESS.md; machine evidence SHA-256 cd10949f48d7f021358117d9e919a5e248963bc1d1643e916865dd492e4c8a2c. This supersedes the earlier claim that no developer-service route was available from Windows. It does not qualify an iOS GPU provider or a Mac/Xcode build.
