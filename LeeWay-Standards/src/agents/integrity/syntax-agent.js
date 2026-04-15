/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.INTEGRITY
TAG: AI.AGENT.SYNTAX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=code-2

5WH:
WHAT = Syntax agent — guards against malformed code and unsafe patch results
WHY = Malformed syntax breaks builds; this agent catches errors before they reach CI
WHO = Rapid Web Development
WHERE = src/agents/integrity/syntax-agent.js
WHEN = 2026
HOW = Lightweight structural pattern checks for common JS/TS syntax issues

AGENTS:
SYNTAX
IMPORT
MODULE

LICENSE:
MIT
*/

/**
 * SyntaxAgent performs lightweight structural syntax validation.
 */
export class SyntaxAgent {
  /**
   * Check JS/TS content for common syntax issues.
   *
   * @param {string} content
   * @param {{ filePath?: string }} [options]
   * @returns {{ valid: boolean, issues: string[] }}
   */
  check(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return { valid: false, issues: ['Empty or invalid content'] };
    }

    const issues = [];
    const lines = content.split('\n');

    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`);
    }

    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing`);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('<<<<<<< ') || line.includes('=======') || line.includes('>>>>>>> ')) {
        issues.push(`Unresolved git merge conflict at line ${i + 1}`);
      }
    }

    const consoleLogs = lines.filter(l => l.trim().startsWith('console.log(')).length;
    if (consoleLogs > 10) {
      issues.push(`Excessive console.log usage (${consoleLogs} occurrences) — use namespaced logging`);
    }

    return { valid: issues.length === 0, issues };
  }
}
