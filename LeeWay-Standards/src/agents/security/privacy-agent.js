/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SECURITY.AGENT.PRIVACY
TAG: SECURITY.PRIVACY.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=user-x

5WH:
WHAT = Privacy agent — checks privacy and data handling declarations in code
WHY = Systems handling personal data must declare their data handling intent
WHO = Rapid Web Development
WHERE = src/agents/security/privacy-agent.js
WHEN = 2026
HOW = Scans for PII patterns in logs and data structures, checks for privacy declarations

AGENTS:
PRIVACY
POLICY
SECRET

LICENSE:
MIT
*/

const PII_PATTERNS = [
  { id: 'email_log', label: 'Email in log output', pattern: /(?:console\.|log\.|logger\.)[a-z]+\([^)]*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]+/i },
  { id: 'phone_inline', label: 'Phone number pattern', pattern: /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
  { id: 'ssn_pattern', label: 'SSN-like pattern', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { id: 'pii_in_logs', label: 'PII field logged', pattern: /(?:log|print|console)\.[a-z]+\([^)]*(?:password|ssn|social_security|credit_card|dob|date_of_birth)/i },
];

/**
 * PrivacyAgent checks for privacy violations and PII exposure risks.
 */
export class PrivacyAgent {
  constructor(options = {}) {
    this.patterns = options.patterns || PII_PATTERNS;
  }

  /**
   * Scan content for privacy violations.
   *
   * @param {string} content
   * @param {{ filePath?: string }} [options]
   * @returns {{ compliant: boolean, findings: Finding[] }}
   */
  scanContent(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return { compliant: true, findings: [] };
    }

    const findings = [];
    const lines = content.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      if (/^\s*\/\//.test(line) || /^\s*#/.test(line)) continue;

      for (const { id, label, pattern } of this.patterns) {
        if (pattern.test(line)) {
          findings.push({
            rule: id,
            label,
            line: lineNum + 1,
            preview: line.trim().slice(0, 80),
            file: options.filePath,
            severity: 'high',
          });
        }
      }
    }

    return { compliant: findings.length === 0, findings };
  }
}
