# G19 J-5 Fold6 model-locality gate

2026-10-16. Read-only device/source investigation and local fail-closed contract tests. NO MODEL EXECUTED.

## Discovery and corrected interpretation
- The installed Fold6 Pocket application is debuggable for its own UID: `adb shell run-as industries.leeway.pocket pwd` returned `/data/user/0/industries.leeway.pocket`; inspected its `files` directory (only `profileInstalled`) and `no_backup` listing (brain upgrade receipt and voice test). No local model weight was found in these specific directories. No permission bypass, private credentials or pairing token read.
- Pocket source `ModelsActivity.kt` calls `UnifiedAgentLeeRuntime(applicationContext).modelInventory()`; `UnifiedAgentLeeRuntime.kt` implements modelInventory as `pairedRequest("/models/inventory", JSONObject(), 10000)`, to a paired endpoint. Thus this Models UI is a paired-PC model catalog, NOT proof of a phone-local LLM. The source uses a paired transport and does not demonstrate a phone-local model execution provider.
- Phone source `NativeVoiceDecoder.kt` uses `onnxruntime-android-cpu` for voice; source-level presence does not qualify a local LLM or Adreno GPU compute. Qualcomm Adreno Vulkan library exists, but no actual Vulkan inference/readback has been qualified.
- `G19-J7-WINDOWS-DISCOVERY.md` confirms J-7 ACK of Windows lane and identifies gemma4:e4b as largest bounded installed conversational model; larger LTX-2.5 video weights excluded from chat model test pending separate owner interpretation. J-7 requests J-5 help with Formula/Runtime grant, Device Bridge, LDWMD, Continuum and Veritas owner boundaries.

## Implemented J-5 guard
`contracts/g19-model-locality.mjs` refuses to admit paired-PC inventories and cross-device execution as phone-local, and requires a digest plus model/runtime observation identifiers. `contracts/g19-model-locality.test.mjs` has 5 tests. Combined with G18 contract 10 tests: 15/15 PASS. A passed local claim is labeled `DEVICE_LOCAL_CLAIM_ADMITTED_NOT_EXECUTION_VERIFIED` until actual GPU inference + Veritas qualification.

## Next gates and handoff
J-5: locate an explicitly authorized phone-local model/runtime (including other apps only through supported interfaces), then qualify Android Vulkan compute and measured residency independently. Do not repurpose paired-PC model inventory. In parallel assist J-7 with the provider-facing device/observation contract and common evidence fields; canonical GPU verifier remains missing.
J-7: review locality guard and keep Windows chat-model candidate distinct from on-disk video model weights. Do not submit ungoverned Ollama inference as the accepted LeeWay test. Report blockers to J-5 and record ACK.

No installs, model inference, phone screen change, reboot, Git commit/push or host driver changes made.
