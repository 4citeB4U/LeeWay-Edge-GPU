/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.GOVERNANCE
TAG: AI.AGENT.AUDIT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=clipboard-check

5WH:
WHAT = Audit agent — scores compliance, generates reports, and blocks unsafe changes
WHY = LEEWAY systems must be continuously validated to remain stable and governable
WHO = Rapid Web Development
WHERE = src/agents/governance/audit-agent.js
WHEN = 2026
HOW = Aggregates compliance scores across all files, produces JSON and text reports

AGENTS:
AUDIT
ASSESS

LICENSE:
MIT
*/

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { scoreCompliance } from '../../core/compliance-scorer.js';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', 'coverage']);
const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']);

/**
 * AuditAgent scores the entire codebase for LEEWAY compliance and generates reports.
 */
export class AuditAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.outputDir = options.outputDir || join(this.rootDir, 'reports');
    this.log = options.log || (() => {});
  }

  /**
   * Run a full compliance audit.
   * @returns {Promise<AuditReport>}
   */
  async run() {
    const startTime = Date.now();
    const fileResults = [];

    await this._walkAndScore(this.rootDir, fileResults);

    const totalScore = fileResults.length > 0
      ? Math.round(fileResults.reduce((sum, r) => sum + r.score, 0) / fileResults.length)
      : 0;

    const report = {
      agent: 'audit-agent',
      rootDir: this.rootDir,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      summary: {
        totalFiles: fileResults.length,
        averageScore: totalScore,
        complianceLevel: this._getLevel(totalScore),
        passing: fileResults.filter(r => r.score >= 60).length,
        failing: fileResults.filter(r => r.score < 60).length,
        platinum: fileResults.filter(r => r.score >= 95).length,
        gold: fileResults.filter(r => r.score >= 80 && r.score < 95).length,
        silver: fileResults.filter(r => r.score >= 60 && r.score < 80).length,
        bronze: fileResults.filter(r => r.score >= 40 && r.score < 60).length,
        none: fileResults.filter(r => r.score < 40).length,
      },
      files: fileResults.sort((a, b) => a.score - b.score),
    };

    return report;
  }

  /**
   * Run audit and write reports to the output directory.
   * @returns {Promise<AuditReport>}
   */
  async runAndSave() {
    const report = await this.run();

    try {
      await mkdir(this.outputDir, { recursive: true });
      const jsonPath = join(this.outputDir, 'leeway-audit.json');
      const textPath = join(this.outputDir, 'leeway-audit.txt');
      await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
      await writeFile(textPath, this._formatTextReport(report), 'utf8');
      report.savedTo = { json: jsonPath, text: textPath };
    } catch (err) {
      report.saveError = err.message;
    }

    return report;
  }

  async _walkAndScore(dir, results, depth = 0) {
    if (depth > 10) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await this._walkAndScore(fullPath, results, depth + 1);
      } else if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) {
        const relPath = relative(this.rootDir, fullPath);
        try {
          const content = await readFile(fullPath, 'utf8');
          const result = scoreCompliance({ filePath: relPath, content });
          results.push({ file: relPath, ...result });
        } catch {
          results.push({ file: relPath, score: 0, level: 'NONE', issues: ['Could not read file'] });
        }
      }
    }
  }

  _getLevel(score) {
    if (score >= 95) return 'PLATINUM';
    if (score >= 80) return 'GOLD';
    if (score >= 60) return 'SILVER';
    if (score >= 40) return 'BRONZE';
    return 'NONE';
  }

  _formatTextReport(report) {
    const lines = [
      '═══════════════════════════════════════════════════',
      '           LEEWAY™ COMPLIANCE AUDIT REPORT         ',
      '═══════════════════════════════════════════════════',
      `Timestamp : ${report.timestamp}`,
      `Root Dir  : ${report.rootDir}`,
      `Duration  : ${report.durationMs}ms`,
      '',
      '── SUMMARY ─────────────────────────────────────────',
      `Total Files     : ${report.summary.totalFiles}`,
      `Average Score   : ${report.summary.averageScore}/100`,
      `Compliance Level: ${report.summary.complianceLevel}`,
      `Passing (≥60)   : ${report.summary.passing}`,
      `Failing (<60)   : ${report.summary.failing}`,
      '',
      '── BREAKDOWN ───────────────────────────────────────',
      `  🥇 Platinum (95-100): ${report.summary.platinum}`,
      `  🥈 Gold     (80-94) : ${report.summary.gold}`,
      `  🥉 Silver   (60-79) : ${report.summary.silver}`,
      `  🔶 Bronze   (40-59) : ${report.summary.bronze}`,
      `  ❌ None     (0-39)  : ${report.summary.none}`,
      '',
      '── FILES NEEDING ATTENTION ─────────────────────────',
    ];

    const failing = report.files.filter(f => f.score < 60).slice(0, 20);
    if (failing.length === 0) {
      lines.push('  ✅ All files pass minimum compliance threshold');
    } else {
      for (const f of failing) {
        lines.push(`  [${f.score.toString().padStart(3)}] ${f.file}`);
        for (const issue of (f.issues || []).slice(0, 3)) {
          lines.push(`         ↳ ${issue}`);
        }
      }
    }

    lines.push('═══════════════════════════════════════════════════');
    return lines.join('\n');
  }
}
