/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.PROCESS
TAG: MCP.PROCESS.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=cpu

5WH:
WHAT = Process agent — handles process ownership, shutdown sequencing, and zombie cleanup
WHY = Unmanaged processes cause resource leaks, port conflicts, and failed restarts
WHO = Rapid Web Development
WHERE = src/agents/mcp/process-agent.js
WHEN = 2026
HOW = Tracks PID registry in .leeway/processes.json, validates liveness, signals shutdown

AGENTS:
PROCESS
PORT
HEALTH

LICENSE:
MIT
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * ProcessAgent tracks and manages process ownership and lifecycle.
 */
export class ProcessAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.registryPath = join(this.rootDir, '.leeway', 'processes.json');
    this.registry = null;
  }

  async _load() {
    if (this.registry) return this.registry;
    try {
      const raw = await readFile(this.registryPath, 'utf8');
      this.registry = JSON.parse(raw);
    } catch {
      this.registry = { processes: {} };
    }
    return this.registry;
  }

  async _save() {
    await mkdir(join(this.rootDir, '.leeway'), { recursive: true });
    await writeFile(this.registryPath, JSON.stringify(this.registry, null, 2), 'utf8');
  }

  /**
   * Register a process.
   *
   * @param {string} name - Process identifier
   * @param {number} pid - OS process ID
   * @param {object} [meta] - Additional metadata
   */
  async register(name, pid, meta = {}) {
    const reg = await this._load();
    reg.processes[name] = { pid, registered: new Date().toISOString(), ...meta };
    await this._save();
  }

  /**
   * Check if a process is alive.
   *
   * @param {string} name
   * @returns {Promise<{ alive: boolean, pid: number | null }>}
   */
  async isAlive(name) {
    const reg = await this._load();
    const entry = reg.processes[name];
    if (!entry) return { alive: false, pid: null };

    try {
      process.kill(entry.pid, 0);
      return { alive: true, pid: entry.pid };
    } catch {
      return { alive: false, pid: entry.pid };
    }
  }

  /**
   * Clean up zombie entries (processes that are no longer alive).
   * @returns {Promise<string[]>} - Names of cleaned processes
   */
  async cleanZombies() {
    const reg = await this._load();
    const cleaned = [];

    for (const [name, entry] of Object.entries(reg.processes)) {
      try {
        process.kill(entry.pid, 0);
      } catch {
        delete reg.processes[name];
        cleaned.push(name);
      }
    }

    if (cleaned.length > 0) await this._save();
    return cleaned;
  }

  /**
   * Deregister a process entry.
   * @param {string} name
   */
  async deregister(name) {
    const reg = await this._load();
    delete reg.processes[name];
    await this._save();
  }
}
