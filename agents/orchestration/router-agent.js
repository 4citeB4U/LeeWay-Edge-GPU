/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.ORCHESTRATION
TAG: AI.AGENT.ROUTER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=git-fork

5WH:
WHAT = Router agent — chooses which other agents to invoke for a given task
WHY = Complex governance tasks require orchestrated invocation of multiple specialized agents
WHO = Rapid Web Development
WHERE = src/agents/orchestration/router-agent.js
WHEN = 2026
HOW = Intent-based routing from task descriptions to named agent handlers

AGENTS:
ROUTER
ASSESS
AUDIT
DOCTOR

LICENSE:
MIT
*/

/**
 * RouterAgent routes tasks to the appropriate LEEWAY agents.
 */
export class RouterAgent {
  constructor(options = {}) {
    this.routes = new Map();
    this.fallback = options.fallback || null;
  }

  /**
   * Register a route mapping an intent pattern to an agent handler.
   *
   * @param {string | RegExp} intentPattern
   * @param {{ agent: string, handler: Function }} route
   */
  register(intentPattern, route) {
    this.routes.set(intentPattern, route);
  }

  /**
   * Route a task to the appropriate agent.
   *
   * @param {string} task - Natural language task description
   * @param {object} [context] - Additional context
   * @returns {Promise<RouterResult>}
   */
  async route(task, context = {}) {
    const taskLower = task.toLowerCase();

    for (const [pattern, route] of this.routes.entries()) {
      const matches = pattern instanceof RegExp
        ? pattern.test(task)
        : taskLower.includes(pattern.toLowerCase());

      if (matches) {
        try {
          const result = await route.handler(context);
          return { routed: true, agent: route.agent, result };
        } catch (err) {
          return { routed: true, agent: route.agent, error: err.message };
        }
      }
    }

    if (this.fallback) {
      const result = await this.fallback(task, context);
      return { routed: true, agent: 'fallback', result };
    }

    return { routed: false, reason: `No route matched for task: "${task}"` };
  }

  /**
   * Create a router with standard LEEWAY governance routes.
   *
   * @param {object} agents - Map of agent instances
   * @returns {RouterAgent}
   */
  static withStandardRoutes(agents) {
    const router = new RouterAgent();

    if (agents.assess) {
      router.register('assess', { agent: 'assess-agent', handler: () => agents.assess.run() });
      router.register('survey', { agent: 'assess-agent', handler: () => agents.assess.run() });
    }
    if (agents.audit) {
      router.register('audit', { agent: 'audit-agent', handler: () => agents.audit.run() });
      router.register('compliance', { agent: 'audit-agent', handler: () => agents.audit.run() });
    }
    if (agents.doctor) {
      router.register('doctor', { agent: 'doctor-agent', handler: () => agents.doctor.run() });
      router.register('diagnose', { agent: 'doctor-agent', handler: () => agents.doctor.run() });
    }

    return router;
  }
}
