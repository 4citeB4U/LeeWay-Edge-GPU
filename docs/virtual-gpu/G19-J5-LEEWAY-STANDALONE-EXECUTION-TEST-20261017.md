# G19 J-5 — LeeWay standalone GPU execution and independence gate

2026-10-17. Creator directed a real test of **LeeWay GPU only** as standalone, enhance if not independently working. J-5 read current contributor ledger and tested actual LeeWay repository, not a repeat of the Fold6 Adreno-only kernel.

## Real LeeWay software-defined GPU component test

- Ran `npm run build`: 23/23 source syntax checks PASS, not native driver compilation.
- Ran `node tests/virtual-gpu/local-acceptance.mjs --evidence E:\LeeWay-Work\evidence-staging\g19-leeway-standalone-20261017`: process exited 0; outcome `PASS_LOCAL_COMPONENT_TESTS`, 47/47 passed; WebGPU physical adapter `intel`, architecture `xe-lpg`, `isFallbackAdapter:false`. Isolated browser and loopback test; real hardware-backed WebGPU execution through the LeeWay component.
- Ran `node --test tests/virtual-gpu/tensor-unit.test.mjs`: 18/18 PASS including refusal of denied fallback, comparison mismatch and cancellation, but injected failure scenarios do not prove real hardware loss or deployed governance.
- Ran new `contracts/g19-standalone-gpu-acceptance.test.mjs`: 6/6 PASS. Contract `g19-standalone-gpu-acceptance.mjs` separates component-level LeeWay-dispatch success from OS-native independent GPU acceptance; rejects CPU fallback and misattribution of an Adreno-only native kernel to LeeWay; returns `NOT_VERIFIED` absent native provider, OS enumeration, LeeWay provider-owned dispatch/readback and canonical receipts. Even fully asserted input values only produce `READY_FOR_INDEPENDENT_ACCEPTANCE`, not final PASS.

## OS hardware check

Read-only WMI `Win32_VideoController` lists **Intel(R) Graphics** driver `32.0.101.8724` and **NVIDIA GeForce RTX 5060 Laptop GPU** driver `32.0.15.9201`. No separately enumerated LeeWay GPU in this controller inventory. This is a bounded OS query, not a proof that no non-display compute device could exist anywhere.

## Result and engineering boundary

`LEEWAY_SOFTWARE_GPU_EXECUTION_COMPONENT_PASS`; `LEEWAY_STANDALONE_OS_GPU_NOT_VERIFIED`.

Current `README.md` expressly calls the project software-defined tensor/graphics research, not an installed WDDM device, Vulkan ICD or virtual PCI adapter. The passing LeeWay browser compute uses Intel physical GPU via WebGPU. Physical Fold6 Adreno 750 Vulkan 256/256 proof exists separately and does NOT qualify an independent LeeWay OS adapter or LeeWay model inference. G19 canonical Formula, Runtime Fabric, Device Bridge, LDWMD, Continuum and Veritas correlation remain open.

## Smallest next enhancement

Establish a platform-neutral LeeWay compute provider identity and explicit device model; build and test an actual native provider/adapter boundary (Windows WDDM/UMD in isolated guest if the product truly requires OS display/compute enumeration, or a user-mode WebGPU/Vulkan provider if standalone service/interface independence rather than a separate physical/OS GPU is intended). Prove physical adapter/driver provenance, compute submission and readback through LeeWay's own native provider, request-scoped authority/receipts, lifecycle/cancellation and device isolation. Do not bypass the physical GPU dependency; a virtual GPU service necessarily uses hardware, CPU or remote compute underneath. No host driver installation, security change or production replacement was authorized or attempted.

No phone or Voice Fabric mutation, model installation, inference, Apple J-7 work or Git commit/push.
