# LEEWAY HEADER — DO NOT REMOVE
#
# REGION: AI
# TAG: AI.AGENT.INDEXER.MAIN
#
# COLOR_ONION_HEX:
# NEON=#39FF14
# FLUO=#0DFF94
# PASTEL=#C7FFD8
#
# ICON_ASCII:
# family=lucide
# glyph=file
#
# 5WH:
# WHAT = indexer module
# WHY = Part of AI region
# WHO = LEEWAY Align Agent
# WHERE = agents\agents\indexer.py
# WHEN = 2026
# HOW = Auto-aligned by LEEWAY align-agent
#
# AGENTS:
# ASSESS
# ALIGN
# AUDIT
#
# LICENSE:
# MIT

AGENTS = {
    "Agent.Neural-Cartographer": {
        "wave": 1,
        "role": "Scout",
        "tool": "discovery_wave1",
        "uniform": "Administrative",
    },
    "Agent.Hardware-Guardian": {
        "wave": 1,
        "role": "Sentry",
        "tool": "hardware_baseline",
        "uniform": "Administrative",
    },
    "Agent.Sovereign-Auditor": {
        "wave": 2,
        "role": "Inspector",
        "tool": "audit_wave2",
        "uniform": "Restricted",
    },
    "Agent.Logistic-Preparer": {
        "wave": 2,
        "role": "Stager",
        "tool": "stage_wave2",
        "uniform": "Restricted",
    },
    "Agent.Qwen3-Deep-Brain": {
        "wave": 3,
        "role": "Strategist",
        "tool": "repair_wave3",
        "uniform": "Administrative",
    },
    "Agent.Phi-3.5-Orchestrator": {
        "wave": 3,
        "role": "Executive",
        "tool": "executive_handshake",
        "uniform": "Administrative",
    },
}

import os
import json
import psutil
import time

INDEX_PATH = r"C:\Cerebral\data\file_index.json"

def index_all_drives():
    try:
        os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    except Exception:
        pass
    drives = [d.device for d in psutil.disk_partitions() if 'fixed' in d.opts]
    file_map = {}
    for drive in drives:
        for root, _, files in os.walk(drive):
            if any(x in root for x in ["Windows", "Program Files", "node_modules"]):
                continue
            for f in files:
                try:
                    file_map[f] = os.path.join(root, f)
                except Exception:
                    continue
    try:
        with open(INDEX_PATH, "w", encoding='utf-8') as f:
            json.dump(file_map, f)
    except Exception:
        pass

if __name__ == '__main__':
    while True:
        index_all_drives()
        time.sleep(3600)
