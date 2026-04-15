/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.INTEGRITY
TAG: AI.AGENT.DEPENDENCY.GRAPH

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=git-branch

5WH:
WHAT = Dependency graph agent — builds lightweight dependency maps between modules
WHY = Understanding module dependencies is essential for safe refactoring and change impact analysis
WHO = Rapid Web Development
WHERE = src/agents/integrity/dependency-graph-agent.js
WHEN = 2026
HOW = Parses import/require statements, builds directed adjacency graph

AGENTS:
DEPENDENCY
CIRCULAR
REFACTOR

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';

/**
 * DependencyGraphAgent builds a lightweight module dependency map.
 */
export class DependencyGraphAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Extract local import paths from file content.
   *
   * @param {string} content
   * @returns {string[]}
   */
  extractImports(content) {
    const imports = [];
    const patterns = [
      /import\s+[^'"]*from\s+['"`](\.\.?\/[^'"`]+)['"`]/g,
      /require\s*\(\s*['"`](\.\.?\/[^'"`]+)['"`]\s*\)/g,
    ];

    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)];
  }

  /**
   * Build a dependency graph for a set of files.
   *
   * @param {string[]} filePaths - Relative file paths
   * @returns {Promise<DependencyGraph>}
   */
  async buildGraph(filePaths) {
    const graph = {};

    for (const fp of filePaths) {
      const fullPath = fp.startsWith('/') ? fp : join(this.rootDir, fp);
      graph[fp] = { imports: [], importedBy: [] };

      try {
        const content = await readFile(fullPath, 'utf8');
        const rawImports = this.extractImports(content);

        for (const imp of rawImports) {
          const resolved = resolve(dirname(fullPath), imp).replace(this.rootDir + '/', '');
          const normalized = filePaths.find(f => f.startsWith(resolved.replace(/\.[^.]+$/, '')));
          if (normalized) {
            graph[fp].imports.push(normalized);
          }
        }
      } catch {
        continue;
      }
    }

    for (const [file, data] of Object.entries(graph)) {
      for (const dep of data.imports) {
        if (graph[dep]) {
          graph[dep].importedBy.push(file);
        }
      }
    }

    return { agent: 'dependency-graph-agent', graph };
  }
}
