/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.ORCHESTRATION
TAG: AI.AGENT.DOCTOR.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=stethoscope

5WH:
WHAT = Doctor agent — runs a full system health and compliance diagnosis
WHY = The entire LEEWAY system must be diagnosable in a single command
WHO = Rapid Web Development
WHERE = src/agents/orchestration/doctor-agent.js
WHEN = 2026
HOW = Orchestrates assess, audit, runtime, env, and health checks into one unified report

AGENTS:
DOCTOR
ASSESS
AUDIT
HEALTH
ENV
RUNTIME

LICENSE:
MIT
*/

import { AssessAgent } from '../governance/assess-agent.js';
import { AuditAgent } from '../governance/audit-agent.js';
import { RuntimeAgent } from '../mcp/runtime-agent.js';
import { EnvAgent } from '../mcp/env-agent.js';
import { HealthAgentLite } from '../mcp/health-agent-lite.js';

/**
 * DoctorAgent orchestrates a full system health and compliance diagnosis.
 */
export class DoctorAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.options = options;
  }

  /**
   * Run a full system diagnosis.
   * @returns {Promise<DiagnosisReport>}
   */
  async run() {
    const startTime = Date.now();
    const report = {
      agent: 'doctor-agent',
      rootDir: this.rootDir,
      timestamp: new Date().toISOString(),
      checks: {},
      summary: {},
      healthy: true,
    };

    const assess = new AssessAgent({ rootDir: this.rootDir });
    const audit = new AuditAgent({ rootDir: this.rootDir });
    const runtime = new RuntimeAgent({ rootDir: this.rootDir });
    const env = new EnvAgent({ rootDir: this.rootDir });
    const health = HealthAgentLite.withSystemChecks();

    const [assessResult, auditResult, runtimeResult, envResult, healthResult] = await Promise.allSettled([
      assess.run(),
      audit.run(),
      runtime.check(),
      env.validate(),
      health.run(),
    ]);

    report.checks.assessment = assessResult.status === 'fulfilled'
      ? { status: 'pass', data: assessResult.value.summary }
      : { status: 'error', error: assessResult.reason?.message };

    report.checks.compliance = auditResult.status === 'fulfilled'
      ? {
          status: auditResult.value.summary.averageScore >= 60 ? 'pass' : 'warn',
          score: auditResult.value.summary.averageScore,
          level: auditResult.value.summary.complianceLevel,
        }
      : { status: 'error', error: auditResult.reason?.message };

    report.checks.runtime = runtimeResult.status === 'fulfilled'
      ? { status: runtimeResult.value.valid ? 'pass' : 'fail', issues: runtimeResult.value.issues }
      : { status: 'error', error: runtimeResult.reason?.message };

    report.checks.environment = envResult.status === 'fulfilled'
      ? { status: envResult.value.valid ? 'pass' : 'warn', missing: envResult.value.missing }
      : { status: 'error', error: envResult.reason?.message };

    report.checks.system = healthResult.status === 'fulfilled'
      ? { status: healthResult.value.healthy ? 'pass' : 'fail', summary: healthResult.value.summary }
      : { status: 'error', error: healthResult.reason?.message };

    const statuses = Object.values(report.checks).map(c => c.status);
    report.healthy = !statuses.includes('fail') && !statuses.includes('error');
    report.durationMs = Date.now() - startTime;

    const passCount = statuses.filter(s => s === 'pass').length;
    report.summary = {
      totalChecks: statuses.length,
      passed: passCount,
      warnings: statuses.filter(s => s === 'warn').length,
      failed: statuses.filter(s => s === 'fail' || s === 'error').length,
      status: report.healthy ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION',
    };

    return report;
  }

  /**
   * Format a diagnosis report as human-readable text.
   *
   * @param {object} report
   * @returns {string}
   */
  formatReport(report) {
    const lines = [
      '═══════════════════════════════════════════════',
      '          LEEWAY™ SYSTEM DOCTOR REPORT         ',
      '═══════════════════════════════════════════════',
      `Status    : ${report.summary.status}`,
      `Timestamp : ${report.timestamp}`,
      `Duration  : ${report.durationMs}ms`,
      '',
      '── CHECKS ──────────────────────────────────────',
    ];

    for (const [name, check] of Object.entries(report.checks)) {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️ ' : '❌';
      lines.push(`${icon} ${name.padEnd(15)} [${check.status.toUpperCase()}]`);
      if (check.issues?.length) lines.push(`   Issues: ${check.issues.slice(0, 2).join(', ')}`);
      if (check.missing?.length) lines.push(`   Missing env: ${check.missing.join(', ')}`);
      if (check.score !== undefined) lines.push(`   Score: ${check.score}/100 (${check.level})`);
    }

    lines.push('═══════════════════════════════════════════════');
    return lines.join('\n');
  }
}
