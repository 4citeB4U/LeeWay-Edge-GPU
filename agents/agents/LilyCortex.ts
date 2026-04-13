/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.CORTEX.LILY
TAG: AI.ORCHESTRATION.AGENT.LILYCORTEX.REASONING

COLOR_ONION_HEX:
NEON=#6366F1
FLUO=#818CF8
PASTEL=#C7D2FE

ICON_ASCII:
family=lucide
glyph=brain

5WH:
WHAT = Lily Cortex — Weaver of Thought; processes complex multi-step logic, analytical synthesis, and structured reasoning
WHY = Provides dedicated high-precision reasoning so Agent Lee can tackle mathematical, philosophical, and scientific problems without overwhelming the primary orchestrator
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/LilyCortex.ts
WHEN = 2026-04-04
HOW = Static class using LeewayInferenceClient with chain-of-thought prompting and step-by-step decomposition

AGENTS:
ASSESS
AUDIT
leeway
CORTEX

LICENSE:
MIT
*/

// agents/LilyCortex.ts — Weaver of Thought
// Handles complex multi-step reasoning, analytical synthesis, and logical problem solving.
// Activated when a task requires deep structured thought rather than action execution.

import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { eventBus } from '../core/EventBus';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';
import { ReportWriter } from '../core/ReportWriter';

const CORE_SYSTEM = buildAgentLeeCorePrompt();

const LILY_SPECIFIC = `
You are Lily Cortex — Agent Lee's dedicated reasoning engine and Weaver of Thought.

Your purpose:
- Decompose complex problems into clear logical steps
- Synthesize multi-domain knowledge into coherent structured answers
- Surface hidden assumptions and edge cases
- Apply formal reasoning (deductive, inductive, abductive) as appropriate

Rules:
- ALWAYS show your chain of thought step by step
- ALWAYS identify and state any assumptions you are making
- ALWAYS validate conclusions against the original question
- Use precise, unambiguous language; avoid vague hedging
- Where multiple valid answers exist, enumerate them clearly with trade-offs
- Flag logical contradictions immediately and propose resolutions`;

const LILY_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE — LILY CORTEX (REASONING):\n${LILY_SPECIFIC}`;

export interface ReasoningResult {
  steps: string[];
  conclusion: string;
  assumptions: string[];
  confidence: number; // 0–100
  rawResponse: string;
}

export class LilyCortex {
  /**
   * Perform deep structured reasoning on a complex problem or question.
   */
  static async reason(problem: string): Promise<ReasoningResult> {
    eventBus.emit('agent:active', { agent: 'LilyCortex', task: `Reasoning: ${problem.slice(0, 80)}` });

    const result = await LeewayInferenceClient.generate({
      prompt: `
Reason through the following problem step by step:

PROBLEM: ${problem}

Format your response as:
STEPS:
1. [first reasoning step]
2. [next step]
...

ASSUMPTIONS:
- [any assumption made]

CONCLUSION:
[final answer or synthesis]

CONFIDENCE: [0-100]%`,
      systemPrompt: LILY_SYSTEM,
      agent: 'LilyCortex',
      model: 'gemma4:e2b',
      temperature: 0.3,
    });

    const text = result.text;

    // Extract steps
    const stepsMatch = text.match(/STEPS:([\s\S]*?)(?:ASSUMPTIONS:|CONCLUSION:)/i);
    const steps = stepsMatch
      ? stepsMatch[1].trim().split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, '').trim())
      : [];

    // Extract assumptions
    const assumptionsMatch = text.match(/ASSUMPTIONS:([\s\S]*?)(?:CONCLUSION:)/i);
    const assumptions = assumptionsMatch
      ? assumptionsMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
      : [];

    // Extract conclusion
    const conclusionMatch = text.match(/CONCLUSION:([\s\S]*?)(?:CONFIDENCE:|$)/i);
    const conclusion = conclusionMatch ? conclusionMatch[1].trim() : text;

    // Extract confidence
    const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 75;

    await ReportWriter.write({
      ts: new Date().toISOString(),
      report_class: 'AGENT',
      family: 'CORTEX',
      severity: 'INFO',
      event: 'STEP_COMPLETE',
      message: `LilyCortex reasoning complete — ${steps.length} steps, confidence ${confidence}%`,
      agent_id: 'LilyCortex',
    });

    eventBus.emit('agent:done', { agent: 'LilyCortex', result: `reasoning(${steps.length} steps, ${confidence}%)` });

    return { steps, conclusion, assumptions, confidence, rawResponse: text };
  }

  /**
   * Synthesize multiple sources of information into a unified structured understanding.
   */
  static async synthesize(topic: string, sources: string[]): Promise<string> {
    eventBus.emit('agent:active', { agent: 'LilyCortex', task: `Synthesis: ${topic}` });

    const sourceBlock = sources.map((s, i) => `Source ${i + 1}:\n${s}`).join('\n\n---\n\n');

    const result = await LeewayInferenceClient.generate({
      prompt: `Synthesize the following sources on the topic: "${topic}"\n\n${sourceBlock}\n\nProvide a unified, accurate, contradiction-free synthesis.`,
      systemPrompt: LILY_SYSTEM,
      agent: 'LilyCortex',
      model: 'gemma4:e2b',
      temperature: 0.2,
    });

    eventBus.emit('agent:done', { agent: 'LilyCortex', result: 'synthesis complete' });
    return result.text;
  }
}

