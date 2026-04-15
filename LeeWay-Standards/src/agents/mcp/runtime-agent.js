/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AGENT.RUNTIME
TAG: MCP.RUNTIME.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=zap

5WH:
WHAT = Runtime agent — checks module and runtime compatibility before build and start
WHY = Runtime version mismatches cause failures that are difficult to diagnose in CI
WHO = Rapid Web Development
WHERE = src/agents/mcp/runtime-agent.js
WHEN = 2026
HOW = Reads package.json engines field and compares against current Node version

AGENTS:
RUNTIME
ENV
ALIGN

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * RuntimeAgent checks module type compatibility and Node.js version requirements.
 */
export class RuntimeAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Check runtime compatibility for the current project.
   * @returns {Promise<RuntimeCheckResult>}
   */
  async check() {
    const issues = [];
    const info = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    let pkg = null;
    try {
      const raw = await readFile(join(this.rootDir, 'package.json'), 'utf8');
      pkg = JSON.parse(raw);
    } catch {
      issues.push('Cannot read package.json');
      return { valid: false, issues, info };
    }

    info.packageName = pkg.name;
    info.packageVersion = pkg.version;
    info.moduleType = pkg.type || 'commonjs';

    if (pkg.engines?.node) {
      const required = pkg.engines.node;
      const current = process.version.replace('v', '');
      const compatible = this._semverSatisfies(current, required);
      if (!compatible) {
        issues.push(`Node.js ${process.version} does not satisfy required ${required}`);
      }
    }

    const moduleIssues = await this._checkModuleConsistency(pkg);
    issues.push(...moduleIssues);

    return { valid: issues.length === 0, issues, info };
  }

  async _checkModuleConsistency(pkg) {
    const issues = [];
    const declaredType = pkg.type || 'commonjs';

    if (declaredType === 'module') {
      if (pkg.main && !pkg.main.endsWith('.mjs') && !pkg.main.endsWith('.js')) {
        issues.push('Package type is "module" but main entry does not use .js or .mjs');
      }
    }

    return issues;
  }

  _semverSatisfies(version, range) {
    const cleanVersion = version.replace(/[^0-9.]/g, '').split('.').map(Number);
    const rangeMatch = range.match(/[><=!^~]*([\d.]+)/);
    if (!rangeMatch) return true;

    const [major, minor = 0] = rangeMatch[1].split('.').map(Number);
    if (range.startsWith('>=')) return cleanVersion[0] > major || (cleanVersion[0] === major && cleanVersion[1] >= minor);
    if (range.startsWith('>')) return cleanVersion[0] > major || (cleanVersion[0] === major && cleanVersion[1] > minor);
    if (range.startsWith('^')) return cleanVersion[0] === major && cleanVersion[1] >= minor;
    return true;
  }
}
