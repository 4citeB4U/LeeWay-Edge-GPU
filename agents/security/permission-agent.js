/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SECURITY.AGENT.PERMISSION
TAG: SECURITY.PERMISSION.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=lock

5WH:
WHAT = Permission agent — checks action permissions and runtime boundaries
WHY = Actions must be gated by explicit permission checks to prevent unauthorized operations
WHO = Rapid Web Development
WHERE = src/agents/security/permission-agent.js
WHEN = 2026
HOW = Checks declared AGENTS list in headers and validates against permission rules

AGENTS:
PERMISSION
POLICY
AUTHORITY

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseHeader } from '../../core/header-parser.js';

/**
 * PermissionAgent checks what agents are allowed to act on a file.
 */
export class PermissionAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Check if a specific agent is authorized to act on a file.
   *
   * @param {string} filePath
   * @param {string} agentName
   * @returns {Promise<{ allowed: boolean, reason: string }>}
   */
  async checkAccess(filePath, agentName) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { allowed: false, reason: 'Cannot read file' };
    }

    const header = parseHeader(content);
    if (!header) {
      return { allowed: false, reason: 'No LEEWAY header — file governance not established' };
    }

    const allowedAgents = header.agents || [];
    if (allowedAgents.length === 0) {
      return { allowed: true, reason: 'No agent restrictions declared — open access' };
    }

    const agentUpper = agentName.toUpperCase();
    const isAllowed = allowedAgents.some(a => a.toUpperCase() === agentUpper || a === '*');

    return {
      allowed: isAllowed,
      reason: isAllowed
        ? `Agent "${agentName}" is listed in file AGENTS declaration`
        : `Agent "${agentName}" is NOT in allowed agents: [${allowedAgents.join(', ')}]`,
    };
  }

  /**
   * Get all agents authorized for a file.
   *
   * @param {string} filePath
   * @returns {Promise<string[]>}
   */
  async getAuthorizedAgents(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    try {
      const content = await readFile(fullPath, 'utf8');
      const header = parseHeader(content);
      return header?.agents || [];
    } catch {
      return [];
    }
  }
}
