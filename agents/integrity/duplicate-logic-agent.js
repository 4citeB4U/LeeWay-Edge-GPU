/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.INTEGRITY
TAG: AI.AGENT.DUPLICATE.LOGIC

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=copy

5WH:
WHAT = Duplicate logic agent — detects repeated logic and duplicate injected blocks
WHY = Duplicate code wastes space, confuses developers, and creates maintenance debt
WHO = Rapid Web Development
WHERE = src/agents/integrity/duplicate-logic-agent.js
WHEN = 2026
HOW = Hash-based block comparison across files, sliding window on function bodies

AGENTS:
DUPLICATE
SYNTAX
REFACTOR

LICENSE:
MIT
*/

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MIN_BLOCK_LINES = 5;

/**
 * DuplicateLogicAgent detects repeated code blocks across files.
 */
export class DuplicateLogicAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.minBlockLines = options.minBlockLines || MIN_BLOCK_LINES;
  }

  /**
   * Extract normalized code blocks from content for comparison.
   *
   * @param {string} content
   * @returns {Map<string, string>} - Map of hash to block text
   */
  extractBlocks(content) {
    const blocks = new Map();
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i <= lines.length - this.minBlockLines; i++) {
      const block = lines.slice(i, i + this.minBlockLines).join('\n');
      if (block.length < 50) continue;
      const hash = createHash('sha256').update(block).digest('hex').slice(0, 16);
      if (!blocks.has(hash)) blocks.set(hash, block);
    }

    return blocks;
  }

  /**
   * Find duplicate blocks across multiple files.
   *
   * @param {string[]} filePaths
   * @returns {Promise<DuplicateReport>}
   */
  async findDuplicates(filePaths) {
    const fileBlocks = new Map();

    for (const fp of filePaths) {
      const fullPath = fp.startsWith('/') ? fp : join(this.rootDir, fp);
      try {
        const content = await readFile(fullPath, 'utf8');
        fileBlocks.set(fp, this.extractBlocks(content));
      } catch {
        continue;
      }
    }

    const hashToFiles = new Map();
    for (const [file, blocks] of fileBlocks.entries()) {
      for (const [hash, block] of blocks.entries()) {
        if (!hashToFiles.has(hash)) hashToFiles.set(hash, { block, files: [] });
        hashToFiles.get(hash).files.push(file);
      }
    }

    const duplicates = [];
    for (const [hash, { block, files }] of hashToFiles.entries()) {
      if (files.length > 1) {
        duplicates.push({ hash, files, preview: block.slice(0, 100) + '...' });
      }
    }

    return {
      agent: 'duplicate-logic-agent',
      duplicatesFound: duplicates.length,
      duplicates,
    };
  }
}
