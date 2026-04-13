#!/usr/bin/env node

/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.SDK
TAG: LEEWAY.SKILLS.SDK.BADGE_CLI

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=badge-check

5WH:
WHAT = Thin CLI wrapper for the packaged Leeway Agent Skills badge installer
WHY = Lets npm consumers generate the proof-backed badge bundle from the installed package
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = bin/leeway-skills-badge.js
WHEN = 2026
HOW = Spawns the packaged badge installer entrypoint with inherited stdio

AGENTS:
INSTALL

LICENSE:
MIT
*/

import { spawn } from "node:child_process";
import { getMcpBadgeInstallerPath } from "../sdk/paths.js";

const child = spawn(
  process.execPath,
  [getMcpBadgeInstallerPath(), ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    stdio: "inherit",
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[Leeway Agent Skills] Unable to install badge bundle:", error);
  process.exit(1);
});
