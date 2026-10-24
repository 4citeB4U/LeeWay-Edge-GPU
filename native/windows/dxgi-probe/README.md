# LeeWay Windows native DXGI–PnP adapter correlation

LEEWAY HEADER — DO NOT REMOVE

**Function:** This component reads the real Windows display adapter interface inventory, opens each interface through the documented graphics-kernel adapter thunk, then compares its LUID against actual DXGI adapter enumeration. The matching PnP instance ID is obtained from SetupAPI, not guessed from the friendly name. This supplies missing OS-detection evidence for the LeeWay Windows software GPU milestone.

**Already implemented:** Native C++ Win32 x64 application using SetupAPI, Dxgkrnl D3DKMT, DXGI and Config Manager. It reports read-only JSON with exact PnP instance, running-device status, service identity and DXGI LUID. The LeeWay classifier separately correlates VideoController and running graphics system-driver identity; it cannot claim OS recognition on a name alone or accept DXGI entries without native-mapping evidence. No external inference or vendor compute path is used.

**Not implemented:** Windows WDDM KMD/UMD, GPU device creation or installation, independent command/readback on an OS-enumerated LeeWay adapter, protected Runtime grant, certified driver signing. Existing physical adapters are listed *only to validate the correlation method* and are never treated as the LeeWay compute backend.

Build on a Windows development machine:

    cmake -S native/windows/dxgi-probe -B build/dxgi-pnp -G "Visual Studio 17 2022" -A x64
    cmake --build build/dxgi-pnp --config Release

To connect to LeeWay's existing read-only Windows admission probe:

    $env:LEEWAY_DXGI_PNP_PROBE = (Resolve-Path build/dxgi-pnp/Release/leeway_dxgi_pnp.exe).Path
    node tests/virtual-gpu/windows-adapter-qualification.mjs "$env:TEMP/leeway-adapter-qualification.json"

A passing correlation test is a **measurement capability**, not an OS-recognized LeeWay GPU. Windows GPU registration remains blocked until a complete genuine WDDM software KMD/UMD package executes submitted commands on a recognized LeeWay adapter in an isolated test host with independent evidence.
