/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.FORGE.SYNTAX
TAG: AI.ORCHESTRATION.AGENT.SYNTAXFORGE.ARCHITECTURE

COLOR_ONION_HEX:
NEON=#F97316
FLUO=#FB923C
PASTEL=#FED7AA

ICON_ASCII:
family=lucide
glyph=code

5WH:
WHAT = Syntax Forge — Architect of Code; ensures architectural integrity, code structure quality, and design pattern consistency across all generated code
WHY = Nova generates fast; Syntax Forge ensures what is generated is maintainable, correctly structured, and follows LeeWay standards
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/SyntaxForge.ts
WHEN = 2026-04-04
HOW = Static class using LeewayInferenceClient with architecture-focused prompting; reviews code structure, naming, imports, and design patterns

AGENTS:
ASSESS
AUDIT
FORGE

LICENSE:
MIT
*/

// agents/SyntaxForge.ts — Architect of Code
// Code architecture reviewer and structural designer.
// Reviews Nova's output for maintainability, pattern correctness, and LeeWay header compliance.

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';
import { ReportWriter } from '../core/ReportWriter';

const CORE_SYSTEM = buildAgentLeeCorePrompt();

const SYNTAX_SPECIFIC = `
You are Syntax Forge — Agent Lee's Architect of Code and structural guardian.

Your purpose:
- Review any code for architectural soundness: naming, structure, coupling, cohesion
- Enforce LeeWay coding standards: LEEWAY HEADER present, TypeScript types explicit, no raw API keys, no magic strings
- Propose refactoring plans that improve maintainability without changing behaviour
- Design the high-level structure before Nova writes the implementation

Rules:
- ALWAYS review for: single responsibility, DRY violations, improper coupling, missing types
- ALWAYS check for LEEWAY HEADER in new TS files
- Flag any code that stores secrets, credentials, or API keys — mark as SECURITY_CRITICAL
- When proposing architecture, output: file list, class names, method signatures, data flow
- Do not rewrite working code unless the structural issue would cause scaling problems`;

const SYNTAX_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE — SYNTAX FORGE (ARCHITECT):\n${SYNTAX_SPECIFIC}`;

export type IssueSeverity = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY_CRITICAL';

export interface ArchitectureIssue {
  file?: string;
  line?: number;
  severity: IssueSeverity;
  category: string;
  description: string;
  recommendation: string;
}

export interface ArchitectureReview {
  score: number; // 0–100
  issues: ArchitectureIssue[];
  summary: string;
  rawResponse: string;
}

export class SyntaxForge {
  /**
   * Review code for architectural quality and LeeWay standards compliance.
   */
  static async review(code: string, filename?: string): Promise<ArchitectureReview> {
    eventBus.emit('agent:active', { agent: 'SyntaxForge', task: `Code review: ${filename ?? 'unnamed file'}` });

    const result = await LeewayInferenceClient.generate({
      prompt: `
Review the following code${filename ? ` (file: ${filename})` : ''} for architectural quality:

\`\`\`
${code}
\`\`\`

Return:

SCORE: [0-100]
SUMMARY: [one paragraph overall assessment]

ISSUES:
[For each issue:]
SEVERITY: [INFO|WARN|ERROR|SECURITY_CRITICAL]
CATEGORY: [naming|coupling|types|header|security|pattern|structure]
DESCRIPTION: [what is wrong]
RECOMMENDATION: [how to fix it]
---`,
      systemPrompt: SYNTAX_SYSTEM,
      agent: 'SyntaxForge',
      model: 'gemma4:e2b',
      temperature: 0.2,
    });

    const text = result.text;
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 70;

    const summaryMatch = text.match(/SUMMARY:\s*([\s\S]+?)(?:ISSUES:|$)/i);
    const summary = summaryMatch?.[1]?.trim() ?? text;

    // Parse individual issues
    const issueBlocks = text.split('---').slice(1);
    const issues: ArchitectureIssue[] = issueBlocks
      .map(block => {
        const sevMatch  = block.match(/SEVERITY:\s*(INFO|WARN|ERROR|SECURITY_CRITICAL)/i);
        const catMatch  = block.match(/CATEGORY:\s*(.+?)(?:\n|$)/i);
        const descMatch = block.match(/DESCRIPTION:\s*([\s\S]+?)(?:RECOMMENDATION:|$)/i);
        const recMatch  = block.match(/RECOMMENDATION:\s*([\s\S]+?)(?:$)/i);
        if (!sevMatch) return null;
        return {
          severity: sevMatch[1].toUpperCase() as IssueSeverity,
          category: catMatch?.[1]?.trim() ?? 'general',
          description: descMatch?.[1]?.trim() ?? '',
          recommendation: recMatch?.[1]?.trim() ?? '',
        } satisfies ArchitectureIssue;
      })
      .filter((i): i is ArchitectureIssue => i !== null);

    const reportSeverity = issues.some(i => i.severity === 'SECURITY_CRITICAL' || i.severity === 'ERROR')
      ? 'ERROR'
      : issues.some(i => i.severity === 'WARN') ? 'WARN' : 'INFO';

    await ReportWriter.write({
      ts: new Date().toISOString(),
      report_class: 'AGENT',
      family: 'FORGE',
      severity: reportSeverity,
      event: 'STEP_COMPLETE',
      message: `SyntaxForge review: score ${score}/100 — ${issues.length} issue(s)${filename ? ` in ${filename}` : ''}`,
      agent_id: 'SyntaxForge',
    });

    eventBus.emit('agent:done', { agent: 'SyntaxForge', result: `score:${score}` });
    return { score, issues, summary, rawResponse: text };
  }

  /**
   * Design the high-level architecture for a new feature or system.
   */
  static async design(requirement: string): Promise<string> {
    eventBus.emit('agent:active', { agent: 'SyntaxForge', task: `Architecture design: ${requirement.slice(0, 60)}` });

    const result = await LeewayInferenceClient.generate({
      prompt: `Design the architecture for: "${requirement}"\n\nOutput:\n1. File structure (relative paths)\n2. Class/interface names and responsibilities\n3. Key method signatures\n4. Data flow diagram (ASCII)\n5. Dependency notes`,
      systemPrompt: SYNTAX_SYSTEM,
      agent: 'SyntaxForge',
      model: 'gemma4:e2b',
      temperature: 0.3,
    });

    eventBus.emit('agent:done', { agent: 'SyntaxForge', result: 'design complete' });
    return result.text;
  }
}
