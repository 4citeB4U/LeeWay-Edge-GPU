/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.STANDARDS
TAG: AI.AGENT.PLACEMENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=folder-check

5WH:
WHAT = Placement agent — checks file placement against LEEWAY directory structure rules
WHY = Files in wrong directories break discoverability and architecture legibility
WHO = Rapid Web Development
WHERE = src/agents/standards/placement-agent.js
WHEN = 2026
HOW = Compares declared REGION against expected directory paths, reports misplacements

AGENTS:
PLACEMENT
ASSESS
AUDIT

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { parseHeader } from '../../core/header-parser.js';
import { classifyRegion } from '../../core/region-classifier.js';

const REGION_EXPECTED_DIRS = {
  UI: ['src/components', 'src/pages', 'src/layouts', 'src/ui', 'src/views', 'src/screens'],
  CORE: ['src/core', 'src/sdk', 'src/lib', 'src/runtime', 'src/engine'],
  DATA: ['src/data', 'src/store', 'src/stores', 'src/db', 'src/models'],
  AI: ['src/ai', 'src/agents', 'src/llm', 'src/ml', 'src/prompts'],
  SEO: ['src/seo', 'src/discovery', 'src/schema', 'src/sitemap'],
  UTIL: ['src/utils', 'src/util', 'src/helpers', 'src/shared'],
  MCP: ['src/mcp', 'src/transport', 'src/endpoints'],
  SECURITY: ['src/security', 'src/auth', 'src/authorization'],
  TEST: ['src/tests', 'src/__tests__', 'test', 'tests', '__tests__'],
  DOCS: ['docs', 'documentation', 'guides'],
};

/**
 * PlacementAgent validates that files are in the correct LEEWAY directories.
 */
export class PlacementAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Check placement of a file.
   *
   * @param {string} filePath
   * @returns {Promise<PlacementResult>}
   */
  async checkFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    const relPath = filePath.startsWith('/') ? filePath.replace(this.rootDir + '/', '') : filePath;
    const normalizedPath = relPath.replace(/\\/g, '/');

    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { file: relPath, status: 'error' };
    }

    const header = parseHeader(content);
    const declaredRegion = header?.region?.split('.')?.[0];
    const { region: inferredRegion, confidence } = classifyRegion(relPath);

    const regionToCheck = declaredRegion || inferredRegion;
    const expectedDirs = REGION_EXPECTED_DIRS[regionToCheck] || [];
    const isCorrectlyPlaced = expectedDirs.length === 0
      || expectedDirs.some(dir => normalizedPath.startsWith(dir.replace(/^\//, '')));

    return {
      file: relPath,
      declaredRegion,
      inferredRegion,
      confidence,
      expectedDirectories: expectedDirs,
      status: isCorrectlyPlaced ? 'correct' : 'misplaced',
      suggestion: isCorrectlyPlaced ? null : `Move to one of: ${expectedDirs.slice(0, 3).join(', ')}`,
    };
  }
}
