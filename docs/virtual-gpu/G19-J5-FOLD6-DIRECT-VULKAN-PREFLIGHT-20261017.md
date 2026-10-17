# G19/J5 — Fold6 direct Vulkan inference preflight (2026-10-17)

## Authority / execution boundary
Creator directed continuation of G19/J5. Read-only diagnostics only. No file pushed to Fold6, no executable launched, no production merge, no microphone/voice changes.

## Observed live host/device evidence
- Desktop Commander Agent-Lee ONLINE; ADB one device `SM_F956U` in `device` state.
- `adb shell getprop ro.product.model` => `SM-F956U`.
- `adb shell getprop ro.build.version.sdk` => `37`.
- Existing `/data/local/tmp` was inspected read-only. An earlier `/data/local/tmp/leeway-llama/llama-b11118` install exists. Its `bin/llama-cli` is a pre-existing binary, not evidence of deployment of the new verified G19 CI artifact. **Do not overwrite or reuse as though it were the G19 candidate.**
- Exact GGUF model found at `E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\SmolLM2-360M-Instruct-Q8_0.gguf` with size **386,405,280 bytes**.
- Executed Windows `certutil -hashfile ... SHA256`; command exited zero and reported GGUF SHA-256 **`c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b`**.
- Native G19 CI binaries and archive hashes independently verified previously in `G19-J5-FOLD6-CI-ARTIFACT-VERIFICATION-20261017.md`.
- Fold6 has `/system/lib64/libvulkan.so` and `/vendor/lib64/hw/vulkan.adreno.so` (prior live read-only observation).
- `Get-FileHash` PowerShell cmdlet unavailable in remote shell; recovered with `certutil`, without changing the machine.

## Diagnosis and gate
- Physical Fold6 connection, ABI, Vulkan loader/HAL visibility: VERIFIED.
- G19 build archive and static binary dependencies: VERIFIED in prior inspection.
- Host-side exact GGUF size and computed SHA-256: VERIFIED.
- GGUF's comparison with the original published source checksum: pending independent cross-check if required by deployment authority.
- Whether this exact GGUF is staged on the phone, and whether phone linker can load new G19 executable: UNVERIFIED.
- Direct physical Adreno GPU model inference: NOT EXECUTED.
- LeeWay GPU path: NOT EXECUTED.
- Performance and runtime Veritas: NOT MEASURED.

## Smallest next controlled test
1. Retrieve and check published model source checksum or frozen approved manifest against recomputed local SHA.
2. Confirm isolated phone test directory, storage headroom, device backend enumeration and complete rollback targets, avoiding existing `leeway-llama` directory.
3. With explicit authorized test boundary, stage checksum-verified native binaries and model into a *new isolated directory*, validate file hashes after ADB transfer and resolve loader dependencies. Run direct Adreno inference, record Vulkan GPU offload trace, generated response, timing, memory and thermals; remove only known owned test files on rollback.
4. Only after direct Adreno response PASS, test identical model, binary, decode settings under LeeWay governance. No performance advantage claim beforehand.

## Receipt
READ-ONLY OBSERVATION. No Veritas execution receipt created. Learning Ledger not updated.
