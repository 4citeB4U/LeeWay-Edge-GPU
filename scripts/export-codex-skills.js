#!/usr/bin/env node
/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.SYSTEM.INTEGRATION
TAG: AI.SYSTEM.INTEGRATION.CODEX_SKILLS_EXPORTER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=package-plus

5WH:
WHAT = Exports the local Leeway skill library as Codex-native skills
WHY = Lets Codex discover and use this repo's skills without rewriting the source skill corpus by hand
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = scripts/export-codex-skills.js
WHEN = 2026
HOW = Parses source SKILL.md files, generates Codex wrappers plus references, and optionally installs them into the user Codex skill directory

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourceSkillsRoot = path.join(repoRoot, "skills");
const registryPath = path.join(__dirname, "skills-registry.json");
const defaultExportRoot = path.join(repoRoot, ".leeway", "codex-skills");
const defaultInstallRoot = path.join(os.homedir(), ".codex", "skills");
const defaultPrefix = "leeway-";

const leewayStandardsDescription =
  "Apply Leeway Standards governance to code and skill changes: preserve or add Leeway headers, keep REGION and TAG metadata valid, avoid hardcoded secrets, respect file placement and naming rules, and run the available verification tooling when working in Leeway-governed repositories. Use whenever Codex edits code, scripts, SKILL.md files, or project configuration in a Leeway repository.";

const leewayStandardsBody = `# Leeway Standards

Use this skill whenever you modify code or skills in a Leeway-governed repository.

## Quick start

- Read \`references/compliance.md\` for the policy summary and operational expectations.
- Read \`references/sdk-readme.md\` when you need the header format, tag model, agent roster, or directory conventions.
- Preserve existing Leeway headers and add compatible headers to new tracked files when the repo policy requires them.
- Never hardcode secrets; move credentials to environment variables, config, or a secure secret store.
- Run the local Leeway verification tooling after meaningful changes when it is available.

## Verification

- Prefer \`node scripts/verify-leeway-setup.js\` for repo-level verification.
- Use \`node scripts/leeway-agents/header-injector.js\` to repair or add missing headers when appropriate.
- Use \`node scripts/leeway-agents/compliance-monitor.js\` when you need a broader compliance audit.

## Reference map

- \`references/compliance.md\` -> repo-facing compliance rules and policy summary
- \`references/sdk-readme.md\` -> canonical LEEWAY header and structure guidance
`;

function buildApplicationSkillDefinitions(prefix) {
  return [
    {
      generatedName: buildGeneratedSkillName("agent-skills-platform", prefix),
      title: "Leeway Agent Skills Platform",
      description:
        "Navigate and use the full Leeway Agent Skills application, including the skill library, runtime configuration, learning architecture, MCP surfaces, workflows, and standards. Use when Codex needs to understand, extend, integrate, package, or operate the overall Leeway system rather than a single domain skill.",
      shortDescription: "Full Leeway application platform guide",
      defaultPrompt:
        "Use $leeway-agent-skills-platform to understand or extend the full Leeway Agent Skills application.",
      body: `# Leeway Agent Skills Platform

Use this skill when the task touches the overall Leeway application, architecture, runtime behavior, or package layout.

## Quick start

- Read \`references/readme.md\` for the top-level package map and current commands.
- Read \`references/system-overview.md\` to understand how skills, workflows, learning, and MCP fit together.
- Read \`references/agent-config.yaml\` when you need runtime settings, learning thresholds, or integration points.
- Read \`references/file-directory-guide.md\` to know which files are runtime-facing versus reference-only.
- Route focused work to adjacent skills when scope narrows: \`$leeway-standards\`, \`$leeway-mcp-server\`, \`$leeway-workflows\`, or \`$leeway-npm-sdk\`.

## Reference map

- \`references/readme.md\` -> main application overview and command surface
- \`references/system-overview.md\` -> full system architecture and learning model
- \`references/agent-config.yaml\` -> runtime configuration and integration points
- \`references/file-directory-guide.md\` -> navigation for agent-readable and reference files
`,
      references: [
        {
          name: "readme.md",
          sourcePath: path.join(repoRoot, "README.md"),
        },
        {
          name: "system-overview.md",
          sourcePath: path.join(repoRoot, "documents", "COMPLETE_SYSTEM_OVERVIEW.md"),
        },
        {
          name: "agent-config.yaml",
          sourcePath: path.join(repoRoot, "agent-config.yaml"),
        },
        {
          name: "file-directory-guide.md",
          sourcePath: path.join(repoRoot, "documents", "FILE_DIRECTORY_GUIDE.md"),
        },
      ],
    },
    {
      generatedName: buildGeneratedSkillName("mcp-server", prefix),
      title: "Leeway MCP Server",
      description:
        "Run, configure, debug, or integrate the Leeway Skills MCP server that exposes Leeway capabilities as callable tools, including Agent Lee integration and proof badge installation. Use when Codex needs to build the server, start it, connect agents, inspect MCP behavior, or generate proof-backed badge bundles.",
      shortDescription: "Leeway MCP server and integration guide",
      defaultPrompt:
        "Use $leeway-mcp-server to run, integrate, or troubleshoot the Leeway MCP server.",
      body: `# Leeway MCP Server

Use this skill when Leeway needs to be exposed as callable tools through MCP.

## Quick start

- Read \`references/mcp-readme.md\` for server startup, tool format, and MCP behavior.
- Read \`references/agent-lee-integration.md\` when integrating the MCP server into another agent runtime.
- Read \`references/badge-integration.md\` when installing a proof-backed Leeway badge bundle into another app.
- Check \`references/mcp-package.json\` for the server package commands and entry points before changing runtime behavior.
- Pair this skill with \`$leeway-agent-skills-platform\` for broader architecture work and \`$leeway-standards\` for governed code changes.

## Reference map

- \`references/mcp-readme.md\` -> MCP server setup, execution, and tool contract
- \`references/agent-lee-integration.md\` -> example agent integration and config
- \`references/badge-integration.md\` -> proof-backed badge installation flow
- \`references/mcp-package.json\` -> build and start commands for the server package
`,
      references: [
        {
          name: "mcp-readme.md",
          sourcePath: path.join(repoRoot, "mcp-server", "README.md"),
        },
        {
          name: "agent-lee-integration.md",
          sourcePath: path.join(repoRoot, "documents", "AGENT_LEE_INTEGRATION.md"),
        },
        {
          name: "badge-integration.md",
          sourcePath: path.join(repoRoot, "documents", "LEEWAY_BADGE_INTEGRATION.md"),
        },
        {
          name: "mcp-package.json",
          sourcePath: path.join(repoRoot, "mcp-server", "package.json"),
        },
      ],
    },
    {
      generatedName: buildGeneratedSkillName("workflows", prefix),
      title: "Leeway Workflows",
      description:
        "Work with the Leeway workflow layer, including workflow acquisition, orchestration patterns, skill-to-workflow mapping, and workflow toolkit automation. Use when Codex needs to understand, plan, normalize, extend, or operationalize Leeway workflows rather than a single isolated skill.",
      shortDescription: "Leeway workflow orchestration guide",
      defaultPrompt:
        "Use $leeway-workflows to understand or extend Leeway workflow orchestration.",
      body: `# Leeway Workflows

Use this skill when the task is about multi-skill workflow composition, workflow acquisition, or workflow planning.

## Quick start

- Read \`references/workflows-quick-reference.md\` for the fast overview and navigation map.
- Read \`references/workflows-strategic-plan.md\` for the broader acquisition and orchestration strategy.
- Read \`references/skill-workflow-composition-matrix.md\` when mapping workflow steps to skills.
- Read \`references/workflow-toolkit.py\` when you need the normalization and registry automation script.
- Pair this skill with \`$leeway-agent-skills-platform\` for broader system context and domain skills for workflow steps.

## Reference map

- \`references/workflows-quick-reference.md\` -> concise workflow overview and patterns
- \`references/workflows-strategic-plan.md\` -> full workflow strategy and execution phases
- \`references/skill-workflow-composition-matrix.md\` -> skill-to-workflow dependency mapping
- \`references/workflow-toolkit.py\` -> workflow normalization and registry automation
`,
      references: [
        {
          name: "workflows-quick-reference.md",
          sourcePath: path.join(
            repoRoot,
            "documents",
            "LEEWAY_WORKFLOWS_QUICK_REFERENCE.md",
          ),
        },
        {
          name: "workflows-strategic-plan.md",
          sourcePath: path.join(
            repoRoot,
            "documents",
            "LEEWAY_WORKFLOWS_STRATEGIC_PLAN.md",
          ),
        },
        {
          name: "skill-workflow-composition-matrix.md",
          sourcePath: path.join(
            repoRoot,
            "documents",
            "SKILL_WORKFLOW_COMPOSITION_MATRIX.md",
          ),
        },
        {
          name: "workflow-toolkit.py",
          sourcePath: path.join(repoRoot, "scripts", "workflow-integration-toolkit.py"),
        },
      ],
    },
    {
      generatedName: buildGeneratedSkillName("npm-sdk", prefix),
      title: "Leeway NPM SDK",
      description:
        "Install, use, or extend the packaged @agentlee5/agent-skills npm SDK, CLI, extraction flow, and JavaScript imports. Use when Codex needs Leeway as a reusable package outside this repo, needs package paths, or must script the packaged MCP and standards surfaces.",
      shortDescription: "Leeway npm SDK and CLI guide",
      defaultPrompt:
        "Use $leeway-npm-sdk to install or script the packaged Leeway Agent Skills SDK.",
      body: `# Leeway NPM SDK

Use this skill when consuming Leeway as a package rather than directly from the source repository.

## Quick start

- Read \`references/npm-sdk.md\` for the package purpose, install command, CLI commands, and JavaScript usage.
- Read \`references/sdk-index.js\` to see the primary exported SDK surface.
- Read \`references/application-installer.js\` when extracting the packaged full application bundle into a writable directory.
- Read \`references/cli.js\` for the root CLI commands and how the packaged MCP and standards commands are delegated.
- Pair this skill with \`$leeway-mcp-server\` when the package is being used to launch the MCP server.

## Reference map

- \`references/npm-sdk.md\` -> package install and usage guide
- \`references/sdk-index.js\` -> top-level JavaScript exports
- \`references/application-installer.js\` -> full application extraction flow
- \`references/cli.js\` -> packaged CLI command behavior
`,
      references: [
        {
          name: "npm-sdk.md",
          sourcePath: path.join(repoRoot, "documents", "LEEWAY_NPM_SDK.md"),
        },
        {
          name: "sdk-index.js",
          sourcePath: path.join(repoRoot, "sdk", "index.js"),
        },
        {
          name: "application-installer.js",
          sourcePath: path.join(repoRoot, "sdk", "application-installer.js"),
        },
        {
          name: "cli.js",
          sourcePath: path.join(repoRoot, "bin", "leeway-skills.js"),
        },
      ],
    },
  ];
}

function parseArgs(argv) {
  const options = {
    dest: defaultExportRoot,
    install: false,
    installDest: defaultInstallRoot,
    overwrite: false,
    prefix: defaultPrefix,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--dest":
        options.dest = resolveCliPath(argv[index + 1]);
        index += 1;
        break;
      case "--install":
        options.install = true;
        break;
      case "--install-dest":
        options.installDest = resolveCliPath(argv[index + 1]);
        index += 1;
        break;
      case "--overwrite":
        options.overwrite = true;
        break;
      case "--prefix":
        options.prefix = argv[index + 1] ?? "";
        index += 1;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Export Leeway skills as Codex-native skill folders.

Usage:
  node scripts/export-codex-skills.js [options]

Options:
  --dest <path>          Local export directory (default: ${defaultExportRoot})
  --install              Copy exported skills into the user Codex skills directory
  --install-dest <path>  Override Codex skill install root (default: ${defaultInstallRoot})
  --overwrite            Replace existing exported or installed Leeway skill folders
  --prefix <value>       Prefix for generated skill names (default: "${defaultPrefix}")
  --help                 Show this help text
`);
}

function resolveCliPath(value) {
  if (!value) {
    throw new Error("Missing value for CLI option");
  }

  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function normalizeHeading(heading) {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function stripLeewayHeader(content) {
  return content.replace(/^\/\*[\s\S]*?\*\/\s*/, "").trim();
}

function parseSections(content) {
  const lines = content.split(/\r?\n/);
  const sections = new Map();
  let currentHeading = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      currentHeading = normalizeHeading(headingMatch[1]);
      sections.set(currentHeading, []);
      continue;
    }

    if (currentHeading) {
      sections.get(currentHeading).push(line);
    }
  }

  return sections;
}

function parseListItems(lines) {
  const items = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);

    if (bulletMatch) {
      items.push(cleanInlineMarkdown(bulletMatch[1]));
      continue;
    }

    if (numberedMatch) {
      items.push(cleanInlineMarkdown(numberedMatch[1]));
    }
  }

  return items.filter(Boolean);
}

function parseTags(lines) {
  const sectionText = lines.join("\n").trim();
  if (!sectionText) {
    return [];
  }

  const backtickTags = [...sectionText.matchAll(/`([^`]+)`/g)].map((match) =>
    cleanInlineMarkdown(match[1]),
  );

  if (backtickTags.length > 0) {
    return backtickTags.filter(Boolean);
  }

  return sectionText
    .split(/[,\n]/)
    .map((entry) => cleanInlineMarkdown(entry))
    .filter(Boolean);
}

function cleanInlineMarkdown(value) {
  return value
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;:,]+$/, "");
}

function ensureSentence(value) {
  if (!value) {
    return "";
  }

  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function truncate(value, limit) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, Math.max(0, limit - 3)).trimEnd()}...`;
}

function yamlQuote(value) {
  return JSON.stringify(value);
}

function joinList(items) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} or ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, or ${items[items.length - 1]}`;
}

async function listSkillDirectories(rootDir) {
  const results = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      const skillFile = path.join(fullPath, "SKILL.md");
      const hasSkill = await pathExists(skillFile);

      if (hasSkill) {
        results.push(fullPath);
        continue;
      }

      results.push(...(await listSkillDirectories(fullPath)));
    }
  }

  return results;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function loadRegistryDescriptions() {
  if (!(await pathExists(registryPath))) {
    return new Map();
  }

  const raw = await fs.readFile(registryPath, "utf8");
  const parsed = JSON.parse(raw);
  const registry = new Map();

  for (const entry of parsed.skills ?? []) {
    registry.set(path.normalize(entry.path), entry);
  }

  return registry;
}

function buildGeneratedSkillName(baseName, prefix) {
  return prefix ? `${prefix}${baseName}` : baseName;
}

function buildDefaultPrompt(skillName, title, useCases, capabilities) {
  const hint =
    useCases[0] ??
    capabilities[0] ??
    `work that matches ${title.toLowerCase()}`;

  return truncate(
    ensureSentence(`Use $${skillName} to help with ${hint.toLowerCase()}`),
    180,
  );
}

function buildDescription({ expert, registryDescription, useCases, capabilities, title }) {
  const primary =
    cleanInlineMarkdown(expert) ||
    cleanInlineMarkdown(registryDescription) ||
    `${title} expertise`;

  const whenCandidates =
    useCases.length > 0 ? useCases.slice(0, 5) : capabilities.slice(0, 4);

  if (whenCandidates.length === 0) {
    return truncate(
      `${ensureSentence(primary)} Use when the task directly matches ${title.toLowerCase()} work.`,
      420,
    );
  }

  return truncate(
    `${ensureSentence(primary)} Use when ${joinList(
      whenCandidates.map((item) => cleanInlineMarkdown(item).toLowerCase()),
    )}.`,
    420,
  );
}

function buildSkillBody(title) {
  return `# ${title}

Use this skill as the Codex entry point for the corresponding Leeway source skill.

## Quick start

- Read \`references/source-skill.md\` for the authoritative Leeway workflow before acting on a directly matching task.
- Apply \`$leeway-standards\` alongside this skill when editing code, configuration, or other tracked files in a Leeway-governed repository.
- Reuse the source skill's capabilities, workflow, and examples instead of inventing a new process from scratch.
- Combine this skill with adjacent Leeway skills when the task spans multiple domains.

## Reference map

- \`references/source-skill.md\` -> original Leeway skill content exported from this repo
`;
}

function buildOpenAiYaml({ displayName, shortDescription, defaultPrompt }) {
  return `interface:
  display_name: ${yamlQuote(displayName)}
  short_description: ${yamlQuote(shortDescription)}
  default_prompt: ${yamlQuote(defaultPrompt)}

policy:
  allow_implicit_invocation: true
`;
}

async function removeDirectoryIfNeeded(targetPath, overwrite) {
  const exists = await pathExists(targetPath);
  if (!exists) {
    return;
  }

  if (!overwrite) {
    throw new Error(
      `Refusing to overwrite existing directory without --overwrite: ${targetPath}`,
    );
  }

  await fs.rm(targetPath, { recursive: true, force: true });
}

async function writeFile(targetPath, content) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
}

function parseSkillFile(content) {
  const cleaned = stripLeewayHeader(content);
  const sections = parseSections(cleaned);
  const title =
    cleaned.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Untitled Skill";
  const expert =
    cleaned.match(/\*\*Expert in\*\*:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const useCases = parseListItems(sections.get("use this skill when") ?? []);
  const capabilities = parseListItems(sections.get("capabilities") ?? []);
  const tags = parseTags(sections.get("tags") ?? []);

  return { cleaned, title, expert, useCases, capabilities, tags };
}

async function buildGeneratedSkills(prefix) {
  const registry = await loadRegistryDescriptions();
  const skillDirs = await listSkillDirectories(sourceSkillsRoot);
  const generated = [];

  for (const skillDir of skillDirs.sort()) {
    const sourceSkillPath = path.join(skillDir, "SKILL.md");
    const sourceContent = await fs.readFile(sourceSkillPath, "utf8");
    const sourceRelPath = path.relative(repoRoot, sourceSkillPath).replace(/\\/g, "/");
    const parsed = parseSkillFile(sourceContent);
    const baseName = path.basename(skillDir);
    const generatedName = buildGeneratedSkillName(baseName, prefix);
    const registryEntry = registry.get(
      path.relative(repoRoot, skillDir).replace(/\\/g, "/"),
    );

    const description = buildDescription({
      expert: parsed.expert,
      registryDescription: registryEntry?.description ?? "",
      useCases: parsed.useCases,
      capabilities: parsed.capabilities,
      title: parsed.title,
    });

    generated.push({
      generatedName,
      title: parsed.title,
      description,
      defaultPrompt: buildDefaultPrompt(
        generatedName,
        parsed.title,
        parsed.useCases,
        parsed.capabilities,
      ),
      shortDescription: truncate(`${parsed.title} guidance`, 64),
      sourceRelPath,
      sourceContent,
      tags: parsed.tags,
      body: buildSkillBody(parsed.title),
      references: [
        {
          name: "source-skill.md",
          content: sourceContent,
        },
      ],
    });
  }

  generated.push(...buildApplicationSkillDefinitions(prefix));

  generated.push({
    generatedName: "leeway-standards",
    title: "Leeway Standards",
    description: leewayStandardsDescription,
    defaultPrompt:
      "Use $leeway-standards to keep this work compliant with Leeway headers, REGION and TAG metadata, and repo safety rules.",
    shortDescription: "Leeway governance and coding standards",
    sourceRelPath: "",
    sourceContent: "",
    tags: ["leeway", "governance", "headers", "compliance", "standards"],
    body: leewayStandardsBody,
    references: [
      {
        name: "compliance.md",
        sourcePath: path.join(
          repoRoot,
          "documents",
          "LEEWAY_STANDARDS_COMPLIANCE.md",
        ),
      },
      {
        name: "sdk-readme.md",
        sourcePath: path.join(repoRoot, "LeeWay-Standards", "README.md"),
      },
    ],
  });

  return generated;
}

async function exportSkills(exportRoot, generatedSkills, overwrite) {
  await fs.mkdir(exportRoot, { recursive: true });

  for (const skill of generatedSkills) {
    const skillRoot = path.join(exportRoot, skill.generatedName);
    await removeDirectoryIfNeeded(skillRoot, overwrite);
    await fs.mkdir(path.join(skillRoot, "agents"), { recursive: true });
    await fs.mkdir(path.join(skillRoot, "references"), { recursive: true });

    const skillMarkdown = `---
name: ${yamlQuote(skill.generatedName)}
description: ${yamlQuote(skill.description)}
---

${skill.body}`;

    await writeFile(path.join(skillRoot, "SKILL.md"), skillMarkdown);
    await writeFile(
      path.join(skillRoot, "agents", "openai.yaml"),
      buildOpenAiYaml({
        displayName: skill.title,
        shortDescription: skill.shortDescription,
        defaultPrompt: skill.defaultPrompt,
      }),
    );

    for (const reference of skill.references ?? []) {
      const content =
        reference.content ??
        (reference.sourcePath
          ? await fs.readFile(reference.sourcePath, "utf8")
          : "");
      await writeFile(path.join(skillRoot, "references", reference.name), content);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    repoRoot,
    exportRoot,
    skills: generatedSkills.map((skill) => ({
      name: skill.generatedName,
      title: skill.title,
      source: skill.sourceRelPath || "repo-docs",
      tags: skill.tags,
    })),
  };

  await writeFile(
    path.join(exportRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function copyDirectory(sourceDir, targetDir, overwrite) {
  await removeDirectoryIfNeeded(targetDir, overwrite);
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

async function installSkills(exportRoot, installRoot, generatedSkills, overwrite) {
  await fs.mkdir(installRoot, { recursive: true });

  for (const skill of generatedSkills) {
    const sourceDir = path.join(exportRoot, skill.generatedName);
    const targetDir = path.join(installRoot, skill.generatedName);
    await copyDirectory(sourceDir, targetDir, overwrite);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const generatedSkills = await buildGeneratedSkills(options.prefix);
  const allowExportOverwrite =
    path.resolve(options.dest) === path.resolve(defaultExportRoot) ||
    options.overwrite;

  await exportSkills(options.dest, generatedSkills, allowExportOverwrite);

  if (options.install) {
    await installSkills(
      options.dest,
      options.installDest,
      generatedSkills,
      options.overwrite,
    );
  }

  console.log(
    `Exported ${generatedSkills.length} Codex skills to ${options.dest}`,
  );

  if (options.install) {
    console.log(`Installed skills into ${options.installDest}`);
  } else {
    console.log("Use --install to copy them into the active Codex skills directory.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
