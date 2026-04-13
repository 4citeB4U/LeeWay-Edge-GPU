# Internal Admin Guide — LeeWay Edge RTC

This guide is for system owners/administrators. It explains how to use, maintain, monitor, and control the system, including connection keys, backend access, and verification steps for deployments (e.g., Fly.io or your cloud provider).

---

## 1. How the System Connects

- **Frontend (Web Demo/App):** Connects to the backend SFU via WebSocket (wss://your-sfu-host/ws).
- **Backend (SFU):** Runs on your server or cloud (e.g., Fly.io, VPS).
- **Agent Lee Voxel OS:** Connects to the SFU using the environment variable `VITE_VOICE_WS_URL`.
- **JWT Tokens:** Used for authentication between clients and the SFU. In development, you can get a token from `/dev/token`.

### Example Connection Keys/Env Vars
- `VITE_VOICE_WS_URL=wss://your-sfu-host/ws` (set in Agent Lee Voxel OS)
- `JWT_SECRET=your-very-secret-key` (set in SFU backend .env)
- `ANNOUNCED_IP=your.public.ip.address` (for ICE in cloud/NAT)

---

## 2. How to Monitor & Control the System

### Monitoring
- **Prometheus Metrics:** Visit `http://your-sfu-host:3000/metrics` (add to Grafana for dashboards)
- **Health Check:** `http://your-sfu-host:3000/health` (returns status)
- **Active Connections:** `http://your-sfu-host:3000/connections`
- **Active Rooms:** `http://your-sfu-host:3000/rooms`
- **Agent Status:** `http://your-sfu-host:3000/agents` and `/agents/runtime/status`
- **Logs:** Check `services/sfu/logs/` on your server for detailed logs

### Controlling
- **Restarting Services:** Use Docker Compose or your process manager (systemd, PM2) to restart the SFU or web client.
- **Scaling:** For high load, deploy multiple SFU instances and use a load balancer (see advanced docs).
- **Agent Control:** Use `/agents/:codename/suspend` and `/agents/:codename/resume` (POST) for agent lifecycle (dev mode only).

---

## 3. How to Verify Deployment (e.g., Fly.io)

1. **Check Service Health:**
   - Open your deployed SFU URL (e.g., `https://your-sfu-app.fly.dev/health`).
   - Should return `{ "status": "ok", ... }`.
2. **Check Metrics:**
   - Visit `/metrics` endpoint for Prometheus data.
3. **Check Connections:**
   - Visit `/connections` and `/rooms` to see live users/rooms.
4. **Check Logs:**
   - Use your cloud provider’s dashboard or SSH to the server and check `logs/`.
5. **Check Web Demo:**
   - Open the web demo URL and verify you can connect and talk to Agent Lee.

---

## 4. Keys & Secrets
- **Never share your JWT_SECRET or admin credentials publicly.**
- Store secrets in your cloud provider’s environment variable manager (Fly.io, etc.).
- Rotate keys if you suspect compromise.

---

## 5. Troubleshooting
- If the web demo can’t connect, check:
  - The SFU is running and reachable (health endpoint)
  - The WebSocket URL is correct in your client/app
  - No firewall is blocking ports 3000, 3478, 5349, or 40000-49999/UDP
- If metrics or logs are missing, check your server’s disk space and permissions.

---

## 6. Useful Commands

- **Restart all services (Docker Compose):**
  ```bash
  docker compose restart
  ```
- **View logs (Docker):**
  ```bash
  docker compose logs -f
  ```
- **SSH to server (Fly.io):**
  ```bash
  fly ssh console -a your-app-name
  ```
- **Set env vars (Fly.io):** Use their dashboard or CLI to set secrets.

---

For more details, see the full docs or contact your technical support.
