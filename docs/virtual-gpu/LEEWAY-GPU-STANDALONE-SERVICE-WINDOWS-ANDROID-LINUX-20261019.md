# LeeWay GPU — Standalone Service Packaging, 2026-10-19

## Canonical principle

One GPU service identity: `leeway.gpu.service`, with Runtime Fabric as authority. The path is **Formula → LDWMD → Continuum → native GPU (D3D12/Vulkan) → Veritas**; Device Bridge is the controlled device interface. App platforms must not construct competing grant issuers, Formula engines, memory ledgers or execution receipt authorities.

## Application deliverables

- **Windows:** `LeeWay-Edge-GPU/applications/desktop/build/leeway-gpu-service` assembled from canonical Device Bridge package. Per-user local install at `%LOCALAPPDATA%/LeeWayGPU`, Start Menu launcher and Startup shortcut to run a diagnostic loopback service without opening UI on login. Local dashboard `http://127.0.0.1:4178/`.
- **Android Samsung/Fold6:** `LeeWay-Edge-GPU/applications/android-leeway-gpu`; separate `industries.leeway.gpu` APK, native activity and exported read-only Messenger binding. NOT integrated into Agent Lee Pocket APK.
- **Linux:** Same Node gateway packaged with `install-linux.sh`; user systemd service for discovery, with Vulkan backend contract. No Linux runtime installation or physical Vulkan test was performed in this work.

Shared Node package: `LEEWAY-DEVICE-BRIDGE/packages/leeway-gpu-service`; endpoints `GET /`, `GET /v1/status`, `GET /v1/manifest` and permanently blocked diagnostic `/v1/execute`. Node consumer SDK `./client.mjs` checks service identity and requires loopback, but cannot submit execution. Discovery manifest in `discovery.json`. Platform bindings must reuse this ID. These interfaces do not grant access to arbitrary third-party apps. Apps must opt into SDK/IPC, and future execution requires owner authority.

## Evidence this turn

Windows localhost service smoke test: live `backend=D3D12`, `productionReady=false`, dashboard GET passed. Windows Start Menu and login shortcut created. Android package compiled and signed using a debug key, ADB install on Samsung Fold6 returned `Success`, versionCode 1; activity-to-bound-service Messenger test logged `SERVICE_BIND_PASS_LOCKED`. The service's only execution response is an explicit denial. Node package regression suite covers identity, loopback restriction and denial.

## Production blockers

1. Canonical owner-controlled Runtime Fabric GPU issuer and trust provisioning.
2. Approved workload-specific Formula scheduling policy, and signed pre-dispatch decision.
3. Physical LDWMD lease for exactly the dispatched D3D12/Vulkan buffer under that authority.
4. Live owner-authorized Continuum retention and correlated lineage.
5. Governed native dispatch and independently authenticated canonical Veritas receipt.
6. Mandatory enforcement at every LeeWay caller and optional onboarding for other applications.
7. Windows production hardening and Linux/Android real-chain native execution qualification.

**Lab versus production:** Prior Windows tests proved real D3D12 computation, LDWMD-owned allocation and SQLite Continuum persistence with test authorities. This packaging pass does not convert those isolated facts into production admission, universal third-party GPU replacement or OS-registered virtual GPU drivers.

No direct edits to the canonical Runtime Fabric provider registry, live Continuum database or production signing keys were made here.
