# LeeWay software graphics — native pixel backend

LEEWAY HEADER — DO NOT REMOVE

**What is implemented:** A real first-party BGRA8 software framebuffer library. It clears, clips filled rectangles, copies opaque pixels between separately owned surfaces, and returns packed independent readback. It executes on the host CPU without a discrete graphics board or external graphics inference engine. It does not create resources or hold owner authority: the caller supplies appropriately admitted, borrowed memory spans, allowing the original LDWMD to remain the memory owner.

**What is not implemented:** Windows WDDM kernel/user-mode driver, OS adapter enumeration or installation, 3D shader/raster pipeline, Direct3D UMD, desktop compositor, movie decoder, gaming conformance, or model inference. The component must never be presented to Windows as a recognized GPU simply because its DLL or service exists. The implementation is a native rendering prerequisite, not the completed OS registration feature.

Build on Windows with the existing Visual Studio Build Tools and CMake, from a separately checked-out LeeWay repository:

```powershell
cmake -S native/windows/software-gpu -B build/leeway-swgraphics -G "Visual Studio 17 2022" -A x64
cmake --build build/leeway-swgraphics --config Release
ctest --test-dir build/leeway-swgraphics -C Release --output-on-failure
```

Release qualification still requires a **real software-only WDDM adapter driver** (not a friendly name, monitor-only indirect display driver, dummy INF, or Microsoft WARP claiming LeeWay ownership), source-pinned driver and WDK toolchain, isolated Windows driver test host, installation rollback, PnP + DXGI enumeration, actual command submission/readback on that adapter, and independently verified governed LeeWay Runtime receipts. No host driver or system graphics settings are modified by this library.
