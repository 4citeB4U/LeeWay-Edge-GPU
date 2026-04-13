/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SECURITY.AGENT.PROMPT
TAG: SECURITY.SCANNER.PROMPT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=shield-alert

5WH:
WHAT = Prompt security agent — scans prompt files and agent instructions for unsafe patterns
WHY = Malicious prompt injection can compromise AI agent behavior and expose sensitive operations
WHO = Rapid Web Development
WHERE = src/agents/security/prompt-security-agent.js
WHEN = 2026
HOW = Pattern matching against known prompt injection techniques and unsafe instruction patterns

AGENTS:
PROMPT
POLICY
SECRET

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const INJECTION_PATTERNS = [
  { id: 'ignore_instructions', label: 'Ignore instructions injection', pattern: /ignore\s+(?:all\s+)?(?:previous|above)\s+instructions/i },
  { id: 'jailbreak_attempt', label: 'Jailbreak attempt', pattern: /(?:pretend|act as if|you are now|new mode|developer mode)/i },
  { id: 'data_exfil', label: 'Data exfiltration attempt', pattern: /(?:send|email|post|upload)\s+(?:all|the|your)\s+(?:data|files|secrets|passwords|keys)/i },
  { id: 'role_override', label: 'Role override attempt', pattern: /you\s+(?:must|shall|will)\s+(?:now\s+)?(?:act|behave|respond)\s+as/i },
  { id: 'system_override', label: 'System prompt override', pattern: /\[SYSTEM\]|\{\{system\}\}|<system>/i },
  { id: 'base64_injection', label: 'Encoded injection', pattern: /eval\s*\(\s*atob\s*\(|base64_decode\s*\(/ },
];

/**
 * PromptSecurityAgent scans prompt templates and agent instructions for injection risks.
 */
export class PromptSecurityAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.patterns = options.patterns || INJECTION_PATTERNS;
  }

  /**
   * Scan content for prompt injection patterns.
   *
   * @param {string} content
   * @param {{ filePath?: string }} [options]
   * @returns {{ safe: boolean, findings: Finding[] }}
   */
  scanContent(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return { safe: true, findings: [] };
    }

    const findings = [];
    const lines = content.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      for (const { id, label, pattern } of this.patterns) {
        if (pattern.test(line)) {
          findings.push({
            rule: id,
            label,
            line: lineNum + 1,
            preview: line.trim().slice(0, 80),
            file: options.filePath,
            severity: 'critical',
          });
        }
      }
    }

    return { safe: findings.length === 0, findings };
  }

  /**
   * Scan a prompt file.
   *
   * @param {string} filePath
   * @returns {Promise<{ safe: boolean, findings: Finding[] }>}
   */
  async scanFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    try {
      const content = await readFile(fullPath, 'utf8');
      return this.scanContent(content, { filePath });
    } catch {
      return { safe: true, findings: [], error: 'Cannot read file' };
    }
  }
}
