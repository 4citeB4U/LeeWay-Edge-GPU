# LeeWay GPU Windows workstation and client

This standalone LeeWay GPU application provides two separately labeled paths:

- **Local WebGPU compute** remains a browser/device-local path.
- **Remote model inference preview** lets an owner-paired, no-GPU Windows PC send a bounded encrypted prompt to a LeeWay GPU workstation on the same private LAN. The workstation runs an allowlisted Ollama model through its CUDA backend and returns a result only after VRAM residency is observed.

The preview route is an inference adapter. It does not turn on canonical `/v1/execute`, does not claim Formula, LDWMD, Continuum or Veritas acceptance, and does not create Receipt Ledger or Learning Ledger entries. The workstation must be powered on, the model must already be installed, and the devices must be able to reach each other on their private LAN. No Internet relay is configured by this package.

## Install and pair two Windows PCs

Install the bundle on both the GPU workstation and the client PC with `install-windows.ps1`. The LeeWay GPU app opens locally at `http://127.0.0.1:4178/` on each PC. Node.js is required on both; Ollama and a supported NVIDIA CUDA runtime are required on the workstation.

Use the pairing CLI from the installed folder. Exchange the public keys through an owner-controlled secure channel and compare the two derived key fingerprints; the pairing secret itself is protected with Windows DPAPI under each Windows account.

```powershell
node .\pairing.mjs init
node .\pairing.mjs finish <other-device-public-key-base64>
node .\pairing.mjs configure-host <workstation-private-ip> qwen3.5:4b
```

On the no-GPU PC:

```powershell
node .\pairing.mjs init
node .\pairing.mjs finish <workstation-public-key-base64>
node .\pairing.mjs configure-client <workstation-private-ip> qwen3.5:4b
```

The SHA-256 `keyFingerprint` printed by both `finish` commands must match. Then start LeeWay GPU on both PCs. The workstation listens only on its configured private IPv4 address on port 4178; its app dashboard and control routes remain loopback-only. The only LAN route accepts the paired AES-GCM envelope, request MAC, freshness window and replay guard.

If Windows Firewall blocks this private-LAN connection, add a Private-profile inbound rule for TCP 4178 restricted to the paired client address. Do not expose the workstation listener to public networks. The app does not create firewall rules automatically.

## Model and capacity boundary

The initial workstation profile allows `qwen3.5:4b`, which was observed using about 2.5 GiB of the laptop RTX 5060's 8 GiB VRAM in the current host test. The selected model must fit the host's actual available memory. A no-GPU client does not add VRAM; it uses the paired workstation's capacity. A 700B model cannot fit on this single 8 GiB GPU.

## Portability

The protocol is device-neutral, while this first runnable workstation adapter is Windows + NVIDIA CUDA + Ollama. Other adapters (D3D12, Vulkan, Metal, Android, Linux) require their own implementation and host qualification. The app keeps canonical production dispatch fail-closed until the missing owner/provider authorities are connected.

<!-- LEEWAY UNIVERSAL FORMULA GOVERNANCE BEGIN -->

# LeeWay Universal Formula Governance

Authority: Creator and LeeWay Standards.
Formula identity: LEEWAY-FORMULA-v1.0.

The canonical LeeWay Formula is mandatory throughout
the entire LeeWay ecosystem.

Every current and future application, capability,
agent, worker, employee, model, provider, adapter,
automation and integration inherits this requirement.

All applicable interactions, responses, decisions,
actions, revisions, executions, computations, model
inferences, resource allocations, information transfers,
memory operations, storage operations and deployments
must consume the canonical Formula through their
authorized and qualified domain contracts.

Formula availability, documentation, configuration,
health and historical results do not constitute actual
Formula consumption for a new operation.

Recover relevant authorized memory before substantive
work. Preserve identity, provenance, Formula integrity,
authorization, original receipts and verified learning.

Never invent observations, adapter mappings, mathematical
results, execution evidence or independent verification.

No application may bypass applicable Formula governance
by dispatching directly to a provider.

Every new application and capability must demonstrate
applicable Formula consumption before production admission.

Preserve the existing authority hierarchy:

Creator > Standards > Root of Trust > Runtime Fabric >
Agent Lee > Harness > Formula > skills/models/tools >
execution > Veritas > Receipt Authority > Learning Ledger.

Execute the complete engineering loop:

INVESTIGATE > DIAGNOSE > PLAN > IMPLEMENT > TEST >
VALIDATE > REPAIR > RETEST > VERIFY > EVIDENCE >
CHECKPOINT > CONTINUE.

Documentation compliance does not establish executable
enforcement or production admission.

<!-- LEEWAY UNIVERSAL FORMULA GOVERNANCE END -->
