/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SECURITY.AGENT.SCANNER
TAG: SECURITY.SCANNER.SECRET.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=eye-off

5WH:
WHAT = Secret scan agent — looks for secrets and unsafe credential handling in source code
WHY = Committed secrets are a critical security vulnerability; this agent prevents them
WHO = Rapid Web Development
WHERE = src/agents/security/secret-scan-agent.js
WHEN = 2026
HOW = Pattern matching against known secret formats, env var names, and credential patterns

AGENTS:
SECRET
POLICY
AUDIT

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SECRET_PATTERNS = [
  { id: 'api_key_inline', label: 'Inline API key', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"`][a-zA-Z0-9\-_]{16,}['"`]/i },
  { id: 'password_inline', label: 'Inline password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/i },
  { id: 'secret_inline', label: 'Inline secret', pattern: /(?:secret|private[_-]?key)\s*[:=]\s*['"`][a-zA-Z0-9\-_+/]{16,}['"`]/i },
  { id: 'token_inline', label: 'Inline token', pattern: /(?:token|auth[_-]?token)\s*[:=]\s*['"`][a-zA-Z0-9\-_.]{16,}['"`]/i },
  { id: 'openai_key', label: 'OpenAI API key', pattern: /sk-[a-zA-Z0-9]{32,}/  },
  { id: 'jwt_inline', label: 'Hardcoded JWT', pattern: /eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/ },
  { id: 'aws_key', label: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/ },
  { id: 'connection_string', label: 'Database connection string', pattern: /(?:mongodb|postgres|mysql|redis):\/\/[a-zA-Z0-9._%+\-]+:[a-zA-Z0-9._%+\-@]+\/[a-zA-Z0-9]+/ },
];

/**
 * SecretScanAgent scans source files for hardcoded secrets.
 */
export class SecretScanAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.patterns = options.patterns || SECRET_PATTERNS;
  }

  /**
   * Scan file content for secret patterns.
   *
   * @param {string} content
   * @param {{ filePath?: string }} [options]
   * @returns {{ clean: boolean, findings: Finding[] }}
   */
  scanContent(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return { clean: true, findings: [] };
    }

    const findings = [];
    const lines = content.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      if (/^\s*\/\//.test(line) || /^\s*#/.test(line)) continue;
      if (/process\.env\[/.test(line) || /process\.env\./.test(line)) continue;

      for (const { id, label, pattern } of this.patterns) {
        if (pattern.test(line)) {
          findings.push({
            rule: id,
            label,
            line: lineNum + 1,
            preview: line.trim().slice(0, 80),
            file: options.filePath,
          });
        }
      }
    }

    return { clean: findings.length === 0, findings };
  }

  /**
   * Scan a file for secrets.
   *
   * @param {string} filePath
   * @returns {Promise<{ clean: boolean, findings: Finding[] }>}
   */
  async scanFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    try {
      const content = await readFile(fullPath, 'utf8');
      return this.scanContent(content, { filePath });
    } catch {
      return { clean: true, findings: [], error: 'Cannot read file' };
    }
  }
}
