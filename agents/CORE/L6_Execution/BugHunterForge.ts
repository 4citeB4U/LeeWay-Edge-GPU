/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.FORGE.BUGHUNTER
TAG: AI.ORCHESTRATION.AGENT.BUGHUNTERFORGE.DEBUG

COLOR_ONION_HEX:
NEON=#F97316
FLUO=#FB923C
PASTEL=#FED7AA

ICON_ASCII:
family=lucide
glyph=bug

5WH:
WHAT = BugHunter Forge — Seeker of Faults; locates root causes of instability, defects, and unexpected system behaviours
WHY = Nova writes code quickly; BugHunter ensures every defect is traced to its origin before a fix is applied
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/BugHunterForge.ts
WHEN = 2026-04-04
HOW = Static class using LeewayInferenceClient with diagnostic prompting; reads stack traces, logs, and error patterns; generates unit test cases for each bug

AGENTS:
ASSESS
AUDIT
FORGE

LICENSE:
MIT
*/

// agents/BugHunterForge.ts — Seeker of Faults
// Root cause analysis, stack trace interpretation, and targeted fix recommendations.
// Generates minimal reproduction cases and unit tests for every discovered bug.

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';
import { ReportWriter } from '../core/ReportWriter';

const CORE_SYSTEM = buildAgentLeeCorePrompt();

const BUGHUNTER_SPECIFIC = `
You are BugHunter Forge — Agent Lee's relentless defect detective.

Your purpose:
- Read stack traces, error logs, and code to identify the exact root cause of any defect
- Never suggest a fix without first establishing a confirmed root cause
- Generate a minimal reproducible test case for every bug found
- Propose the most targeted fix possible — no unnecessary refactoring
- Assess whether the bug is a symptom of a deeper architectural issue

Rules:
- ALWAYS verify your root cause hypothesis against the provided evidence
- ALWAYS generate at least one failing test case that proves the bug exists
- NEVER patch symptoms — trace to origin
- If the stack trace is ambiguous, list all candidate root causes ranked by probability
- Mark any recommended fix that touches Z1/Z2 boundaries as REQUIRES_APPROVAL`;

const BUGHUNTER_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE — BUGHUNTER FORGE (DEBUG):\n${BUGHUNTER_SPECIFIC}`;

export interface BugReport {
  root_cause: string;
  confidence: number; // 0–100
  affected_files: string[];
  reproduction_steps: string[];
  failing_test: string;
  proposed_fix: string;
  requires_approval: boolean;
  rawResponse: string;
}

export class BugHunterForge {
  /**
   * Analyse an error or stack trace and produce a full bug report.
   */
  static async hunt(errorOrStackTrace: string, codeContext?: string): Promise<BugReport> {
    eventBus.emit('agent:active', { agent: 'BugHunterForge', task: `Bug hunt: ${errorOrStackTrace.slice(0, 60)}...` });

    const contextBlock = codeContext ? `\nCode Context:\n\`\`\`\n${codeContext}\n\`\`\`` : '';

    const result = await LeewayInferenceClient.generate({
      prompt: `
Error / Stack Trace:
\`\`\`
${errorOrStackTrace}
\`\`\`
${contextBlock}

Analyse this defect and return:

ROOT_CAUSE: [exact cause]
CONFIDENCE: [0-100]%
AFFECTED_FILES: [comma-separated list]
REPRODUCTION_STEPS:
1. [step]
2. [step]
FAILING_TEST:
\`\`\`typescript
// Minimal test that reproduces the bug
\`\`\`
PROPOSED_FIX:
\`\`\`
// Targeted fix
\`\`\`
REQUIRES_APPROVAL: [YES|NO]`,
      systemPrompt: BUGHUNTER_SYSTEM,
      agent: 'BugHunterForge',
      model: 'gemma4:e2b',
      temperature: 0.2,
    });

    const text = result.text;

    const rootMatch   = text.match(/ROOT_CAUSE:\s*(.+?)(?:\n|$)/i);
    const confMatch   = text.match(/CONFIDENCE:\s*(\d+)/i);
    const filesMatch  = text.match(/AFFECTED_FILES:\s*(.+?)(?:\n|$)/i);
    const approvalMatch = text.match(/REQUIRES_APPROVAL:\s*(YES|NO)/i);

    const stepsBlock  = text.match(/REPRODUCTION_STEPS:([\s\S]+?)(?:FAILING_TEST:|$)/i);
    const testBlock   = text.match(/FAILING_TEST:([\s\S]+?)(?:PROPOSED_FIX:|$)/i);
    const fixBlock    = text.match(/PROPOSED_FIX:([\s\S]+?)(?:REQUIRES_APPROVAL:|$)/i);

    const report: BugReport = {
      root_cause: rootMatch?.[1]?.trim() ?? 'Unable to determine root cause from provided information',
      confidence: confMatch ? parseInt(confMatch[1], 10) : 50,
      affected_files: filesMatch?.[1]?.split(',').map(f => f.trim()) ?? [],
      reproduction_steps: stepsBlock?.[1]?.trim().split('\n').filter(l => l.trim()) ?? [],
      failing_test: testBlock?.[1]?.trim() ?? '',
      proposed_fix: fixBlock?.[1]?.trim() ?? '',
      requires_approval: approvalMatch?.[1]?.toUpperCase() === 'YES',
      rawResponse: text,
    };

    await ReportWriter.write({
      ts: new Date().toISOString(),
      report_class: 'AGENT',
      family: 'FORGE',
      severity: 'WARN',
      event: 'STEP_COMPLETE',
      message: `BugHunterForge: root cause found — ${report.root_cause.slice(0, 80)} (confidence: ${report.confidence}%)`,
      agent_id: 'BugHunterForge',
    });

    eventBus.emit('agent:done', { agent: 'BugHunterForge', result: `root_cause found, confidence:${report.confidence}%` });
    return report;
  }

  /**
   * Generate unit tests for a given function to prevent regression.
   */
  static async generateTests(functionCode: string, language = 'typescript'): Promise<string> {
    eventBus.emit('agent:active', { agent: 'BugHunterForge', task: 'Regression test generation' });

    const result = await LeewayInferenceClient.generate({
      prompt: `Generate comprehensive unit tests for the following ${language} function. Cover happy path, edge cases, and error conditions.\n\n\`\`\`${language}\n${functionCode}\n\`\`\``,
      systemPrompt: BUGHUNTER_SYSTEM,
      agent: 'BugHunterForge',
      model: 'gemma4:e2b',
      temperature: 0.2,
    });

    eventBus.emit('agent:done', { agent: 'BugHunterForge', result: 'tests generated' });
    return result.text;
  }
}
