/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.EXAMPLE
TAG: AI.AGENT.EXAMPLE.BASIC

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=bot

5WH:
WHAT = Example of a LEEWAY-compliant custom agent implementation
WHY = Demonstrates how third-party agents integrate with the LEEWAY SDK governance model
WHO = Rapid Web Development
WHERE = examples/example-agent.js
WHEN = 2026
HOW = ESM module implementing a simple LEEWAY agent contract with run() and describe() methods

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

/**
 * ExampleAgent — a minimal LEEWAY-compliant agent template.
 *
 * All custom LEEWAY agents should:
 * 1. Begin with a LEEWAY header
 * 2. Export a named class ending in "Agent"
 * 3. Implement run() and describe() methods
 * 4. Accept options.rootDir for file system operations
 * 5. Return structured result objects (never throw silently)
 */
export class ExampleAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.name = 'example-agent';
  }

  /**
   * Describe what this agent does.
   * @returns {object}
   */
  describe() {
    return {
      name: this.name,
      tag: 'AI.AGENT.EXAMPLE.BASIC',
      region: 'AI.AGENT.EXAMPLE',
      what: 'Example LEEWAY agent showing the standard agent contract',
      capabilities: ['run', 'describe'],
    };
  }

  /**
   * Execute the agent's primary task.
   *
   * @param {object} [context] - Optional execution context
   * @returns {Promise<AgentResult>}
   */
  async run(context = {}) {
    const startTime = Date.now();

    // Always return a structured result
    return {
      agent: this.name,
      status: 'success',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      result: {
        message: 'Example agent ran successfully',
        context,
      },
    };
  }
}

// Usage example:
// import { ExampleAgent } from './examples/example-agent.js';
// const agent = new ExampleAgent({ rootDir: process.cwd() });
// const result = await agent.run();
// console.log(result);
