/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.TRANSPORT
TAG: MCP.TRANSPORT.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=activity

5WH:
WHAT = Transport agent — verifies approved MCP transport usage
WHY = MCP transport mismatches cause silent failures and security violations
WHO = Rapid Web Development
WHERE = src/agents/mcp/transport-agent.js
WHEN = 2026
HOW = Checks transport declarations in manifests and source for approved protocols

AGENTS:
TRANSPORT
ENDPOINT

LICENSE:
MIT
*/

const APPROVED_TRANSPORTS = ['stdio', 'http', 'sse', 'websocket'];
const DEPRECATED_TRANSPORTS = ['xmlrpc', 'soap', 'raw-tcp'];

/**
 * TransportAgent verifies that only approved MCP transport protocols are used.
 */
export class TransportAgent {
  constructor(options = {}) {
    this.approvedTransports = options.approvedTransports || APPROVED_TRANSPORTS;
  }

  /**
   * Check if a transport is approved.
   *
   * @param {string} transport
   * @returns {{ approved: boolean, deprecated: boolean, reason: string }}
   */
  check(transport) {
    const t = (transport || '').toLowerCase().trim();
    if (this.approvedTransports.includes(t)) {
      return { approved: true, deprecated: false, reason: `Transport "${t}" is approved` };
    }
    if (DEPRECATED_TRANSPORTS.includes(t)) {
      return { approved: false, deprecated: true, reason: `Transport "${t}" is deprecated and not allowed` };
    }
    return { approved: false, deprecated: false, reason: `Transport "${t}" is not in the approved list: ${this.approvedTransports.join(', ')}` };
  }

  /**
   * Scan manifest object for transport declarations.
   *
   * @param {object} manifest
   * @returns {{ valid: boolean, issues: string[] }}
   */
  validateManifest(manifest) {
    const issues = [];
    const transports = manifest?.transports || manifest?.transport ? [manifest.transport] : [];

    for (const t of transports) {
      if (!t) continue;
      const result = this.check(typeof t === 'string' ? t : t.type);
      if (!result.approved) issues.push(result.reason);
    }

    return { valid: issues.length === 0, issues };
  }
}
