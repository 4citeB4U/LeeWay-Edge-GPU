/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.ORCHESTRATION
TAG: AI.AGENT.MEMORY.LITE

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=hard-drive

5WH:
WHAT = Memory agent lite — stores SDK-local state, receipts, audit history, and registries
WHY = Agent operations must be logged and recoverable; receipts provide auditability
WHO = Rapid Web Development
WHERE = src/agents/orchestration/memory-agent-lite.js
WHEN = 2026
HOW = Persistent JSON store in .leeway/memory.json with receipt logging

AGENTS:
MEMORY
ROUTER
DOCTOR

LICENSE:
MIT
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * MemoryAgentLite provides lightweight persistent state management for the LEEWAY SDK.
 */
export class MemoryAgentLite {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.storePath = join(this.rootDir, '.leeway', 'memory.json');
    this.maxReceipts = options.maxReceipts || 1000;
    this.state = null;
  }

  async _load() {
    if (this.state) return this.state;
    try {
      const raw = await readFile(this.storePath, 'utf8');
      this.state = JSON.parse(raw);
    } catch {
      this.state = { receipts: [], kv: {}, lastUpdated: null };
    }
    return this.state;
  }

  async _save() {
    await mkdir(join(this.rootDir, '.leeway'), { recursive: true });
    this.state.lastUpdated = new Date().toISOString();
    await writeFile(this.storePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  /**
   * Store a key-value pair in persistent memory.
   *
   * @param {string} key
   * @param {*} value
   */
  async set(key, value) {
    const state = await this._load();
    state.kv[key] = value;
    await this._save();
  }

  /**
   * Retrieve a value from persistent memory.
   *
   * @param {string} key
   * @param {*} [defaultValue]
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    const state = await this._load();
    return key in state.kv ? state.kv[key] : defaultValue;
  }

  /**
   * Log an operation receipt for audit purposes.
   *
   * @param {{ agent: string, action: string, target?: string, result?: string }} receipt
   */
  async logReceipt(receipt) {
    const state = await this._load();
    state.receipts.unshift({
      ...receipt,
      timestamp: new Date().toISOString(),
    });

    if (state.receipts.length > this.maxReceipts) {
      state.receipts = state.receipts.slice(0, this.maxReceipts);
    }

    await this._save();
  }

  /**
   * Get recent receipts.
   *
   * @param {number} [limit]
   * @returns {Promise<object[]>}
   */
  async getReceipts(limit = 50) {
    const state = await this._load();
    return state.receipts.slice(0, limit);
  }

  /**
   * Clear all stored state.
   */
  async clear() {
    this.state = { receipts: [], kv: {}, lastUpdated: null };
    await this._save();
  }
}
