# Internal Admin Guide — LeeWay Edge RTC

This guide covers service operations without assuming a particular cloud vendor. Use only the deployment provider and service bindings authorized for the target LeeWay environment.

---

## 1. How the system connects

- **Frontend (web demo/app):** connects to the configured SFU over WebSocket (for example, `wss://your-sfu-host/ws`).
- **Backend (SFU):** runs as an authorized managed service or approved server process.
- **Agent Lee Voxel OS:** receives its WebSocket endpoint through `VITE_VOICE_WS_URL`.
- **JWT tokens:** authenticate clients. Development-only token routes must never be exposed as production authority.

Example configuration names:
- `VITE_VOICE_WS_URL`: authorized SFU WebSocket endpoint.
- `JWT_SECRET`: service-managed secret; never commit or print its value.
- `ANNOUNCED_IP`: only where the selected SFU/network adapter requires a public address for ICE/NAT.

## 2. Monitor and control

Use the service's documented, authenticated endpoints and the selected provider's deployment dashboard.

- Metrics: `/metrics`, when enabled.
- Health: `/health`, when implemented by this service.
- Connections and rooms: `/connections` and `/rooms`, when implemented and access-controlled.
- Agent status: `/agents` and `/agents/runtime/status`, when implemented.
- Logs: read from the service's approved log interface; do not assume host filesystem access.

For restarts, scaling, and deployments, use the authorized provider control plane or the approved process manager. Confirm the target environment and current deployment before making changes.

## 3. Verify a deployment

1. Confirm the service identity, deployment revision, and environment in the provider control plane.
2. Request the service's documented HTTPS health endpoint and check the returned service identity.
3. Inspect metrics and logs through approved interfaces.
4. Verify the web client uses the expected WebSocket origin.
5. Perform an authorized connection test and record the exact observed result.

A health response proves only that endpoint's reported process state. It does not by itself prove authenticated end-to-end voice, device access, GPU execution, or production authorization.

## 4. Keys and secrets

- Never share `JWT_SECRET`, signing keys, or admin credentials.
- Store secrets in the selected provider's secret manager or the service's authorized secret authority.
- Rotate a key only through its owner-approved rotation process.

## 5. Troubleshooting

If the web demo cannot connect, verify:
- The intended SFU deployment is running and reachable.
- The client WebSocket URL matches the approved service origin.
- The current network adapter permits the required WebSocket and media traffic.
- The provider logs show whether the connection reached the service.

If metrics or logs are missing, check the service's configured telemetry and retention policy. Do not infer missing data from a local machine or a different environment.

## 6. Local development commands

For a local Docker Compose development stack:
```bash
docker compose restart
docker compose logs -f
```

These commands apply only to a local Compose environment. They do not deploy or restart a managed production service.