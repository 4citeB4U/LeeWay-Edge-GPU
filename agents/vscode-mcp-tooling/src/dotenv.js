/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.DOTENV.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = dotenv module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\vscode-mcp-tooling\src\dotenv.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

//
// LEEWAY_HEADER
// TAG: TOOLS.MCP.DOTENV.MAIN
// REGION: 🟣 MCP
// DISCOVERY_PIPELINE:
//   Voice → Intent → Location → Vertical → Ranking → Render
//
import fs from "fs";

export function loadDotenv(path) {
  const out = {};
  if (!path || !fs.existsSync(path)) return out;

  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    if (/^\s*#/.test(line)) continue;

    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;

    const k = m[1];
    let v = m[2] ?? "";

    v = v.trim();
    v = v.replace(/^[\"']|[\"']$/g, "");
    v = v.trim();

    out[k] = v;
  }
  return out;
}

export function mergeEnv(obj) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (typeof v === "string" && v.length > 0) process.env[k] = v;
  }
}
