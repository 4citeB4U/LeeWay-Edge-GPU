/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.INTEGRITY
TAG: AI.AGENT.MODULE.POLICY

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=layers

5WH:
WHAT = Module policy agent — prevents CommonJS/ESM drift within a project
WHY = Mixed module systems cause runtime errors that are extremely hard to debug
WHO = Rapid Web Development
WHERE = src/agents/integrity/module-policy-agent.js
WHEN = 2026
HOW = Reads package.json type field and validates all files follow the declared module system

AGENTS:
MODULE
IMPORT
SYNTAX

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

/**
 * ModulePolicyAgent prevents CommonJS/ESM drift in a project.
 */
export class ModulePolicyAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.declaredType = null;
  }

  async _getModuleType() {
    if (this.declaredType) return this.declaredType;
    try {
      const raw = await readFile(join(this.rootDir, 'package.json'), 'utf8');
      const pkg = JSON.parse(raw);
      this.declaredType = pkg.type || 'commonjs';
    } catch {
      this.declaredType = 'commonjs';
    }
    return this.declaredType;
  }

  /**
   * Check a file for module type consistency.
   *
   * @param {string} filePath
   * @returns {Promise<{ valid: boolean, issues: string[] }>}
   */
  async checkFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    const ext = extname(filePath);

    if (ext === '.mjs') return { valid: true, issues: [], moduleType: 'esm', forced: true };
    if (ext === '.cjs') return { valid: true, issues: [], moduleType: 'commonjs', forced: true };

    const declaredType = await this._getModuleType();
    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { valid: false, issues: ['Cannot read file'] };
    }

    const issues = [];
    const hasEsmImport = /^\s*import\s+/m.test(content) || /^\s*export\s+/m.test(content);
    const hasCjsRequire = /\brequire\s*\(/.test(content);
    const hasCjsExport = /\bmodule\.exports\b/.test(content);

    if (declaredType === 'module') {
      if (hasCjsRequire) issues.push('require() found in ESM project — use import instead');
      if (hasCjsExport) issues.push('module.exports found in ESM project — use export instead');
    } else {
      if (hasEsmImport && !hasCjsRequire) {
        issues.push('ESM import/export found in CommonJS project — add "type":"module" to package.json or use .mjs extension');
      }
    }

    return { valid: issues.length === 0, issues, moduleType: declaredType };
  }
}
