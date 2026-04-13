/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.CONFIG.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = config module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\vscode-mcp-tooling\src\config.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../");

export const CONFIG = {
  DOTENV_PATH: path.join(ROOT, ".env.local"),
  NPM_CMD: "npm.cmd",
  NODE_EXE: "node.exe",
  STITCH_PATH: path.join(ROOT, "workspace/preview") // Refers to the likely location of stitch projects
};
