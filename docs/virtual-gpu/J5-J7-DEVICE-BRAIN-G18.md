# G18 — J-5 and J-7 paired device awareness

Owner: Creator. J-5 owns diagnostics, device-awareness contract, integration verification. J-7 (Codex) owns native Windows GPU implementation and Android Vulkan / Apple Metal feasibility and execution. This file began as a handoff request; J-7 receipt/review acknowledgment is recorded in CONTRIBUTORS.md.

Engineering loop: Investigate -> Diagnose -> Plan -> Implement -> Test -> Validate -> Repair -> Retest -> Verify -> Evidence.

Canonical reuse: Device Bridge owns device discovery and permissions; Runtime Fabric owns execution authorization; Formula owns workload decisions; Continuum owns continuity; LDWMD owns VRAM residency; Veritas owns independent qualification. Digital Brain and Diagnostics Matrix consume the same device-local hardware observations. Edge GPU is an execution provider, not another authority.

S0 DISCOVER: J-5 inventories live Windows brain and diagnostics, Fold6 installed package, iPhone connectivity. J-7 inventories native driver code, toolchain, and supported APIs. Each records evidence and reuse-before-build classification.
S1 CONTRACT: J-5 authors versioned local device-awareness provider contract. J-7 reviews native feasibility and ACKs before dependent implementation.
S2 WINDOWS: J-7 compiles genuine native backend in isolated test environment. J-5 connects read-only qualified telemetry to the existing brain and Matrix. No host driver installation.
S3 MOBILE: J-7 validates real Vulkan/Metal command execution; J-5 validates separate local brains, diagnostics, Continuum and LDWMD integration.
S4 VERIFY: J-5 independently validates source attribution and runtime authority. J-7 repairs backend failures. Veritas evidence before acceptance.

Handoff rule: READY -> HANDOFF -> ACK -> EXECUTED -> EVIDENCED -> ACCEPTED. Silence is not ACK. Contributor ahead must offer assistance to blocked peer without taking unapproved ownership. Log role, exact paths, tests, receipts, blockers and requests. Owner approval required for GitHub commit/push, host driver install, reboot, or security changes.

Truth boundary: An app-level LeeWay GPU provider is not a second OS GPU. Never spoof PCI identities or VRAM; never silently fall back to CPU rasterization/inference. Preserve Intel/NVIDIA drivers and dirty trees.

Current status (2026-10-16): J-5 S0/S1 contract and initial Digital Brain/Diagnostics inventory recorded in CONTRIBUTORS.md. J-7 (Codex) received and reviewed both contract revisions and native feasibility; J-5 accepted the evidence-envelope and demo-telemetry findings. J-7's canonical Veritas scope review is recorded in docs/virtual-gpu/G18-J7-NATIVE-FEASIBILITY.md. A direct D3D12 physical-GPU dispatch prototype passed on Intel and NVIDIA, but Runtime Fabric integration and an authorized GPU-specific Veritas binding are still missing, so shared S2 remains BLOCKED. No LeeWay OS-native driver or shared acceptance is claimed.
