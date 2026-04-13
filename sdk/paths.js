/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.SDK
TAG: LEEWAY.SKILLS.SDK.PATHS

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=folder-tree

5WH:
WHAT = Shared package path and metadata helpers for the npm-distributed Leeway Skills application
WHY = Consumers need stable access to packaged assets, docs, registry files, and runtime entrypoints
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = sdk/paths.js
WHEN = 2026
HOW = Resolves absolute paths from the installed package root and exposes package summary helpers

AGENTS:
DISCOVER
INTROSPECT

LICENSE:
MIT
*/

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, "..");

export function getPackageRoot() {
  return PACKAGE_ROOT;
}

export function getSkillsRoot() {
  return path.join(PACKAGE_ROOT, "skills");
}

export function getDocumentsRoot() {
  return path.join(PACKAGE_ROOT, "documents");
}

export function getScriptsRoot() {
  return path.join(PACKAGE_ROOT, "scripts");
}

export function getConfigRoot() {
  return path.join(PACKAGE_ROOT, "config");
}

export function getRegistryPath() {
  return path.join(getScriptsRoot(), "skills-registry.json");
}

export function getLeewayConfigPath() {
  return path.join(PACKAGE_ROOT, ".leeway", "config.json");
}

export function getBadgePath() {
  return path.join(PACKAGE_ROOT, "agentbage.png.png");
}

export function getAgentConfigPath() {
  return path.join(PACKAGE_ROOT, "agent-config.yaml");
}

export function getMcpServerEntryPath() {
  return path.join(PACKAGE_ROOT, "mcp-server", "dist", "index.js");
}

export function getMcpBadgeInstallerPath() {
  return path.join(PACKAGE_ROOT, "mcp-server", "dist", "install-badge-proof.js");
}

export function getStandardsCliPath() {
  return path.join(PACKAGE_ROOT, "LeeWay-Standards", "src", "cli", "leeway.js");
}

export function getPackagedPaths() {
  return {
    packageRoot: getPackageRoot(),
    skillsRoot: getSkillsRoot(),
    documentsRoot: getDocumentsRoot(),
    scriptsRoot: getScriptsRoot(),
    configRoot: getConfigRoot(),
    registryPath: getRegistryPath(),
    leewayConfigPath: getLeewayConfigPath(),
    badgePath: getBadgePath(),
    agentConfigPath: getAgentConfigPath(),
    mcpServerEntryPath: getMcpServerEntryPath(),
    mcpBadgeInstallerPath: getMcpBadgeInstallerPath(),
    standardsCliPath: getStandardsCliPath(),
  };
}

export async function readPackageManifest() {
  const manifestPath = path.join(PACKAGE_ROOT, "package.json");
  const content = await fs.readFile(manifestPath, "utf-8");
  return JSON.parse(content);
}

export async function readSkillsRegistry() {
  const content = await fs.readFile(getRegistryPath(), "utf-8");
  return JSON.parse(content);
}

export async function scanPackagedSkills() {
  const categories = await fs.readdir(getSkillsRoot(), { withFileTypes: true });
  let installedSkills = 0;
  let installedCategories = 0;

  for (const category of categories) {
    if (!category.isDirectory()) {
      continue;
    }

    installedCategories += 1;
    const categoryPath = path.join(getSkillsRoot(), category.name);
    const skillEntries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const skillEntry of skillEntries) {
      if (!skillEntry.isDirectory()) {
        continue;
      }

      try {
        await fs.access(path.join(categoryPath, skillEntry.name, "SKILL.md"));
        installedSkills += 1;
      } catch {
        // Ignore directories that are not valid skills.
      }
    }
  }

  return {
    installedSkills,
    installedCategories,
  };
}

export async function getPackageSummary() {
  const [manifest, registry, installed] = await Promise.all([
    readPackageManifest(),
    readSkillsRegistry(),
    scanPackagedSkills(),
  ]);

  return {
    name: manifest.name ?? "unknown",
    version: manifest.version ?? "unknown",
    activeSkills: registry.totalSkills ?? 0,
    activeCategories:
      registry.totalCategories ?? registry.categories?.length ?? 0,
    installedSkills: installed.installedSkills,
    installedCategories: installed.installedCategories,
    paths: getPackagedPaths(),
  };
}
