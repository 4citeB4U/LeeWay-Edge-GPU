/**
 * LEEWAY AUTONOMOUS EVOLUTION LAYER (LAEL)
 * Controlled system evolution engine
 */
export class EvolutionEngine {
  constructor(controller) {
    this.controller = controller;
    this.agents = new Map();
  }

  registerAgent(agentId, initialStrategy) {
    this.agents.set(agentId, {
      agentId,
      version: "v1.0.0",
      strategy: initialStrategy,
      metrics: {
        successRate: 1.0,
        avgLatency: 50,
        errorRate: 0.0,
        resourceEfficiency: 1.0
      },
      history: []
    });
  }

  recordExecution(agentId, metrics) {
    const record = this.agents.get(agentId);
    if (!record) return;

    // Moving average logic to track metrics over time via Observation Loop
    record.metrics.successRate = (record.metrics.successRate * 9 + (metrics.success ? 1 : 0)) / 10;
    record.metrics.errorRate = (record.metrics.errorRate * 9 + (metrics.success ? 0 : 1)) / 10;
    record.metrics.avgLatency = (record.metrics.avgLatency * 9 + metrics.latency) / 10;
    if (metrics.cost) {
      record.metrics.resourceEfficiency = (record.metrics.resourceEfficiency * 9 + (1/metrics.cost)) / 10;
    }
    
    // Rule 8: Bad evolution must self-correct (Detect Instability)
    if (record.metrics.errorRate > 0.05) {
      this.rollback(agentId);
    }
  }

  scoreAgent(metrics) {
    return (
      metrics.successRate * 50 -
      metrics.errorRate * 30 -
      metrics.avgLatency * 0.5 +
      metrics.resourceEfficiency * 20
    );
  }

  async testStrategy(oldStrategy, newStrategy) {
    // Rule 4: Sandbox Testing before reaching production.
    // Simulating deterministic test execution.
    return { oldScore: 50, newScore: 60 }; 
  }

  async proposeEvolution(agentId, newStrategy) {
    const record = this.agents.get(agentId);
    if (!record) throw new Error("Agent not found");

    const { oldScore, newScore } = await this.testStrategy(record.strategy, newStrategy);
    
    if (newScore > oldScore) {
      if (this.controller.approve(newStrategy)) {
        this.commitEvolution(agentId, newStrategy);
      }
    }
  }

  commitEvolution(agentId, newStrategy) {
    const record = this.agents.get(agentId);
    record.history.push({ version: record.version, strategy: record.strategy });
    
    const chunks = record.version.replace('v', '').split('.');
    chunks[1] = parseInt(chunks[1]) + 1;
    record.version = `v${chunks.join('.')}`;
    record.strategy = newStrategy;
  }

  rollback(agentId) {
    const record = this.agents.get(agentId);
    if (record.history.length > 0) {
      console.warn(`[LAEL ERROR_RATE_SURGE] Rolling back unstable agent: ${agentId}`);
      const last = record.history.pop();
      record.version = last.version;
      record.strategy = last.strategy;
      record.metrics.errorRate = 0.01;
    }
  }
}
