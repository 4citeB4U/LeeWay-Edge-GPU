# LeeWay GPU — Android Standalone Diagnostic (v0.1.0)

Independent package: `industries.leeway.gpu`. Device Bridge and Agent Lee Pocket remain separate applications.

## Build and installation

On the authorized Windows build machine, run `build-debug.ps1` with the Android SDK and JDK 17 installed. It creates `build/LeeWayGPU-debug.apk`, signed with the local Android **debug** key (never the production release identity). Install through an authorized device-management/ADB workflow.

## Cross-application interface

Applications explicitly bind to the exported service with package `industries.leeway.gpu` and action `industries.leeway.gpu.BIND_SERVICE`. The Android Messenger protocol supports:

- Message `what=1`, supply a `replyTo` Messenger: returns serviceId, apiVersion, backend, dispatchAllowed=false, productionReady=false, authority, continuum.
- Message `what=2`: returns `status=DENIED` and `GPU_CANONICAL_EXECUTION_AUTHORITY_NOT_CONNECTED`; no native GPU dispatch.

This diagnostic interface is discoverable but not an authenticated execution interface. Future mutation calls must require caller identity, explicit owner registration and signed canonical Runtime Fabric grants. The currently exported service never executes GPU work or accesses the physical Vulkan driver.

Android background execution restrictions prevent assuming a permanently running, arbitrary third-party GPU service. Use explicit bound-service IPC and owner-authorized lifecycle management. A transparent replacement of third-party Vulkan/OpenGL drivers is a separate OS-level qualification.

## Current verification

On 2026-10-19 the Samsung Fold6 installation succeeded and activity-to-service Messenger binding logged `SERVICE_BIND_PASS_LOCKED`. This is a same-app IPC test; third-party client binding, Vulkan dispatch, Formula decisions, LDWMD leasing, Continuum owner authority and canonical Veritas were not qualified.

Do not call this production-ready or use debug signing credentials as production issuer keys.

## One-switch user control (2026-10-19)

The Activity now includes **Use LeeWay GPU**, an Android Switch. OFF is the default; switching ON saves a private SharedPreferences `requestedEnabled=true` value under `leeway_gpu`. The exported Messenger `GET_STATUS=1` returns `requestedEnabled`, `active=false` and `dispatchAllowed=false`. An ON preference is a request to use LeeWay GPU from compatible authorized clients, NOT an active Vulkan interception or native dispatch permission. Mutation of the preference is not exported to other apps.

This APK compiled, was signed with the debug key, reinstalled on the Samsung Fold6, and logged `SERVICE_BIND_PASS_LOCKED`. The screen was subsequently locked during UI inspection, so physical tap-testing of the switch was not verified.

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
