/*
LEEWAY HEADER — DO NOT REMOVE
REGION: ORCHESTRATION
TAG: CORE.AGENT.COORDINATOR
5WH:
  WHAT = Multi-agent orchestration engine
  WHY = Enables real parallel execution and role-specific dispatching
  WHO = LeeWay Innovations
*/

export interface Agent {
  run(step: string, input: any): Promise<{ ok: boolean; data?: any }>;
}

export type AgentState = "ACTIVE" | "IDLE" | "SLEEPING";

export class AgentCoordinator {
  private agentStates = new Map<string, AgentState>();
  private lastActivity = new Map<string, number>();
  private readonly SLEEP_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  constructor(private agents: Record<string, Agent>) {
    // Start lifecycle monitor
    setInterval(() => this.reapInactiveAgents(), 60000); // Check every minute
  }

  async executePlan(plan: string[], input: any) {
    console.log(`🤖 COORDINATOR: Executing plan with ${plan.length} steps...`);
    
    const tasks = plan.map(async (step) => {
      const { agent, name } = this.resolveAgent(step);
      
      // 1. Wake Agent if needed
      await this.ensureAgentActive(name);
      
      console.log(`🔗 Dispatching step [${step}] to agent [${name}]...`);
      const result = await agent.run(step, input);
      
      // 2. Update activity timestamp
      this.lastActivity.set(name, Date.now());
      this.agentStates.set(name, "IDLE");
      
      return result;
    });

    const results = await Promise.all(tasks);
    return results;
  }

  private resolveAgent(step: string): { agent: Agent; name: string } {
    const [domain] = step.split('.');
    const name = this.agents[domain] ? domain : 
               (step.includes("email") ? "email" : 
                (step.includes("call") ? "call" : 
                 (step.includes("logistics") ? "dispatch" : "general")));

    return { 
      agent: this.agents[name] || this.agents.general,
      name 
    };
  }

  private async ensureAgentActive(name: string) {
    const currentState = this.agentStates.get(name) || "SLEEPING";
    if (currentState === "SLEEPING") {
      console.log(`🌙 [COMPUTE] Awakening agent [${name}] from DeepSleep...`);
      // Simulate "Awakening" delay (loading model/context)
      await new Promise(r => setTimeout(r, 1500)); 
      this.agentStates.set(name, "ACTIVE");
    } else {
      this.agentStates.set(name, "ACTIVE");
    }
  }

  private reapInactiveAgents() {
    const now = Date.now();
    for (const [name, lastSeen] of this.lastActivity) {
      if (now - lastSeen > this.SLEEP_THRESHOLD && this.agentStates.get(name) !== "SLEEPING") {
        console.log(`💤 [COMPUTE] Sleeping agent [${name}] to preserve cycles.`);
        this.agentStates.set(name, "SLEEPING");
        // In a real scenario, this would trigger LLM context offloading/swapping
      }
    }
  }
}

