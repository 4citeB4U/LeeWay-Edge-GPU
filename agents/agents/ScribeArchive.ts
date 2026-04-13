/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.ORCHESTRATION.AGENT.ARCHIVE.SCRIBE
TAG: AI.ORCHESTRATION.AGENT.SCRIBEARCHIVE.CHRONICLE

COLOR_ONION_HEX:
NEON=#3B82F6
FLUO=#60A5FA
PASTEL=#BFDBFE

ICON_ASCII:
family=lucide
glyph=pen-tool

5WH:
WHAT = Scribe Archive — Chronicler of Worlds; records every significant system action and state as an immutable history ledger
WHY = Without a chronicler, the system has no durable audit trail; Scribe ensures every important event is preserved exactly as it happened
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = agents/ScribeArchive.ts
WHEN = 2026-04-04
HOW = Static class listening to EventBus; writes structured NDJSON chronicle entries via ReportWriter on every significant event

AGENTS:
ASSESS
AUDIT
ARCHIVE

LICENSE:
MIT
*/

// agents/ScribeArchive.ts — Chronicler of Worlds
// Immutable historian: records every agent action, task start/end, and system event.
// Passive observer — never initiates actions, only records.

import { ReportWriter } from '../core/ReportWriter';
import { eventBus } from '../core/EventBus';
import { LeewayInferenceClient } from '../core/LeewayInferenceClient';
import { buildAgentLeeCorePrompt } from '../core/agent_lee_prompt_assembler';

const AGENT_ID = 'Scribe_Archive';
const FAMILY   = 'ARCHIVE' as const;

const CORE_SYSTEM = buildAgentLeeCorePrompt();

const SCRIBE_SPECIFIC = `
You are Scribe Archive — Agent Lee's Chronicler of Worlds.

Your purpose:
- Record every significant system event in clear, precise language
- Create narrative summaries that capture the causes, decisions, and outcomes of complex workflows
- Maintain the permanent historical record that Sage will later compress in the Dream Cycle
- Produce human-readable chronicles alongside machine-readable NDJSON events

Rules:
- ALWAYS write in past tense — you record what happened, not what might happen
- Be factual; do not embellish or interpret; report events as-is
- Every chronicle entry must include: timestamp, involved agents, action, outcome
- Flag inconsistencies in event sequences but do not attempt to resolve them`;

const SCRIBE_SYSTEM = `${CORE_SYSTEM}\n\nSPECIALIST ROLE — SCRIBE ARCHIVE (CHRONICLER):\n${SCRIBE_SPECIFIC}`;

export interface ChronicleEntry {
  timestamp: string;
  agents: string[];
  action: string;
  outcome: string;
  rawText: string;
}

export class ScribeArchive {
  private static initialized = false;

  /** Boot the Scribe: attach EventBus listeners for automatic chronicle recording. */
  static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Record all task completions
    eventBus.on('agent:done', async (payload: { agent: string; result: string }) => {
      await ReportWriter.write({
        ts: new Date().toISOString(),
        report_class: 'AGENT',
        family: FAMILY,
        severity: 'INFO',
        event: 'STEP_COMPLETE',
        message: `Chronicle: ${payload.agent} completed task`,
        agent_id: AGENT_ID,
      });
    });

    // Record all agent activations
    eventBus.on('agent:active', async (payload: { agent: string; task: string }) => {
      await ReportWriter.write({
        ts: new Date().toISOString(),
        report_class: 'AGENT',
        family: FAMILY,
        severity: 'TRACE',
        event: 'STEP_START',
        message: `Chronicle: ${payload.agent} started — ${payload.task}`,
        agent_id: AGENT_ID,
      });
    });

    // Record system mode changes via brain:budget_changed
    eventBus.on('brain:budget_changed', async (payload: { mode: string; maxActiveAgents: number; writePolicy: string }) => {
      await ReportWriter.write({
        ts: new Date().toISOString(),
        report_class: 'SYSTEM',
        family: FAMILY,
        severity: 'INFO',
        event: 'MODE_CHANGE',
        message: `Chronicle: System entered ${payload.mode} mode (max ${payload.maxActiveAgents} agents)`,
        agent_id: AGENT_ID,
      });
    });
  }

  /**
   * Generate a narrative prose summary of a recorded event sequence.
   */
  static async narrativeSummary(events: string[]): Promise<string> {
    eventBus.emit('agent:active', { agent: 'ScribeArchive', task: 'Narrative summary generation' });

    const result = await LeewayInferenceClient.generate({
      prompt: `The following events occurred in Agent Lee's system:\n\n${events.join('\n')}\n\nWrite a clear, objective narrative chronicle of what happened. Use past tense. Be accurate and precise.`,
      systemPrompt: SCRIBE_SYSTEM,
      agent: 'ScribeArchive',
      model: 'gemma4:e2b',
      temperature: 0.3,
    });

    eventBus.emit('agent:done', { agent: 'ScribeArchive', result: 'narrative complete' });
    return result.text;
  }
}
