# G19 J-7 — iPhone 11 Developer Access from Windows

**Observed:** 2026-10-16T21:50:45.5552598Z UTC  
**Owner:** J-7 — Apple iPhone / Metal lane  
**Current gate:** **DEVELOPMENT-PAIRING TRIGGER NOT VERIFIED; OWNER ACTION REQUIRED ONLY IF/WHEN THE SETTING APPEARS**

## Correction to the earlier Mac-only assumption

The earlier Mac acquisition checkpoint was too broad when it treated an accessible Mac as necessary before any iPhone developer work. The current Windows host can communicate with the physically connected iPhone 11 through Apple's existing usbmux/Lockdown path. A Mac is not required for this device inventory, paired Lockdown access, or Developer Mode status query. Xcode project build/signing and actual Metal app qualification are separate gates and remain unproven here.

## Existing contributor evidence recovered

The Device Bridge C3 notes already identify the iPhone 11 and its Windows Apple USB stack. They also state the distinction I missed: Windows PnP/WMI observation is not authenticated developer-service execution. The reviewed transport gate is in E:\LeeWay-Work\device-bridge-c34-build\docs\C3-INDEPENDENT-ADMISSION-BINDING-REVIEW-20261014.md: the prior listener on 127.0.0.1:27015 alone did not prove a Lockdown handshake. The related C3 audit reports an iPhone 11 descriptor read, not GPU or Metal execution. These records supersede the generic-device wording in the earlier Edge GPU discovery note for identity only; they do not themselves establish Developer Mode.

## Windows setup and live result

- Installed pymobiledevice3 **11.33.1** into an isolated per-user Python virtual environment. pip check passed. It did not install Xcode and did not alter Apple drivers.
- pymobiledevice3 usbmux list: **PASS**; USB device observed as iPhone 11 (iPhone12,1), iOS 17.6.1, build 21G93.
- pymobiledevice3 doctor: **PASS for connection**; usbmux reachable, one USB device, Lockdown connection opened, existing pair record recognized. The pair record's key material was not read or copied.
- amfi developer-mode-status: **DISABLED**.
- amfi reveal-developer-mode: command returned exit 0. The system acknowledged the reveal request; phone UI visibility was not independently observed. This must not be reported as making the setting visible.
- amfi enable-developer-mode: **BLOCKED** with Cannot enable developer-mode when passcode is set. The phone did not reboot. I did not read or handle the passcode.
- mounter list: empty; no developer image is mounted. No developer command or Metal submission was run.

## Corrected diagnosis after owner reports the setting is absent

The owner reports that **Settings → Privacy & Security contains no Developer Mode entry**. That direct report supersedes the prior instruction to toggle it there. Apple documents that the entry appears only after development pairing is initiated, or if the device was previously paired to a Mac. The verified Windows pairing here is USB/usbmux/Lockdown pairing; it does not establish Apple's Xcode/Device Hub development-pairing trigger. Therefore, the missing entry is consistent with current evidence, and the AMFI reveal acknowledgement does not resolve it.

The next correct trigger is Apple's development pairing flow using Xcode Device Hub on a Mac: connect/trust the iPhone, select it as a run destination or initiate pairing, then check Settings again. This is the required Mac/Xcode bridge for surfacing the control, not a claim that the Mac is needed for ordinary Windows USB inventory. If no Mac is presently available, the setting's appearance remains blocked; do not repeat the same Settings instruction or try to bypass the phone passcode. Once the entry appears, the owner enables it, accepts restart, then confirms Enable and enters the passcode on-device. Only after a fresh status query reports enabled should Windows developer-service tunnel/DDI and Metal tests proceed.

Preserve separate acceptance for a signed Metal test app, actual MTLDevice command queue submission, buffer readback, physical GPU identity, and verifiable receipt.

Apple's Developer Mode documentation states both the development-pairing visibility condition and the on-device restart/confirmation steps: https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device/ . Apple's Device Hub documentation covers initiating development pairing: https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices . The pymobiledevice3 project documents Windows installation, usbmux/Lockdown connectivity, and iOS 17+ userspace developer tunnels: https://github.com/doronz88/pymobiledevice3/blob/master/docs/installation.md and https://github.com/doronz88/pymobiledevice3/blob/master/docs/guides/ios17-tunnels.md .

Machine evidence: evidence-staging\native-gpu-readiness-g19\apple-iphone-developer-access-20261016\iphone11-windows-developer-access.json  
SHA-256: cd10949f48d7f021358117d9e919a5e248963bc1d1643e916865dd492e4c8a2c

**No native Metal app was built or executed.** This checkpoint proves Windows-to-iPhone developer transport and locates the exact device confirmation gate; it is not GPU execution evidence.

## G19 continuation — owner supplied device passcode; Mac availability rechecked

**Observed:** 2026-10-16 (client date). The Creator authorized use of the iPhone passcode for this development task. The passcode was not copied into commands, files, logs, or receipts. No attempt was made to circumvent iOS's on-device confirmation. The prior Windows `amfi enable-developer-mode` attempt remains blocked by the tool's explicit policy when a passcode is set; this is not resolved by having the passcode in chat. The supported iOS flow still requires the owner to confirm Enable and enter the code directly on the iPhone after restart.

Remote Desktop Commander was rechecked: the only online host is Agent-Lee (Windows); no Mac host is available. Existing acquisition notes also show no Xcode or `xcodebuild` on this Windows machine. Therefore, Apple's documented development-pairing trigger cannot currently be initiated here. Current state remains **BLOCKED: no reachable Mac/Xcode Device Hub**, with Developer Mode disabled and the Settings entry absent per Creator report. No phone setting changed, reboot occurred, app installed, or GPU work executed during this continuation.

Next supported sequence when a Mac/Xcode host is reachable: connect and trust iPhone in Xcode Device Hub; select it as a run destination/initiate development pairing; recheck Settings > Privacy & Security; Creator toggles Developer Mode and completes restart plus on-device confirmation/passcode; re-query status over Windows; then continue developer tunnel/DDI and signed Metal dispatch/readback evidence. Do not ask the Creator to repeat a credential in chat; any passcode prompt is handled on-device.
