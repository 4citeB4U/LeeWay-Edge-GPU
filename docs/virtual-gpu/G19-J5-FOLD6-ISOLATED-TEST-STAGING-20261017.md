# G19/J5 — Fold6 isolated Vulkan test staging (2026-10-17)

## Scope
Owner authorized beginning the controlled direct Adreno inference test. Preserve Pocket/Voice and prior native llama install; no replacement or cleanup of existing components.

## Inspected and verified
- ADB target: Samsung SM-F956U; attached and ready.
- `adb shell df -k /data/local/tmp`: 102,589,056 KiB available (~97.8 GiB).
- Dedicated test path `/data/local/tmp/g19-fold6-vulkan-test` did not exist before this action.
- Local GGUF `E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\SmolLM2-360M-Instruct-Q8_0.gguf`, 386,405,280 bytes, SHA-256 `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b`.
- Publisher file URL: https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/blob/main/SmolLM2-360M-Instruct-Q8_0.gguf ; displayed SHA-256 matches local hash.

## Mutations actually executed
1. `adb shell mkdir /data/local/tmp/g19-fold6-vulkan-test` — successful; ownership shell:shell observed.
2. `adb push E:\LeeWay-Work\evidence-staging\g19-android-vulkan-llama\SmolLM2-360M-Instruct-Q8_0.gguf /data/local/tmp/g19-fold6-vulkan-test/` — succeeded, 386,405,280 bytes.
3. `adb shell sha256sum /data/local/tmp/g19-fold6-vulkan-test/SmolLM2-360M-Instruct-Q8_0.gguf` — returned `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b`. Verified identical to host and publisher.
4. Initiated `gh run download 39057469074 --repo 4citeB4U/LeeWay-Edge-GPU --name g19-fold6-arm64-vulkan-build --dir E:\LeeWay-Work\evidence-staging\g19-fold6-ci-artifact` on PC. At checkpoint, remote process PID 39168 returned no completion and no artifact files were visible. **Download remains UNVERIFIED**; do not claim the candidate has been staged or run.

## Runtime and acceptance
- Prior `/data/local/tmp/leeway-llama/llama-b11118` left intact.
- Verified G19 CI artifact (run 39057469074, artifact 12110142610) not yet confirmed available on host through this staging attempt.
- Android linker check: NOT EXECUTED.
- Direct physical GPU model generation: NOT EXECUTED.
- LeeWay same-engine inference: NOT EXECUTED.
- Performance: NOT MEASURED.
- Veritas runtime receipt: NOT CREATED; Learning Ledger: NOT UPDATED.

## Safe rollback
Only newly owned path `/data/local/tmp/g19-fold6-vulkan-test` is in scope for any explicitly authorized rollback. Never delete the older `/data/local/tmp/leeway-llama` or Pocket/Voice files. No rollback performed in this checkpoint.

## Next gate
Resolve GitHub artifact download status, verify nested tarball against `d4ec04a7326bfcddae52f8a637f784ebd6effbc4bb2d9b70887998c122534761`, then stage the matching G19 native binaries to the isolated phone directory; re-hash and conduct linker/GPU test.
