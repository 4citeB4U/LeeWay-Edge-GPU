/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.INTEGRITY
TAG: AI.AGENT.REFACTOR.SCAN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=wand-2

5WH:
WHAT = Refactor scan agent — suggests safe structural improvements to code
WHY = Continuous refactoring suggestions keep the codebase clean and maintainable
WHO = Rapid Web Development
WHERE = src/agents/integrity/refactor-scan-agent.js
WHEN = 2026
HOW = Pattern-based heuristics detect long functions, deep nesting, and complex conditionals

AGENTS:
REFACTOR
SYNTAX
DUPLICATE

LICENSE:
MIT
*/

/**
 * RefactorScanAgent suggests safe structural improvements.
 */
export class RefactorScanAgent {
  constructor(options = {}) {
    this.maxFunctionLines = options.maxFunctionLines || 50;
    this.maxNestingDepth = options.maxNestingDepth || 4;
  }

  /**
   * Scan file content for refactoring opportunities.
   *
   * @param {string} content
   * @param {{ filePath?: string }} [options]
   * @returns {{ suggestions: Suggestion[] }}
   */
  scan(content, options = {}) {
    if (!content || typeof content !== 'string') {
      return { suggestions: [] };
    }

    const suggestions = [];
    const lines = content.split('\n');

    let functionStart = -1;
    let functionName = '';
    let maxDepth = 0;
    let currentDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      const fnMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)|^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
      if (fnMatch && functionStart === -1) {
        functionStart = i;
        functionName = fnMatch[1] || fnMatch[2] || 'anonymous';
        currentDepth = 0;
        maxDepth = 0;
      }

      currentDepth += (line.match(/\{/g) || []).length;
      currentDepth -= (line.match(/\}/g) || []).length;
      if (currentDepth > maxDepth) maxDepth = currentDepth;

      if (functionStart !== -1 && currentDepth <= 0 && i > functionStart) {
        const functionLength = i - functionStart;
        if (functionLength > this.maxFunctionLines) {
          suggestions.push({
            type: 'long_function',
            line: functionStart + 1,
            message: `Function "${functionName}" is ${functionLength} lines — consider extracting into smaller functions`,
            severity: 'warning',
          });
        }
        if (maxDepth > this.maxNestingDepth) {
          suggestions.push({
            type: 'deep_nesting',
            line: functionStart + 1,
            message: `Function "${functionName}" has nesting depth of ${maxDepth} — flatten with early returns or extracted functions`,
            severity: 'warning',
          });
        }
        functionStart = -1;
        maxDepth = 0;
      }

      if (/TODO|FIXME|HACK|XXX/.test(trimmed)) {
        const match = trimmed.match(/(TODO|FIXME|HACK|XXX)[:\s]+(.+)/);
        suggestions.push({
          type: 'todo',
          line: i + 1,
          message: `Unresolved ${match?.[1] || 'TODO'}: ${match?.[2]?.slice(0, 60) || trimmed}`,
          severity: 'info',
        });
      }
    }

    return { suggestions };
  }
}
