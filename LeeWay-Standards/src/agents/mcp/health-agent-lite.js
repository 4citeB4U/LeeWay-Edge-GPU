/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.HEALTH
TAG: MCP.HEALTH.AGENT.LITE

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=heart-pulse

5WH:
WHAT = Health agent lite — runs lightweight startup and readiness checks
WHY = Services must pass readiness gates before routing traffic or accepting requests
WHO = Rapid Web Development
WHERE = src/agents/mcp/health-agent-lite.js
WHEN = 2026
HOW = Runs a series of configurable health checks, returns pass/fail with details

AGENTS:
HEALTH
RUNTIME
ENV

LICENSE:
MIT
*/

/**
 * HealthAgentLite performs lightweight startup and readiness checks.
 */
export class HealthAgentLite {
  constructor(options = {}) {
    this.checks = options.checks || [];
    this.timeout = options.timeout || 5000;
  }

  /**
   * Register a health check function.
   *
   * @param {string} name
   * @param {() => Promise<{ healthy: boolean, details?: string }>} fn
   */
  register(name, fn) {
    this.checks.push({ name, fn });
  }

  /**
   * Run all registered health checks.
   * @returns {Promise<HealthReport>}
   */
  async run() {
    const results = [];
    let allHealthy = true;

    for (const check of this.checks) {
      const startTime = Date.now();
      try {
        const result = await Promise.race([
          check.fn(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), this.timeout)),
        ]);

        const duration = Date.now() - startTime;
        results.push({
          name: check.name,
          healthy: result.healthy,
          details: result.details || null,
          durationMs: duration,
        });

        if (!result.healthy) allHealthy = false;
      } catch (err) {
        results.push({
          name: check.name,
          healthy: false,
          details: err.message,
          durationMs: Date.now() - startTime,
        });
        allHealthy = false;
      }
    }

    return {
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      checks: results,
      summary: `${results.filter(r => r.healthy).length}/${results.length} checks passed`,
    };
  }

  /**
   * Get built-in system health checks.
   * @returns {HealthAgentLite}
   */
  static withSystemChecks(options = {}) {
    const agent = new HealthAgentLite(options);

    agent.register('memory', async () => {
      const { heapUsed, heapTotal } = process.memoryUsage();
      const usagePercent = Math.round((heapUsed / heapTotal) * 100);
      return {
        healthy: usagePercent < 90,
        details: `Heap usage: ${usagePercent}% (${Math.round(heapUsed / 1024 / 1024)}MB / ${Math.round(heapTotal / 1024 / 1024)}MB)`,
      };
    });

    agent.register('uptime', async () => ({
      healthy: true,
      details: `Process uptime: ${Math.round(process.uptime())}s`,
    }));

    return agent;
  }
}
