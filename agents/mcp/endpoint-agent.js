/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.ENDPOINT
TAG: MCP.ENDPOINT.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=globe

5WH:
WHAT = Endpoint agent — detects existing health and HTTP endpoints safely
WHY = Prevents duplicate endpoint registration and detects port conflicts before startup
WHO = Rapid Web Development
WHERE = src/agents/mcp/endpoint-agent.js
WHEN = 2026
HOW = Reads manifest files and scans source for endpoint declarations

AGENTS:
ENDPOINT
TRANSPORT
PORT

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ENDPOINT_PATTERNS = [
  { type: 'express', pattern: /app\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g },
  { type: 'fastify', pattern: /fastify\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g },
  { type: 'http', pattern: /createServer|http\.listen\s*\(\s*(\d+)/g },
];

/**
 * EndpointAgent detects existing HTTP endpoints and health checks in source files.
 */
export class EndpointAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.knownEndpoints = new Map();
  }

  /**
   * Scan a file for endpoint declarations.
   *
   * @param {string} filePath
   * @returns {Promise<EndpointScanResult>}
   */
  async scanFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { file: filePath, endpoints: [], status: 'error' };
    }

    const endpoints = [];
    for (const { type, pattern } of ENDPOINT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(content)) !== null) {
        endpoints.push({
          type,
          method: match[1]?.toUpperCase() || 'UNKNOWN',
          path: match[2] || '/',
          line: content.slice(0, match.index).split('\n').length,
        });
      }
    }

    return { file: filePath, endpoints, status: 'scanned' };
  }

  /**
   * Check for duplicate endpoints across multiple scan results.
   *
   * @param {EndpointScanResult[]} scanResults
   * @returns {{ duplicates: object[], unique: object[] }}
   */
  detectDuplicates(scanResults) {
    const seen = new Map();
    const duplicates = [];

    for (const result of scanResults) {
      for (const ep of result.endpoints) {
        const key = `${ep.method}:${ep.path}`;
        if (seen.has(key)) {
          duplicates.push({ key, files: [seen.get(key).file, result.file], endpoint: ep });
        } else {
          seen.set(key, { ...ep, file: result.file });
        }
      }
    }

    return { duplicates, unique: Array.from(seen.values()) };
  }
}
