/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.MANIFEST
TAG: MCP.MANIFEST.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file-check

5WH:
WHAT = Manifest agent — validates MCP manifest completeness and tool definitions
WHY = Incomplete or malformed manifests prevent MCP servers from being discovered and used
WHO = Rapid Web Development
WHERE = src/agents/mcp/manifest-agent.js
WHEN = 2026
HOW = Reads manifest JSON, validates required fields and tool schemas

AGENTS:
MANIFEST
TRANSPORT
ENDPOINT

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const REQUIRED_MANIFEST_FIELDS = ['name', 'version', 'description'];
const REQUIRED_TOOL_FIELDS = ['name', 'description', 'inputSchema'];

/**
 * ManifestAgent validates MCP manifest files for completeness.
 */
export class ManifestAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Validate a manifest object or load from file.
   *
   * @param {string | object} manifestOrPath - Manifest object or path to manifest file
   * @returns {Promise<ManifestValidationResult>}
   */
  async validate(manifestOrPath) {
    let manifest = manifestOrPath;

    if (typeof manifestOrPath === 'string') {
      const fullPath = manifestOrPath.startsWith('/') ? manifestOrPath : join(this.rootDir, manifestOrPath);
      try {
        const raw = await readFile(fullPath, 'utf8');
        manifest = JSON.parse(raw);
      } catch (err) {
        return { valid: false, issues: [`Cannot load manifest: ${err.message}`] };
      }
    }

    const issues = [];

    for (const field of REQUIRED_MANIFEST_FIELDS) {
      if (!manifest[field]) issues.push(`Missing required field: ${field}`);
    }

    if (manifest.tools && Array.isArray(manifest.tools)) {
      for (const tool of manifest.tools) {
        for (const field of REQUIRED_TOOL_FIELDS) {
          if (!tool[field]) issues.push(`Tool "${tool.name || 'unknown'}" missing field: ${field}`);
        }
        if (tool.inputSchema && typeof tool.inputSchema !== 'object') {
          issues.push(`Tool "${tool.name}" inputSchema must be an object`);
        }
      }
    } else if (manifest.tools !== undefined) {
      issues.push('manifest.tools must be an array');
    }

    return { valid: issues.length === 0, issues, manifest };
  }
}
