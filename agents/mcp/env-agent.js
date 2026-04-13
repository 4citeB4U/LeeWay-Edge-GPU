/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.ENV
TAG: MCP.ENV.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=settings

5WH:
WHAT = Env agent — validates required vs optional environment variables
WHY = Missing or misconfigured env vars cause runtime failures that are hard to debug
WHO = Rapid Web Development
WHERE = src/agents/mcp/env-agent.js
WHEN = 2026
HOW = Reads .leeway/env-schema.json and validates against process.env

AGENTS:
ENV
RUNTIME
ALIGN

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * EnvAgent validates environment variable presence and format.
 */
export class EnvAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.schema = null;
  }

  /**
   * Load the env schema from .leeway/env-schema.json or .env.schema.json
   */
  async loadSchema() {
    const paths = [
      join(this.rootDir, '.leeway', 'env-schema.json'),
      join(this.rootDir, '.env.schema.json'),
    ];

    for (const p of paths) {
      try {
        const raw = await readFile(p, 'utf8');
        this.schema = JSON.parse(raw);
        return this.schema;
      } catch {
        continue;
      }
    }

    this.schema = { required: [], optional: [] };
    return this.schema;
  }

  /**
   * Validate current environment against the schema.
   *
   * @param {object} [env] - Environment to validate (defaults to process.env)
   * @returns {Promise<EnvValidationResult>}
   */
  async validate(env = process.env) {
    if (!this.schema) await this.loadSchema();

    const missing = [];
    const present = [];
    const warnings = [];

    for (const varDef of this.schema.required || []) {
      const name = typeof varDef === 'string' ? varDef : varDef.name;
      const pattern = typeof varDef === 'object' ? varDef.pattern : null;

      if (!env[name]) {
        missing.push(name);
      } else {
        if (pattern && !new RegExp(pattern).test(env[name])) {
          warnings.push(`${name} does not match expected pattern`);
        }
        present.push(name);
      }
    }

    for (const varDef of this.schema.optional || []) {
      const name = typeof varDef === 'string' ? varDef : varDef.name;
      if (!env[name]) {
        warnings.push(`Optional env var ${name} is not set`);
      } else {
        present.push(name);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      present,
      warnings,
    };
  }
}
