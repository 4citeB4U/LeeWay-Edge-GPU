#!/usr/bin/env node

/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.SDK
TAG: LEEWAY.SKILLS.SDK.STANDARDS_CLI

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=shield-check

5WH:
WHAT = Thin CLI wrapper for the packaged Leeway Standards command-line interface
WHY = Lets npm consumers access governance and audit tooling from the full package install
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = bin/leeway-standards.js
WHEN = 2026
HOW = Spawns the packaged standards CLI with inherited stdio and the caller's working directory

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import { spawn } from "node:child_process";
import { getStandardsCliPath } from "../sdk/paths.js";

const child = spawn(process.execPath, [getStandardsCliPath(), ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[Leeway Agent Skills] Unable to start Leeway Standards CLI:", error);
  process.exit(1);
});
