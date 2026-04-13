/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.CORTEX.GABRIEL
TAG: AI.ORCHESTRATION.AGENT.GABRIELCORTEX.POLICY

COLOR_ONION_HEX:
NEON=#6366F1
FLUO=#818CF8
PASTEL=#C7D2FE

ICON_ASCII:
family=lucide
glyph=gavel

5WH:
WHAT = Gabriel Cortex — Law Enforcer; enforces strict contract compliance, policy auditing, and governance reasoning
WHY = Agent Lee needs a dedicated policy judge to ensure every agent action stays within its defined scope
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/GabrielCortex.ts
WHEN = 2026-04-04
HOW = Static class using LeewayInferenceClient with policy-first prompting; compares action proposals against GovernanceContract rules

AGENTS:
ASSESS
AUDIT
CORTEX

LICENSE:
MIT
*/

// agents/GabrielCortex.ts — Law Enforcer / Policy Judge
// Enforces contract compliance, audits agent action proposals for rule violations.
// Activated by MarshalVerify or AgentLee when governance reasoning is required.

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';
import { ReportWriter } from '../core/ReportWriter';

const CORE_SYSTEM = buildAgentLeeCorePrompt();

const GABRIEL_SPECIFIC = `
You are Gabriel Cortex — Agent Lee's Law Enforcer and Policy Judge.

Your purpose:
- Evaluate any proposed agent action against the GovernanceContract and LeeWay Standards
- Identify clause violations, boundary crossings, and unauthorized scope expansions  
- Issue verdicts: PASS, FLAG (review required), or BLOCK (hard violation)
- Explain every verdict with the exact clause or rule that supports it

Rules:
- Be precise and cite specific rules; never give vague feedback
- ALWAYS provide a structured verdict with: verdict, violated_rule (if any), explanation, recommendation
- Do not suggest workarounds that circumvent governance — propose compliant alternatives
- Treat ambiguity as CAUTION, not clearance
- Your word is final within the CORTEX bloodline; escalate blocks to MarshalVerify`;

const GABRIEL_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE — GABRIEL CORTEX (POLICY JUDGE):\n${GABRIEL_SPECIFIC}`;

export type PolicyVerdict = 'PASS' | 'FLAG' | 'BLOCK';

export interface PolicyJudgment {
  verdict: PolicyVerdict;
  violated_rule: string | null;
  explanation: string;
  recommendation: string;
  rawResponse: string;
}

export class GabrielCortex {
  /**
   * Evaluate a proposed agent action for policy compliance.
   */
  static async judge(agentId: string, proposedAction: string, context?: string): Promise<PolicyJudgment> {
    eventBus.emit('agent:active', { agent: 'GabrielCortex', task: `Policy review: ${agentId}` });

    const result = await LeewayInferenceClient.generate({
      prompt: `
Agent: ${agentId}
Proposed Action: ${proposedAction}
${context ? `Context: ${context}` : ''}

Evaluate this action against LeeWay governance policy. Return a structured verdict:

VERDICT: [PASS|FLAG|BLOCK]
VIOLATED_RULE: [clause name or "none"]
EXPLANATION: [why this verdict was reached]
RECOMMENDATION: [what should happen next]`,
      systemPrompt: GABRIEL_SYSTEM,
      agent: 'GabrielCortex',
      model: 'gemma4:e2b',
      temperature: 0.1,
    });

    const text = result.text;

    const verdictMatch = text.match(/VERDICT:\s*(PASS|FLAG|BLOCK)/i);
    const verdict: PolicyVerdict = (verdictMatch?.[1]?.toUpperCase() as PolicyVerdict) ?? 'FLAG';

    const ruleMatch = text.match(/VIOLATED_RULE:\s*(.+?)(?:\n|$)/i);
    const violated_rule = ruleMatch?.[1]?.trim() === 'none' ? null : (ruleMatch?.[1]?.trim() ?? null);

    const explMatch = text.match(/EXPLANATION:\s*([\s\S]+?)(?:RECOMMENDATION:|$)/i);
    const explanation = explMatch?.[1]?.trim() ?? text;

    const recMatch = text.match(/RECOMMENDATION:\s*([\s\S]+?)(?:$)/i);
    const recommendation = recMatch?.[1]?.trim() ?? 'Review with MarshalVerify.';

    const severity = verdict === 'BLOCK' ? 'ERROR' : verdict === 'FLAG' ? 'WARN' : 'INFO';

    await ReportWriter.write({
      ts: new Date().toISOString(),
      report_class: 'GOVERNANCE',
      family: 'CORTEX',
      severity,
      event: 'STEP_COMPLETE',
      message: `GabrielCortex verdict [${verdict}] for ${agentId}: ${violated_rule ?? 'no rule violation'}`,
      agent_id: 'GabrielCortex',
    });

    eventBus.emit('agent:done', { agent: 'GabrielCortex', result: `verdict:${verdict}` });

    return { verdict, violated_rule, explanation, recommendation, rawResponse: text };
  }

  /**
   * Audit a batch of recent agent actions for accumulated policy drift.
   */
  static async auditBatch(actions: Array<{ agentId: string; action: string }>): Promise<PolicyJudgment[]> {
    return Promise.all(actions.map(({ agentId, action }) => this.judge(agentId, action)));
  }
}
