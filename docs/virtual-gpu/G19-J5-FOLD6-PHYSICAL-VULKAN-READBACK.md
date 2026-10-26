# G19 J-5 Fold6 Adreno physical Vulkan compute/readback — VERIFIED KERNEL ONLY

Date: 2026-10-16. Owner explicitly authorized one temporary transfer/execution of compiled Vulkan test binary and SPIR-V shader on connected Fold6 SM-F956U, capture the device result, and clean up the temporary files. J-7 Apple lane untouched.

## Scope and independently correlated artifacts

- Windows local Android ARM64 executable `E:\LeeWay-Work\evidence-staging\g19-android-toolchain\arm64-build\leeway-g19-vulkan`, SHA-256 `2dbb0dd664f1fcf30a30b757dbce3c7b1382494477473f6f73ee152c7f03c704`.
- Windows compiled and validated SPIR-V `E:\LeeWay-Work\evidence-staging\g19-android-toolchain\shader.spv`, SHA-256 `5cf00af46ec92dcff403bb58fbe9acc5c3f68e364b0e4331a924198d5de6f0a5`.
- Both same SHA-256 values were returned by the phone's own `sha256sum` after ADB transfer.
- Temporary device path only: `/data/local/tmp/leeway-g19-probe/`. No APK installed, Pocket runtime changed, system settings altered, or Voice Fabric used.

## Actual on-phone Vulkan execution

Device `SM-F956U` was confirmed connected. Exact captured probe stdout:

```json
{"adapter":"Adreno (TM) 750","vendorId":20803,"deviceId":1124406273,"apiVersion":4206720,"elements":256,"mismatches":0,"scope":"VULKAN_PHYSICAL_GPU_KERNEL_ONLY"}
```

Shell reported `G19_PROBE_EXIT_CODE:0`. The native probe chooses only a Vulkan physical device with Qualcomm vendor ID `0x5143` and compute-capable queue, dispatches 4x64 uint32 shader invocations, waits for the Vulkan fence, maps the output buffer and verifies each against the host reference `(i*17u)^0x5A5A1234u`. Zero mismatches confirms this physical compute kernel and readback, **not actual language-model inference**, memory pressure, throughput, canonical Formula, Runtime Fabric, LDWMD, Continuum or Veritas authority. No separately enumerated LeeWay OS GPU is proven.

## Cleanup verified

After collecting stdout and exit code, both test files were removed and the temporary directory removed. Subsequent `adb shell` verification printed `G19_CLEANUP_VERIFIED` and exited 0. No lasting probe files left in the designated directory.

## Qualification state

`PHYSICAL_ADRENO_VULKAN_KERNEL_READBACK_PASS` for this one bounded 256-element test. `LEEWAY_MODEL_INFERENCE_NOT_EXECUTED`; `CANONICAL_RUNTIME_FABRIC_GRANT_UNBOUND`; `LEEWAY_OS_NATIVE_GPU_NOT_VERIFIED`. The evidence is from physical device execution but is **not a canonical Veritas-signed receipt**. Windows driver and J-7 Apple remain separate open lanes.
