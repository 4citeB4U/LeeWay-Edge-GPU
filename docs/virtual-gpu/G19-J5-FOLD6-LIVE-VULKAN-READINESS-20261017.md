# G19/J5 Fold6 Live Vulkan Readiness — 2026-10-17

## Authority
Read-only owner-authorized inspection of the connected Fold6 via Desktop Commander and ADB. No installation, phone mutation, GPU inference, or production merge.

## Live observed commands and results
- `adb devices -l`: one connected device, serial withheld from this report; model `SM_F956U`, device `q6q`, ADB state `device`.
- `adb shell getprop ro.product.model` => `SM-F956U`.
- `adb shell getprop ro.build.version.release` => `17`.
- `adb shell getprop ro.product.cpu.abi` => `arm64-v8a`.
- `adb shell getprop ro.hardware.vulkan` => `adreno`.
- `adb shell ls -l /system/lib64/libvulkan.so` => present, 291224 bytes.
- `adb shell ls /vendor/lib64/hw/vulkan.adreno.so` => present.
- `adb shell ls -l /vendor/lib64/libvulkan.so` => absent; not a failure because system Vulkan loader and vendor HAL are present.
- Other broad property/feature collection was not completed due tool security blocking. Do not infer results.

## Build cross-reference
Verified CI run 39057469074 produced ARM64 `llama-cli` and `libggml-vulkan.so` with 10/10 matching native file SHA-256 manifests, documented separately in `G19-J5-FOLD6-CI-ARTIFACT-VERIFICATION-20261017.md`.

## Interpretation and gates
- Connected target identity: VERIFIED.
- CPU ABI versus native binary ELF architecture: VERIFIED compatible (arm64-v8a / AArch64).
- System Vulkan loader and vendor Adreno HAL presence: VERIFIED.
- Driver/device Vulkan enumeration and full dynamic linker resolution: UNVERIFIED.
- Exact GGUF availability on the device, application execution sandbox and rollback: UNVERIFIED.
- Direct physical GPU model response: NOT EXECUTED.
- Same-engine LeeWay model response: NOT EXECUTED.
- Veritas GPU receipt and Learning Ledger: NOT CREATED / NOT UPDATED.

## Next smallest action
Perform a read-only inspection of the Vulkan ELF `DT_NEEDED` dependencies and phone driver/API enumeration, compare against the exact verified native build. Verify model availability and device deployment/rollback plan before any separate authorized execution.

## Receipt
Read-only evidence log only; no governed execution receipt or learning update.

## Additional static ELF linkage inspection (same session)
Read-only extraction of the verified CI archive and `readelf -d` on packaged AArch64 files showed `llama-cli` needs: `libllama-cli-impl.so`, `libllama-server-impl.so`, `libmtmd.so`, `libllama-common.so`, `libllama.so`, `libggml.so`, `libggml-cpu.so`, `libggml-vulkan.so`, `libggml-base.so`, plus Android `libm.so`, `libdl.so`, `libc.so`. The packaged `libggml-vulkan.so` needs `libggml-base.so`, `libvulkan.so`, `libm.so`, `libdl.so`, and `libc.so`. Those project libraries are present in the packaged `bin/` directory and `/system/lib64/libvulkan.so` is present on the device. Static dependency inventory PASS; actual Android loader and GPU runtime behavior remain UNVERIFIED.
