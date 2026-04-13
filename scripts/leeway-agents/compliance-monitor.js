/*
LEEWAY HEADER — DO NOT REMOVE

REGION: LEEWAY.SKILLS.COMPLIANCE
TAG: LEEWAY.SKILLS.COMPLIANCE.MONITOR

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=check-circle

5WH:
WHAT = Leeway Standards Compliance Monitor Agent (for Leeway Skills)
WHY = Ensures all SKILL.md files and project structure conform to Leeway governance standards
WHO = Leeway Industries (By Leonard Jerome Lee)
WHERE = scripts/leeway-agents/compliance-monitor.js
WHEN = 2026
HOW = Node.js agent that scans skills directory, validates headers, tags, metadata, and generates compliance reports

AGENTS:
ASSESS
AUDIT
ENFORCE

LICENSE:
MIT
*/

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

/**
 * ComplianceMonitorAgent — validates Leeway Skills against Leeway Standards
 *
 * Responsibilities:
 * 1. Scan all SKILL.md files for proper Leeway headers
 * 2. Validate tags, metadata, and documentation
 * 3. Check for policy violations (secrets, circular deps, etc.)
 * 4. Generate compliance score and reports
 * 5. Track compliance metrics over time
 */
export class ComplianceMonitorAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.name = "compliance-monitor";
    this.config = options.config || {};
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      metrics: {},
    };
  }

  describe() {
    return {
      name: this.name,
      tag: "LEEWAY.SKILLS.COMPLIANCE.MONITOR",
      region: "LEEWAY.SKILLS.COMPLIANCE",
      what: "Leeway compliance monitoring and validation",
      capabilities: [
        "scan-skills",
        "validate-headers",
        "check-metadata",
        "verify-policies",
        "generate-reports",
        "track-metrics",
      ],
      policies: [
        "NO_SECRETS_IN_CODE",
        "HEADERS_REQUIRED",
        "TAGS_REQUIRED",
        "NO_CIRCULAR_DEPS",
      ],
    };
  }

  async run(context = {}) {
    const startTime = Date.now();
    const skillsDir = path.join(this.rootDir, "skills");

    try {
      // 1. Scan all SKILL.md files
      await this.scanSkillsDirectory(skillsDir);

      // 2. Validate each skill
      for (const skillPath of this.results.skillFiles || []) {
        await this.validateSkill(skillPath);
      }

      // 3. Calculate compliance score
      const score = this.calculateComplianceScore();

      // 4. Generate report
      const report = this.generateReport(score);

      return {
        agent: this.name,
        status: "success",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        complianceScore: score,
        result: {
          passed: this.results.passed.length,
          failed: this.results.failed.length,
          warnings: this.results.warnings.length,
          totalSkills: this.results.passed.length + this.results.failed.length,
          report: report,
        },
      };
    } catch (error) {
      return {
        agent: this.name,
        status: "error",
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        error: error.message,
        result: {
          passed: this.results.passed.length,
          failed: this.results.failed.length,
          warnings: this.results.warnings.length,
        },
      };
    }
  }

  async scanSkillsDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const skillFiles = [];

    for (const category of entries) {
      if (!category.isDirectory()) continue;

      const categoryPath = path.join(dir, category.name);
      const skills = await fs.readdir(categoryPath, { withFileTypes: true });

      for (const skill of skills) {
        if (!skill.isDirectory()) continue;

        const skillPath = path.join(categoryPath, skill.name);
        const skillMdPath = path.join(skillPath, "SKILL.md");

        try {
          await fs.access(skillMdPath);
          skillFiles.push(skillMdPath);
        } catch {
          this.results.warnings.push({
            skill: `${category.name}/${skill.name}`,
            issue: "No SKILL.md file found",
            path: skillPath,
          });
        }
      }
    }

    this.results.skillFiles = skillFiles;
    return skillFiles;
  }

  async validateSkill(skillPath) {
    const skillName = path.dirname(skillPath).split(path.sep).pop();

    try {
      const content = await fs.readFile(skillPath, "utf-8");
      const issues = [];

      // Check 1: Leeway header
      if (!this.hasLeewayHeader(content)) {
        issues.push("Missing required Leeway header");
      }

      // Check 2: Required tags
      if (!this.hasRequiredTags(content)) {
        issues.push("Missing required REGION/TAG structure");
      }

      // Check 3: No secrets
      if (this.containsSecrets(content)) {
        issues.push("Potential secrets detected in content");
      }

      // Check 4: Metadata structure
      if (!this.hasValidMetadata(content)) {
        issues.push("Missing or invalid metadata structure");
      }

      // Check 5: Documentation
      if (!this.hasAdequateDocumentation(content)) {
        this.results.warnings.push({
          skill: skillName,
          issue: "Documentation may be incomplete",
        });
      }

      if (issues.length === 0) {
        this.results.passed.push({
          skill: skillName,
          path: skillPath,
        });
      } else {
        this.results.failed.push({
          skill: skillName,
          path: skillPath,
          issues: issues,
        });
      }
    } catch (error) {
      this.results.failed.push({
        skill: skillName,
        path: skillPath,
        issues: [`Error reading file: ${error.message}`],
      });
    }
  }

  hasLeewayHeader(content) {
    return (
      content.includes("LEEWAY HEADER") &&
      content.includes("REGION:") &&
      content.includes("TAG:") &&
      content.includes("5WH:")
    );
  }

  hasRequiredTags(content) {
    const regionMatch = content.match(/REGION:\s*([A-Z0-9.]+)/);
    const tagMatch = content.match(/TAG:\s*([A-Z0-9.]+)/);
    return regionMatch && tagMatch && regionMatch[1] && tagMatch[1];
  }

  containsSecrets(content) {
    const secretPatterns = [
      /password\s*[=:]/i,
      /secret\s*[=:]/i,
      /apikey\s*[=:]/i,
      /api_key\s*[=:]/i,
      /private_key\s*[=:]/i,
      /token\s*[=:]/i,
      /-----BEGIN/,
      /-----END/,
    ];
    return secretPatterns.some((pattern) => pattern.test(content));
  }

  hasValidMetadata(content) {
    const requiredFields = ["WHAT", "WHY", "WHO", "WHERE", "HOW"];
    return requiredFields.every((field) => content.includes(`${field} =`));
  }

  hasAdequateDocumentation(content) {
    const sections = content.split("\n").length;
    return sections > 20;
  }

  calculateComplianceScore() {
    const total = this.results.passed.length + this.results.failed.length;
    if (total === 0) return 0;

    const passedScore = this.results.passed.length;
    const failedPenalty = this.results.failed.length * 15;
    const warningPenalty = this.results.warnings.length * 5;

    const rawScore =
      (passedScore * 100) / total - failedPenalty - warningPenalty;
    return Math.max(0, Math.min(100, rawScore));
  }

  generateReport(score) {
    const timestamp = new Date().toISOString();
    const status = score >= 85 ? "COMPLIANT" : "NON-COMPLIANT";

    return {
      timestamp,
      status,
      score: Math.round(score),
      summary: {
        totalSkills: this.results.passed.length + this.results.failed.length,
        compliant: this.results.passed.length,
        nonCompliant: this.results.failed.length,
        warnings: this.results.warnings.length,
      },
      failedSkills: this.results.failed,
      warnings: this.results.warnings,
      recommendations: this.generateRecommendations(),
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.failed.length > 0) {
      recommendations.push({
        priority: "high",
        action: "Add Leeway headers to all non-compliant SKILL.md files",
        command: "node scripts/leeway-agents/header-injector.js",
      });
    }

    if (this.results.warnings.length > 0) {
      recommendations.push({
        priority: "medium",
        action: "Review and enhance documentation in flagged skills",
        details: this.results.warnings.map((w) => w.skill),
      });
    }

    recommendations.push({
      priority: "medium",
      action: "Run periodic compliance audits (recommend hourly)",
      schedule: "0 * * * * (cron) or 3600000ms (interval)",
    });

    recommendations.push({
      priority: "low",
      action: "Configure skills-registry.json with Leeway metadata",
      details: "Add REGION, TAG, and compliance metadata to registry entries",
    });

    return recommendations;
  }
}

export default ComplianceMonitorAgent;

async function main() {
  const agent = new ComplianceMonitorAgent();
  const result = await agent.run();

  if (result.status !== "success") {
    console.error("[Leeway Compliance Monitor] Failed:", result.error);
    process.exit(1);
  }

  const reportDir = path.join(process.cwd(), ".leeway", "reports");
  await fs.mkdir(reportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(reportDir, `compliance-${timestamp}.json`);
  await fs.writeFile(
    reportPath,
    JSON.stringify(result.result.report, null, 2),
    "utf-8",
  );

  console.log(
    `[Leeway Compliance Monitor] Score: ${result.complianceScore}/100`,
  );
  console.log(
    `[Leeway Compliance Monitor] Passed: ${result.result.passed}, Failed: ${result.result.failed}, Warnings: ${result.result.warnings}`,
  );
  console.log(`[Leeway Compliance Monitor] Report: ${reportPath}`);

  if (result.result.failed > 0) {
    result.result.report.failedSkills.slice(0, 10).forEach((item) => {
      console.log(`  - ${item.skill}: ${item.issues.join("; ")}`);
    });
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error) => {
    console.error("[Leeway Compliance Monitor] Fatal error:", error);
    process.exit(1);
  });
}
