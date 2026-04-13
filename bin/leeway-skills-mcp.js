#!/usr/bin/env node

/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.SDK
TAG: LEEWAY.SKILLS.SDK.MCP_CLI

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=server

5WH:
WHAT = Thin CLI wrapper for launching the packaged Leeway Agent Skills MCP server
WHY = Lets npm consumers start the MCP server directly after installation
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = bin/leeway-skills-mcp.js
WHEN = 2026
HOW = Spawns the packaged MCP server entrypoint with inherited stdio

AGENTS:
SERVE

LICENSE:
MIT
*/

import { spawn } from "node:child_process";
import { getMcpServerEntryPath } from "../sdk/paths.js";

const child = spawn(process.execPath, [getMcpServerEntryPath(), ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[Leeway Agent Skills] Unable to start MCP server:", error);
  process.exit(1);
});
