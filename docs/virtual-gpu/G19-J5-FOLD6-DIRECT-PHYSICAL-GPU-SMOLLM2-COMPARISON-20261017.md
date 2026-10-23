# G19 J-5 — independent physical Fold6 GPU model inference baseline

Date 2026-10-17. User requested actual benchmark of the SAME model direct on Samsung hardware GPU, without LeeWay's own dispatcher, to compare with prior LeeWay Device Bridge CPU-only run. J-5 read CONTRIBUTORS.md first, no Apple J-7 changes, no Pocket or Voice Fabric changes.

## Apples-to-apples workload
Phone SM-F956U, same `litert-community/SmolLM2-360M-Instruct` model, same exact fixed prompt "A delivery van has 12 packages and delivers 5. How many remain? Answer in one short sentence.", model bytes 373719040, SHA256 `8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e` verified on Windows and in newly isolated GPU baseline app private storage.

CPU (previous): owner-authorized LeeWay Device Bridge LiteRT-LM `Backend.CPU()`, real successful response `12 packages - 5 packages delivered = 7 remaining.`; engine generation elapsed 9491ms, whole probe 9791ms. CPU test app itself is a LeeWay orchestrating wrapper over LiteRT-LM, **not** a custom processor nor a LeeWay performance speedup claim.

GPU (new): independent minimal Android app `org.g19.fold6.physicalgpubaseline` deliberately does NOT call LeeWay Runtime Fabric, Device Bridge or dispatcher. Same LiteRT-LM version 0.17.1, but explicitly requests `Backend.GPU()`. Project built in isolated staging at `E:\LeeWay-Work\evidence-staging\g19-phone-gpu-baseline\android`; Gradle :app:assembleDebug BUILD SUCCESSFUL. Debug APK signed with Android Debug certificate, APK SHA256 `874b0cce5eafcd9e5d17ec4f12ecd7960b1229d6319bfcb864f92a69ccc6993c`; installed as isolated user-0 package alongside Pocket/Device Bridge. Model hash verified in new app private storage, temporary staging copy removed.

## Actual GPU attempt: FAIL, no model output
Android direct-app receipt:
- backendRequested GPU, leewayDispatcherUsed=false, leewayRuntimeFabricUsed=false
- modelSha256 `8e2834da211b439751af968ed650febdde5a8cb8d88bc6c1a3059f049caa5c2e` and size 373719040
- engineInitElapsedMs 5336; elapsedMs 6755; success false
- errorType `com.google.ai.edge.litertlm.LiteRtLmJniException`
- errorMessage `Status Code: 2. Message: UNKNOWN: Can not find OpenCL library on this device`

Read-only ADB observation: `/vendor/lib64/libOpenCL.so` exists (63,632 bytes); `/system/lib64/libOpenCL.so` and `/vendor/lib64/libOpenCL.so.1` not found at checked paths. Vulkan loader `/system/lib64/libvulkan.so` and Qualcomm ICD `/vendor/lib64/hw/vulkan.adreno.so` exist. Therefore the message is a **GPU runtime library lookup/namespace/compatibility problem**, not proof that the phone lacks any OpenCL implementation or GPU capability. The previously verified standalone physical Adreno 750 Vulkan compute kernel (256/256) remains independent proof that Vulkan GPU computations work. No system lib/loader/security alteration made.

Receipt saved: `E:\LeeWay-Work\evidence-staging\g19-phone-gpu-baseline\fold6-direct-gpu-model-result-20261017.json`; SHA256 `78d4eea2ea3691270747330e169544a1e76f70207b65ab3c04c44e281f82b00b`.

## Correct comparison
CPU completed model inference in 9491ms; GPU produced no model tokens, failing after 6755ms, so no valid CPU/GPU speedup, quality or sustained throughput ratio can be computed. A failed GPU initialization cannot be counted as faster inference.

Next least-risk enhancement: qualify a vendor-supported GPU model runtime with accessible driver binding (or Vulkan backend actually supported by that runtime/model), ensure same exact model and prompt, capture actual GPU dispatch and output under an isolated sandbox. Do not bypass Android linker namespaces, copy privileged vendor binaries or replace GPU drivers.

The separate direct baseline APK and model are retained for owner-authorized follow-up and can be explicitly cleaned up later. All temporary ADB stage artifacts removed (MODEL_STAGING_CLEAN); Pocket, Pocket.test and LeeWay Device Bridge remain installed. No voice activity, Git commit/push, model cloud route, or Apple changes.
