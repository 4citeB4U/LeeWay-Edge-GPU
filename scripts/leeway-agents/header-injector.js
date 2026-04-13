/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.COMPLIANCE
TAG: LEEWAY.SKILLS.COMPLIANCE.HEADER_INJECT

COLOR_ONION_HEX:
NEON=#FFC700
FLUO=#FF6B6B
PASTEL=#FFE5B4

ICON_ASCII:
family=lucide
glyph=plus

5WH:
WHAT = Leeway Header Injection Agent for Leeway Skills
WHY = Automatically adds required Leeway headers to SKILL.md files
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = scripts/leeway-agents/header-injector.js
WHEN = 2026
HOW = Scans skills directory and injects proper Leeway headers with metadata

AGENTS:
ENFORCE
AUDIT

LICENSE:
MIT
*/

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/**
 * HeaderInjectorAgent — adds Leeway headers to SKILL.md files
 *
 * Automatically injects required Leeway headers based on skill metadata.
 * Maps skill categories to Leeway REGION/TAG structure.
 */
export class HeaderInjectorAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.name = "header-injector";
    this.categoryMapping = this.buildCategoryMapping();
  }

  describe() {
    return {
      name: this.name,
      tag: "LEEWAY.SKILLS.COMPLIANCE.HEADER_INJECT",
      region: "LEEWAY.SKILLS.COMPLIANCE",
      what: "Injects Leeway headers into SKILL.md files",
      capabilities: ["inject-headers", "validate-headers", "auto-repair"],
    };
  }

  buildCategoryMapping() {
    return {
      "agent-autonomy": {
        region: "AI.AGENT.AUTONOMY",
        neon: "#39FF14",
        fluo: "#0DFF94",
      },
      "agent-orchestration": {
        region: "AI.AGENT.ORCHESTRATION",
        neon: "#FF00FF",
        fluo: "#FF1493",
      },
      "agent-patterns": {
        region: "AI.AGENT.PATTERNS",
        neon: "#00FFFF",
        fluo: "#00CED1",
      },
      "self-optimization": {
        region: "AI.OPTIMIZATION",
        neon: "#FFD700",
        fluo: "#FFA500",
      },
      "quality-assurance": {
        region: "AI.QA",
        neon: "#32CD32",
        fluo: "#00FF00",
      },
      "workflow-composition": {
        region: "AI.WORKFLOW",
        neon: "#FF6347",
        fluo: "#FF7F50",
      },
      "tool-integration": {
        region: "AI.TOOLS",
        neon: "#9370DB",
        fluo: "#9932CC",
      },
      "rag-knowledge": { region: "AI.RAG", neon: "#20B2AA", fluo: "#23D8D8" },
      "prompt-optimization": {
        region: "AI.PROMPTS",
        neon: "#FF69B4",
        fluo: "#FFB6C1",
      },
      "code-generation": {
        region: "DEV.CODEGEN",
        neon: "#39FF14",
        fluo: "#0DFF94",
      },
      "code-analysis": {
        region: "DEV.ANALYSIS",
        neon: "#FF1493",
        fluo: "#FF69B4",
      },
      testing: { region: "DEV.QA", neon: "#00FF00", fluo: "#32CD32" },
      security: { region: "DEV.SECURITY", neon: "#FF0000", fluo: "#DC143C" },
      devops: { region: "DEV.DEVOPS", neon: "#FF8C00", fluo: "#FFA500" },
    };
  }

  async run(context = {}) {
    const startTime = Date.now();
    const dryRun = context.dryRun || false;

    try {
      let skillsDir = path.join(this.rootDir, "skills");
      
      try {
        await fs.access(skillsDir);
      } catch {
        skillsDir = path.join(this.rootDir, "agents", "skills");
      }

      const results = {
        processed: [],
        skipped: [],
        errors: [],
      };

      // Get all skill directories
      const categories = await fs.readdir(skillsDir, { withFileTypes: true });

      for (const category of categories) {
        if (!category.isDirectory()) continue;

        const categoryPath = path.join(skillsDir, category.name);
        const skills = await fs.readdir(categoryPath, { withFileTypes: true });

        for (const skill of skills) {
          if (!skill.isDirectory()) continue;

          const skillPath = path.join(categoryPath, skill.name);
          const skillMdPath = path.join(skillPath, "SKILL.md");

          try {
            await this.processSkill(
              skillMdPath,
              category.name,
              skill.name,
              dryRun,
              results,
            );
          } catch (error) {
            results.errors.push({
              skill: skill.name,
              category: category.name,
              error: error.message,
            });
          }
        }
      }

      return {
        agent: this.name,
        status: "success",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        dryRun,
        result: {
          processed: results.processed.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
          details: {
            processed: results.processed,
            errors: results.errors,
          },
        },
      };
    } catch (error) {
      return {
        agent: this.name,
        status: "error",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async processSkill(skillMdPath, category, skillName, dryRun, results) {
    try {
      await fs.access(skillMdPath);
      const content = await fs.readFile(skillMdPath, "utf-8");

      // Check if header already exists
      if (content.includes("LEEWAY HEADER")) {
        results.skipped.push({
          skill: skillName,
          reason: "Header already present",
        });
        return;
      }

      // Generate header
      const mapping =
        this.categoryMapping[category] || this.getDefaultMapping(category);
      const header = this.generateHeader(skillName, category, mapping);
      const updatedContent = header + "\n\n" + content;

      // Write file
      if (!dryRun) {
        await fs.writeFile(skillMdPath, updatedContent, "utf-8");
      }

      results.processed.push({
        skill: skillName,
        category: category,
        status: dryRun ? "would-update" : "updated",
      });
    } catch (error) {
      if (error.code === "ENOENT") {
        results.skipped.push({
          skill: skillName,
          reason: "SKILL.md not found",
        });
      } else {
        throw error;
      }
    }
  }

  generateHeader(skillName, category, mapping) {
    const tag = `${mapping.region}.${skillName.toUpperCase().replace(/-/g, "_")}`;
    const WHO = "Leeway Industries (By Leonard Jerome Lee)";
    const WHERE = `skills/${category}/${skillName}/SKILL.md`;
    const WHEN = new Date().getFullYear();

    return `/*
LEEWAY HEADER — DO NOT REMOVE

REGION: ${mapping.region}
TAG: ${tag}

COLOR_ONION_HEX:
NEON=${mapping.neon}
FLUO=${mapping.fluo}
PASTEL=#E8F5E9

ICON_ASCII:
family=lucide
glyph=zap

5WH:
WHAT = ${skillName.replace(/-/g, " ")} skill for Leeway-compliant AI systems
WHY = Provides capabilities for ${category} within the AIskills ecosystem
WHO = ${WHO}
WHERE = ${WHERE}
WHEN = ${WHEN}
HOW = Leeway-governed skill.md definition with structured capabilities and tags

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/`;
  }

  getDefaultMapping(category) {
    return {
      region: `AI.SKILL.${category.toUpperCase().replace(/-/g, "_")}`,
      neon: "#39FF14",
      fluo: "#0DFF94",
    };
  }
}

export default HeaderInjectorAgent;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const agent = new HeaderInjectorAgent();
  const result = await agent.run({ dryRun });

  if (result.status !== "success") {
    console.error("[Leeway Header Injector] Failed:", result.error);
    process.exit(1);
  }

  const action = dryRun ? "would update" : "updated";
  console.log(
    `[Leeway Header Injector] ${action} ${result.result.processed} skill files`,
  );
  console.log(
    `[Leeway Header Injector] skipped ${result.result.skipped} skill files`,
  );

  if (result.result.errors > 0) {
    console.error(
      `[Leeway Header Injector] encountered ${result.result.errors} errors`,
    );
    result.result.details.errors.forEach((error) => {
      console.error(
        `  - ${error.category}/${error.skill}: ${error.error ?? "Unknown error"}`,
      );
    });
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error("[Leeway Header Injector] Fatal error:", error);
    process.exit(1);
  });
}
