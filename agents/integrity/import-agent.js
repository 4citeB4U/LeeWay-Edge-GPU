/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.INTEGRITY
TAG: AI.AGENT.IMPORT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=package

5WH:
WHAT = Import agent — normalizes import style and validates local import rules
WHY = Mixed import styles and broken paths cause module resolution failures
WHO = Rapid Web Development
WHERE = src/agents/integrity/import-agent.js
WHEN = 2026
HOW = Scans import statements for style violations and common path issues

AGENTS:
IMPORT
SYNTAX
MODULE

LICENSE:
MIT
*/

/**
 * ImportAgent normalizes and validates import statements.
 */
export class ImportAgent {
  /**
   * Analyze import statements in file content.
   *
   * @param {string} content
   * @param {{ moduleType?: 'esm' | 'cjs', filePath?: string }} [options]
   * @returns {{ valid: boolean, issues: string[], suggestions: string[] }}
   */
  analyze(content, options = {}) {
    const { moduleType = 'esm' } = options;
    const issues = [];
    const suggestions = [];
    const lines = content.split('\n');

    const esmImports = lines.filter(l => /^\s*import\s+/.test(l));
    const cjsRequires = lines.filter(l => /\brequire\s*\(/.test(l));

    if (moduleType === 'esm' && cjsRequires.length > 0) {
      issues.push(`Found ${cjsRequires.length} require() call(s) in ESM module — use import instead`);
      suggestions.push('Convert require() to import statements');
    }
    if (moduleType === 'cjs' && esmImports.length > 0) {
      issues.push(`Found ${esmImports.length} import statement(s) in CJS module — use require() instead`);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const importMatch = line.match(/from\s+['"`]([^'"`]+)['"`]/);
      if (!importMatch) continue;

      const importPath = importMatch[1];

      if (importPath.startsWith('.') && !importPath.includes('.js') && !importPath.includes('.ts')
          && importPath.includes('/') && moduleType === 'esm') {
        const hasExtension = /\.[a-z]+$/.test(importPath);
        if (!hasExtension) {
          suggestions.push(`Line ${i + 1}: ESM local imports should include file extension: "${importPath}" → "${importPath}.js"`);
        }
      }

      if (importPath.includes('../../..')) {
        issues.push(`Line ${i + 1}: Deep relative import "${importPath}" — consider using path aliases`);
      }
    }

    return { valid: issues.length === 0, issues, suggestions };
  }
}
