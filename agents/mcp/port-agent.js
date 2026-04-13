/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.PORT
TAG: MCP.PORT.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=radio

5WH:
WHAT = Port agent — assigns and validates ports from a registry to prevent collisions
WHY = Port collisions cause service startup failures; governance requires a centralized port registry
WHO = Rapid Web Development
WHERE = src/agents/mcp/port-agent.js
WHEN = 2026
HOW = Maintains a port registry in .leeway/ports.json, validates before assignment

AGENTS:
PORT
ENDPOINT
TRANSPORT

LICENSE:
MIT
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DEFAULT_PORT_RANGES = {
  UI: [3000, 3099],
  API: [4000, 4099],
  AI: [5000, 5099],
  MCP: [6000, 6099],
  DATA: [7000, 7099],
  UTIL: [8000, 8099],
};

/**
 * PortAgent manages port assignments to prevent collisions.
 */
export class PortAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.registryPath = join(this.rootDir, '.leeway', 'ports.json');
    this.registry = null;
  }

  async _loadRegistry() {
    if (this.registry) return this.registry;
    try {
      const raw = await readFile(this.registryPath, 'utf8');
      this.registry = JSON.parse(raw);
    } catch {
      this.registry = { assignments: {}, reserved: [22, 80, 443, 8080, 8443] };
    }
    return this.registry;
  }

  async _saveRegistry() {
    await mkdir(join(this.rootDir, '.leeway'), { recursive: true });
    await writeFile(this.registryPath, JSON.stringify(this.registry, null, 2), 'utf8');
  }

  /**
   * Check if a port is available (not assigned).
   *
   * @param {number} port
   * @returns {Promise<{ available: boolean, assignedTo?: string }>}
   */
  async checkPort(port) {
    const reg = await this._loadRegistry();
    const assignedTo = Object.entries(reg.assignments).find(([, p]) => p === port)?.[0];
    const isReserved = reg.reserved.includes(port);

    return {
      available: !assignedTo && !isReserved,
      assignedTo: assignedTo || (isReserved ? 'SYSTEM_RESERVED' : null),
    };
  }

  /**
   * Assign a port to a service.
   *
   * @param {string} serviceName
   * @param {number} [preferredPort]
   * @param {string} [region]
   * @returns {Promise<{ port: number, assigned: boolean, conflict?: string }>}
   */
  async assignPort(serviceName, preferredPort, region = 'UTIL') {
    const reg = await this._loadRegistry();

    if (reg.assignments[serviceName]) {
      return { port: reg.assignments[serviceName], assigned: false, reason: 'Already assigned' };
    }

    let port = preferredPort;
    if (port) {
      const check = await this.checkPort(port);
      if (!check.available) {
        return { port: null, assigned: false, conflict: `Port ${port} already assigned to ${check.assignedTo}` };
      }
    } else {
      const [rangeStart, rangeEnd] = DEFAULT_PORT_RANGES[region] || DEFAULT_PORT_RANGES.UTIL;
      for (let p = rangeStart; p <= rangeEnd; p++) {
        const check = await this.checkPort(p);
        if (check.available) { port = p; break; }
      }
    }

    if (!port) {
      return { port: null, assigned: false, reason: 'No available port in range' };
    }

    reg.assignments[serviceName] = port;
    await this._saveRegistry();
    return { port, assigned: true };
  }
}
