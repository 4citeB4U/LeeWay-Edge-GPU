/*
LEEWAY HEADER — DO NOT REMOVE
REGION: AGENTS
TAG: AGENT.GENERAL
5WH:
  WHAT = Fallback and general purpose agent
  WHY = Handles non-specific tasks and standard responses
  WHO = LeeWay Innovations
*/

import { Agent } from "./AgentCoordinator";

export class GeneralAgent implements Agent {
  async run(step: string, ctx: any): Promise<{ ok: boolean; data?: any }> {
    console.log(`🤖 GENERAL_AGENT: Processing step [${step}]`);
    
    if (step.includes("status")) {
      return { ok: true, data: { system: "healthy", agents: "active" } };
    }
    
    return { ok: true, data: { response: "Processed by general agent", context: ctx.intent } };
  }
}
