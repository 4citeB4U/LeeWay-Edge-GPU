#!/usr/bin/env bash
set -euo pipefail
command -v node >/dev/null || { echo "Node.js runtime required"; exit 1; }
command -v systemctl >/dev/null || { echo "systemd user instance required"; exit 1; }
SOURCE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.local/share/leeway-gpu-service"
mkdir -p "$DEST" "$HOME/.config/systemd/user"
cp -R "$SOURCE/service" "$DEST/"
NODE="$(command -v node)"
UNIT="$HOME/.config/systemd/user/leeway-gpu.service"
cat > "$UNIT" <<EOF
[Unit]
Description=LeeWay GPU local diagnostic service
After=default.target
[Service]
Type=simple
ExecStart=$NODE "$DEST/service/service.mjs"
Environment=LEEWAY_GPU_PORT=4178
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now leeway-gpu.service
echo "LEEWAY_GPU_LINUX_DIAGNOSTIC_INSTALLED $DEST"
echo "API http://127.0.0.1:4178/v1/status (GPU dispatch remains locked)"
