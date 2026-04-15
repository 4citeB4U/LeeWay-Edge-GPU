/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.REPORT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = report module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWay-Standards\leeway-sdk\src\report.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import { AuditResult } from './audit.js';

/**
 * Generate a Markdown report summarizing audit results.
 * Issues are grouped by file and separated into auto-fixable and manual.
 */
export function generateMarkdownReport(results: AuditResult[]): string {
  let md = '# LEEWAY Compliance Report\n\n';
  const overallScore = results.reduce((acc, r) => acc + r.complianceScore, 0) / (results.length || 1);
  const overallGrade = gradeFromScore(overallScore);
  md += `Overall compliance score: **${overallScore.toFixed(1)}** (Grade: **${overallGrade}**)\n\n`;
  for (const result of results) {
    md += `## ${result.filePath}\n`;
    md += `*Compliance Score:* ${result.complianceScore} (Grade: ${result.grade})\n\n`;
    const fixable = result.issues.filter(i => i.fixable);
    const manual = result.issues.filter(i => !i.fixable);
    if (fixable.length > 0) {
      md += '### Auto‑fixable Issues\n';
      for (const issue of fixable) {
        md += `- ${issue.description}\n`;
      }
      md += '\n';
    }
    if (manual.length > 0) {
      md += '### Manual Issues\n';
      for (const issue of manual) {
        md += `- ${issue.description}\n`;
      }
      md += '\n';
    }
  }
  return md;
}

function gradeFromScore(score: number): string {
  if (score >= 95) return 'GOLD';
  if (score >= 80) return 'SILVER';
  if (score >= 70) return 'BRONZE';
  return 'NON-COMPLIANT';
}