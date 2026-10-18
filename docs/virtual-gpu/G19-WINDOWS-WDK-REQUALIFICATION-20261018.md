# G19 — Windows OS registration prerequisite requalification — 2026-10-18

## Investigate
Read-only inspection of Agent-Lee Windows workstation and existing LeeWay Edge GPU files. 2026-10-16 historical J7 prerequisite report recorded WDK header `wdm.h` and `InfVerif.exe` absent. Fresh check of installed Windows Kits now finds:
- `C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0\km\wdm.h` present.
- `C:\Program Files (x86)\Windows Kits\10\Tools\10.0.26100.0\x64\infverif.exe` present. CLI reports Microsoft INF Verifier 10.0.26100.6584.
- 223 `*.h` files counted in that `km` folder, not a claim of complete WDK qualification.

## Diagnose / reuse-before-build
`native/windows` has `d3d12-compute` prototype and `adapter-contract.mjs` / tests. Repo recursive inventory found no `*.inf`, `*.sys`, or `*icd*.json`. This points to **compute reuse**, but OS registration driver implementation and packaging are **missing** within inspected tree. Existing dirty checkout reports 111 porcelain entries: do not reset or overwrite.

## Test / validate
`node --test native/windows/adapter-contract.test.mjs`: 6 tests PASS / 0 fail. These contracts explicitly reject friendly-name-only GPU claims and correlated enumeration without compute qualification. `InfVerif.exe /?` executed and produced help/version. Tool presence PASS; graphics driver implementation, test VM and adapter enumeration NOT VERIFIED. Earlier historical driver-readiness BLOCKED label now needs updating for *tool presence*, but overall OS registration remains BLOCKED.

## Smallest next implementation
Do NOT install/display-driver prototype on production PC. First qualify isolated Windows driver-test target, kernel-mode toolchain/library linker/signing expectations, and adapter acceptance contract; then choose Microsoft-supported rendering/virtual adapter path. Maintain separate Vulkan ICD and Windows display adapter goals. Physical Fold6 Vulkan Q4_K correctness is independent.

## Governance
Investigate → Diagnose → Plan → Implement (none needed for tool discovery) → Test → Validate → Verify → Evidence. No driver, OS settings, security flags, phone model, J7 Apple modifications. Canonical Veritas receipt not created; Learning Ledger unchanged.
