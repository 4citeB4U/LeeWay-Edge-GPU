/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SECURITY.AGENT.ACCESS
TAG: SECURITY.ACCESS.TOOL.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=key

5WH:
WHAT = Tool access agent — ensures tools are called only through approved paths
WHY = Unapproved tool invocation paths create unauditable side effects and security gaps
WHO = Rapid Web Development
WHERE = src/agents/security/tool-access-agent.js
WHEN = 2026
HOW = Validates tool call paths against an approved routes registry

AGENTS:
TOOL
POLICY
PERMISSION

LICENSE:
MIT
*/

/**
 * ToolAccessAgent validates that tool invocations follow approved access paths.
 */
export class ToolAccessAgent {
  constructor(options = {}) {
    this.approvedRoutes = options.approvedRoutes || new Map();
    this.deniedRoutes = options.deniedRoutes || new Set();
  }

  /**
   * Register an approved tool invocation route.
   *
   * @param {string} toolName
   * @param {string[]} allowedCallers - Agent names permitted to call this tool
   */
  registerApprovedRoute(toolName, allowedCallers) {
    this.approvedRoutes.set(toolName.toUpperCase(), allowedCallers.map(c => c.toUpperCase()));
  }

  /**
   * Register a denied tool invocation route.
   *
   * @param {string} toolName
   */
  denyTool(toolName) {
    this.deniedRoutes.add(toolName.toUpperCase());
  }

  /**
   * Check if a tool invocation is allowed.
   *
   * @param {string} toolName
   * @param {string} callerAgent
   * @returns {{ allowed: boolean, reason: string }}
   */
  checkAccess(toolName, callerAgent) {
    const tool = toolName.toUpperCase();
    const caller = callerAgent.toUpperCase();

    if (this.deniedRoutes.has(tool)) {
      return { allowed: false, reason: `Tool "${toolName}" is explicitly denied` };
    }

    const approvedCallers = this.approvedRoutes.get(tool);
    if (!approvedCallers) {
      return { allowed: true, reason: `Tool "${toolName}" has no access restrictions` };
    }

    if (approvedCallers.includes('*') || approvedCallers.includes(caller)) {
      return { allowed: true, reason: `Caller "${callerAgent}" is approved for tool "${toolName}"` };
    }

    return {
      allowed: false,
      reason: `Caller "${callerAgent}" is not in approved list for tool "${toolName}": [${approvedCallers.join(', ')}]`,
    };
  }

  /**
   * Validate a batch of tool invocations.
   *
   * @param {{ tool: string, caller: string }[]} invocations
   * @returns {{ valid: boolean, violations: object[] }}
   */
  validateBatch(invocations) {
    const violations = [];
    for (const { tool, caller } of invocations) {
      const result = this.checkAccess(tool, caller);
      if (!result.allowed) violations.push({ tool, caller, reason: result.reason });
    }
    return { valid: violations.length === 0, violations };
  }
}
