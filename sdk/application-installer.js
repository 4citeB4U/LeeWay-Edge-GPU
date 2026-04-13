/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.SDK
TAG: LEEWAY.SKILLS.SDK.APPLICATION_INSTALLER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=package-open

5WH:
WHAT = Installer for materializing the full packaged Leeway Skills application into a target directory
WHY = Teams may want a standalone copy of the full application after installing the npm package
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = sdk/application-installer.js
WHEN = 2026
HOW = Copies the curated packaged asset set into an empty target directory while preserving structure

AGENTS:
INSTALL
DEPLOY

LICENSE:
MIT
*/

import fs from "node:fs/promises";
import path from "node:path";
import { getPackageRoot } from "./paths.js";

const PACKAGE_COPY_ITEMS = [
  ".leeway/config.json",
  "LICENSE",
  "README.md",
  "agent-config.yaml",
  "agentbage.png.png",
  "bin",
  "config",
  "documents",
  "LeeWay-Standards/LICENSE",
  "LeeWay-Standards/README.md",
  "LeeWay-Standards/examples",
  "LeeWay-Standards/package.json",
  "LeeWay-Standards/schemas",
  "LeeWay-Standards/src",
  "mcp-server/README.md",
  "mcp-server/dist",
  "mcp-server/package.json",
  "mcp-server/src",
  "mcp-server/tsconfig.json",
  "scripts",
  "sdk",
  "skills",
  "package.json",
];

export async function extractLeewayApplication(options) {
  const targetDir = path.resolve(options?.targetDir ?? "leeway-agent-skills-app");
  const overwrite = options?.overwrite ?? false;

  await fs.mkdir(targetDir, { recursive: true });
  const existingEntries = await fs.readdir(targetDir);
  if (existingEntries.length > 0 && !overwrite) {
    throw new Error(
      `Target directory is not empty: ${targetDir}. Choose an empty directory or pass overwrite: true.`,
    );
  }

  const packageRoot = getPackageRoot();
  const copied = [];

  for (const relativePath of PACKAGE_COPY_ITEMS) {
    const sourcePath = path.join(packageRoot, relativePath);
    const destinationPath = path.join(targetDir, relativePath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.cp(sourcePath, destinationPath, {
      recursive: true,
      force: overwrite,
    });
    copied.push(destinationPath);
  }

  return {
    targetDir,
    copied,
  };
}
