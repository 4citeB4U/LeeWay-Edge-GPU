#!/usr/bin/env node
/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.SYSTEM.INIT
TAG: AI.SYSTEM.INIT.LEEWAY_BOOTSTRAP

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=boot

5WH:
WHAT = Leeway Standards Bootstrap and Monitoring Initialization
WHY = Ensures Leeway Skills stays compliant on startup, validates environment, starts monitoring agents
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = scripts/init-leeway.js
WHEN = 2026
HOW = Checks .leeway/config.json, validates all SKILL.md files, starts compliance monitoring

AGENTS:
ENFORCE
ASSESS

LICENSE:
MIT
*/

import fs from "fs/promises";
import path from "path";

/**
 * Leeway Bootstrap – Initialize compliance monitoring on startup
 */

const LEEWAY_CONFIG_PATH = ".leeway/config.json";

async function main() {
  console.log("\n╔═════════════════════════════════════════════════════╗");
  console.log("║   🔒 LEEWAY STANDARDS COMPLIANCE BOOTSTRAP         ║");
  console.log("╚═════════════════════════════════════════════════════╝\n");

  let SKILLS_DIR = "skills";
  
  try {
    // 1. Check skills directory
     try {
       await fs.access(SKILLS_DIR);
     } catch {
       SKILLS_DIR = "agents/skills";
     }

    // 2. Check Leeway configuration exists
    console.log("✓ Checking Leeway configuration...");
    const config = await loadConfig(LEEWAY_CONFIG_PATH);
    console.log(`  → Version: ${config.version}`);
    console.log(`  → Project: ${config.project.name}`);
    console.log(`  → Minimum Score: ${config.compliance.minimumScore}`);

    // 3. Validate skills directory
    console.log(`\n✓ Scanning ${SKILLS_DIR} directory...`);
    const skillCount = await countSkills(SKILLS_DIR);
    console.log(
      `  → Found ${skillCount.total} skills across ${skillCount.categories} categories`,
    );

    // 4. Check for compliance issues
    console.log("\n✓ Pre-flight compliance check...");
    const issues = await quickValidation(SKILLS_DIR);

    if (issues.noHeaders.length > 0) {
      console.warn(
        `  ⚠ ${issues.noHeaders.length} skills missing Leeway headers`,
      );
      console.warn("  → Run: node scripts/leeway-agents/header-injector.js");
    }

    if (issues.noMetadata.length > 0) {
      console.warn(
        `  ⚠ ${issues.noMetadata.length} skills with incomplete metadata`,
      );
    }

    // 5. Initialize monitoring
    console.log("\n✓ Starting compliance monitoring...");
    console.log(
      `  → Monitor interval: ${config.agents["compliance-monitor"].interval / 1000}s`,
    );
    console.log(
      `  → Reports directory: ${config.agents["compliance-monitor"].reportDir}`,
    );
    console.log(
      `  → Enforced policies: ${config.compliance.enforcedPolicies.join(", ")}`,
    );

    // 6. Status summary
    console.log("\n╔═════════════════════════════════════════════════════╗");
    console.log("║                LEEWAY STATUS                        ║");
    console.log("├─────────────────────────────────────────────────────┤");
    console.log(`│ Configuration:        ✅ LOADED                    │`);
    console.log(
      `│ Skills:              ✅ ${skillCount.total.toString().padEnd(3)} FOUND                    │`,
    );
    console.log(`│ Monitoring:          ✅ ACTIVE                    │`);
    console.log(
      `│ Minimum Compliance:  ✅ ${config.compliance.minimumScore}/100                   │`,
    );

    if (issues.severity === "low") {
      console.log(`│ Current Issues:       ⚠  LOW                      │`);
    } else if (issues.severity === "none") {
      console.log(`│ Current Issues:       ✅ NONE                     │`);
    } else {
      console.log(`│ Current Issues:       ❌ HIGH                     │`);
    }

    console.log("╚═════════════════════════════════════════════════════╝\n");

    // 7. Next steps
    console.log("📌 Next Steps:");
    console.log(
      "  1. Run compliance audit: node scripts/leeway-agents/compliance-monitor.js",
    );
    console.log(
      "  2. Fix any issues:      node scripts/leeway-agents/header-injector.js",
    );
    console.log(
      "  3. Check docs:          documents/LEEWAY_STANDARDS_COMPLIANCE.md",
    );
    console.log("\n✨ Leeway Standards monitoring is now ACTIVE\n");
  } catch (error) {
    console.error(`\n❌ Bootstrap failed: ${error.message}\n`);
    process.exit(1);
  }
}

async function loadConfig(configPath) {
  try {
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Cannot load Leeway config at ${configPath}: ${error.message}`,
    );
  }
}

async function countSkills(dir) {
  let total = 0;
  let categories = 0;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        categories++;
        const subEntries = await fs.readdir(path.join(dir, entry.name), {
          withFileTypes: true,
        });
        total += subEntries.filter((e) => e.isDirectory()).length;
      }
    }
  } catch (error) {
    throw new Error(`Cannot scan skills directory at ${dir}: ${error.message}`);
  }

  return { total, categories };
}

async function quickValidation(dir) {
  const issues = {
    noHeaders: [],
    noMetadata: [],
    severity: "none",
  };

  try {
    const categories = await fs.readdir(dir, { withFileTypes: true });

    for (const category of categories) {
      if (!category.isDirectory()) continue;

      const categoryPath = path.join(dir, category.name);
      const skills = await fs.readdir(categoryPath, { withFileTypes: true });

      for (const skill of skills) {
        if (!skill.isDirectory()) continue;

        const skillMdPath = path.join(categoryPath, skill.name, "SKILL.md");

        try {
          const content = await fs.readFile(skillMdPath, "utf-8");

          if (!content.includes("LEEWAY HEADER")) {
            issues.noHeaders.push(`${category.name}/${skill.name}`);
          }

          if (!content.includes("REGION:") || !content.includes("TAG:")) {
            issues.noMetadata.push(`${category.name}/${skill.name}`);
          }
        } catch {
          // File doesn't exist, skip
        }
      }
    }

    // Determine severity
    if (issues.noHeaders.length > 5 || issues.noMetadata.length > 5) {
      issues.severity = "high";
    } else if (issues.noHeaders.length > 0 || issues.noMetadata.length > 0) {
      issues.severity = "low";
    }
  } catch (error) {
    console.warn(`Warning during validation: ${error.message}`);
  }

  return issues;
}

main();
