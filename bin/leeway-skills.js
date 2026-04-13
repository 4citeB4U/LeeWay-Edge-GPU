#!/usr/bin/env node

/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.SDK
TAG: LEEWAY.SKILLS.SDK.CLI

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=terminal-square

5WH:
WHAT = Root CLI for the npm-distributed Leeway Agent Skills application bundle
WHY = Gives installed consumers one command to inspect, extract, and launch packaged Leeway capabilities
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = bin/leeway-skills.js
WHEN = 2026
HOW = Provides package-aware commands and delegates runtime execution to bundled MCP and standards tools

AGENTS:
EXECUTE
DISCOVER

LICENSE:
MIT
*/

import { spawn } from "node:child_process";
import {
  extractLeewayApplication,
  getPackagedPaths,
  getPackageSummary,
} from "../sdk/index.js";

const args = process.argv.slice(2);
const command = args[0] ?? "help";

const COMMANDS = {
  info: "Show package summary, skill counts, and key paths",
  paths: "Print packaged asset paths (use --json for JSON output)",
  extract: "Copy the full application bundle into a target directory",
  badge: "Run the packaged badge installer",
  mcp: "Start the packaged MCP server",
  standards: "Run the packaged Leeway Standards CLI",
  help: "Show this help output",
};

function showHelp() {
  console.log("Leeway Agent Skills");
  console.log("");
  console.log("Usage:");
  console.log("  leeway-agent-skills <command> [options]");
  console.log("");
  console.log("Commands:");
  for (const [name, description] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(10)} ${description}`);
  }
  console.log("");
  console.log("Examples:");
  console.log("  leeway-agent-skills info");
  console.log("  leeway-agent-skills paths --json");
  console.log("  leeway-agent-skills extract ./leeway-agent-skills-app");
  console.log('  leeway-agent-skills badge ./public "My App" mcp-server');
  console.log("  leeway-agent-skills mcp");
  console.log("  leeway-agent-skills standards doctor");
}

async function runInfo() {
  const summary = await getPackageSummary();
  console.log("Leeway Agent Skills");
  console.log(`Package: ${summary.name}@${summary.version}`);
  console.log(
    `Registry: ${summary.activeSkills} active skills across ${summary.activeCategories} categories`,
  );
  console.log(
    `Installed: ${summary.installedSkills} packaged skills across ${summary.installedCategories} categories`,
  );
  console.log(`Root: ${summary.paths.packageRoot}`);
  console.log(`MCP: ${summary.paths.mcpServerEntryPath}`);
  console.log(`Badge: ${summary.paths.badgePath}`);
  console.log(`Registry File: ${summary.paths.registryPath}`);
}

async function runPaths() {
  const paths = getPackagedPaths();
  if (args.includes("--json")) {
    console.log(JSON.stringify(paths, null, 2));
    return;
  }

  for (const [key, value] of Object.entries(paths)) {
    console.log(`${key}: ${value}`);
  }
}

async function runExtract() {
  const targetDir = args[1] ?? "leeway-agent-skills-app";
  const overwrite = args.includes("--overwrite");
  const result = await extractLeewayApplication({ targetDir, overwrite });
  console.log("[Leeway Agent Skills] Full application extracted");
  console.log(`  Target: ${result.targetDir}`);
  console.log(`  Copied items: ${result.copied.length}`);
}

function runNodeScript(scriptPath, scriptArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      process.exitCode = code ?? 0;
      resolve(code ?? 0);
    });
    child.on("error", reject);
  });
}

async function main() {
  const paths = getPackagedPaths();

  switch (command) {
    case "info":
      await runInfo();
      break;
    case "paths":
      await runPaths();
      break;
    case "extract":
      await runExtract();
      break;
    case "badge":
      await runNodeScript(paths.mcpBadgeInstallerPath, args.slice(1));
      break;
    case "mcp":
      await runNodeScript(paths.mcpServerEntryPath, args.slice(1));
      break;
    case "standards":
      await runNodeScript(paths.standardsCliPath, args.slice(1));
      break;
    case "help":
    case "--help":
    default:
      showHelp();
      break;
  }
}

main().catch((error) => {
  console.error("[Leeway Agent Skills] Fatal error:", error);
  process.exit(1);
});

