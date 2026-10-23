# G19/J5 handoff reconciliation and next gate — 2026-10-18

## Authority
Creator submitted historical J-5/J-7 notes for review and requested continuation. Verified live Windows source notes: `G19-J5-WINDOWS-SAMSUNG-J7-APPLE-OWNERSHIP.md` and `G19-J5-RECEIPT-V2-J7-HANDOFF.md`. Work remains on isolated review branch; no production merge.

## Ownership (confirmed from on-host notes)
J-5: Windows NVIDIA/Intel, Samsung Fold6 Adreno/Vulkan, GPU evidence, Diagnostics. J-7: Apple iPhone/Metal only. Shared canonical Formula, Runtime Fabric, Veritas requirements remain unchanged. Do not rewrite Apple's work.

## Historical contract developments from supplied transcript
- GPU signed-receipt verifier initial synthetic 6/6; revised signed receipt v2 synthetic 11/11. Synthetic signature cannot authorize production.
- Diagnostics projections reject missing model IDs, inconsistent manufacturer/GPU/source, and unsupported VRAM amounts; LDWMD evidence needed for measured VRAM.
- J-7 reported request/result correlation fields including request, session, model, tokenizer and implementation hashes/IDs; dispatcher contract synthetic tests reported PASS in historical notes.
- Canonical Formula/Runtime grant, trusted Veritas issuer/reader and production Diagnostics binding remained unverified. Historical claims of 'no phone-local inference' were accurate only at the time.

## Newer independent live evidence superseding *only* historical Samsung inference status
- Isolated Fold6 ARM64 Vulkan build from CI run 39057469074; tarball SHA256 `d4ec04a7326bfcddae52f8a637f784ebd6effbc4bb2d9b70887998c122534761`.
- Phone model GGUF SHA256 `c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b`.
- Native Adreno 750 Vulkan device and all transformer layers observed assigned to Vulkan0; local token generation executed.
- Same model/engine 2+2=? GPU generation speed 47.6 t/s and CPU 16.7 t/s, but **both answers failed correctness**. These are not a qualified benchmark or a LeeWay speedup.
- Current connected Fold6 confirmed on 2026-10-18 via ADB. No new inference run in this reconciliation.

## Current gate statuses
- Samsung physical GPU model execution: VERIFIED for model loading/offload/token generation.
- Known-answer correctness GPU+CPU: FAILED on raw prompt, common cause not diagnosed.
- Windows governed GPU inference: UNVERIFIED.
- Canonical Formula/Runtime grant, Veritas signing issuer, receipt replay backend: UNBOUND / UNVERIFIED.
- Live Diagnostics/LDWMD measured allocation: UNVERIFIED.
- LeeWay-vs-direct Adreno performance advantage: NOT MEASURED.

## Next smallest action
Inspect the already approved GGUF chat template and actual llama.cpp CLI conversation wrapping, then run a controlled **correctly formatted** deterministic SmolLM2 prompt under same-engine CPU and GPU. Save commands, generated answers, backend logs, timings and exit codes. Do not bind LeeWay or claim a speedup until correctness passes. In parallel, compare existing J-5 receipt-v2 and J-7 dispatcher correlation structures against *canonical* Runtime Fabric/Veritas interfaces without inventing authority or modifying Apple.

## Receipt
Documentation and read-only local inspection only. No governed Veritas PASS, runtime execution receipt, or Learning Ledger update.
