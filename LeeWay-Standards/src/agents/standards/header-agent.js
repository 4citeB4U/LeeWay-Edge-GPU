/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.STANDARDS
TAG: AI.AGENT.HEADER.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file-plus

5WH:
WHAT = Header agent — inserts and repairs LEEWAY headers in source files
WHY = All LEEWAY files must have a valid identity header; this agent enforces that rule
WHO = Rapid Web Development
WHERE = src/agents/standards/header-agent.js
WHEN = 2026
HOW = Reads files, detects missing or malformed headers, inserts or repairs as needed

AGENTS:
HEADER
ASSESS
ALIGN

LICENSE:
MIT
*/

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseHeader, validateHeader, buildHeader } from '../../core/header-parser.js';
import { inferTag } from '../../core/tag-validator.js';
import { classifyRegion } from '../../core/region-classifier.js';

/**
 * HeaderAgent inserts and repairs LEEWAY headers in source files.
 */
export class HeaderAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.dryRun = options.dryRun !== false;
    this.author = options.author || 'LEEWAY Header Agent';
  }

  /**
   * Process a single file — insert header if missing, repair if invalid.
   *
   * @param {string} filePath - Absolute or relative file path
   * @returns {Promise<{ file: string, action: string, dryRun: boolean }>}
   */
  async processFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    const relPath = filePath.startsWith('/') ? filePath.replace(this.rootDir + '/', '') : filePath;

    let content;
    try {
      content = await readFile(fullPath, 'utf8');
    } catch (err) {
      return { file: relPath, action: 'error', reason: err.message };
    }

    const header = parseHeader(content);

    if (!header) {
      return this._insertHeader(fullPath, relPath, content);
    }

    const { valid, errors } = validateHeader(header);
    if (!valid) {
      return { file: relPath, action: 'needs_repair', errors, dryRun: this.dryRun };
    }

    return { file: relPath, action: 'valid', dryRun: this.dryRun };
  }

  async _insertHeader(fullPath, relPath, content) {
    const regionResult = classifyRegion(relPath);
    const tag = inferTag(relPath);
    const fileName = relPath.split('/').pop().replace(/\.[^.]+$/, '');

    const headerBlock = buildHeader({
      region: regionResult.region,
      tag,
      fiveWH: {
        WHAT: `${fileName} module`,
        WHY: `${regionResult.metadata.description}`,
        WHO: this.author,
        WHERE: relPath,
        WHEN: new Date().getFullYear().toString(),
        HOW: 'Auto-inserted by LEEWAY header-agent',
      },
      agents: ['ASSESS', 'ALIGN', 'AUDIT'],
      license: 'MIT',
    });

    if (!this.dryRun) {
      await writeFile(fullPath, headerBlock + '\n' + content, 'utf8');
    }

    return { file: relPath, action: 'header_inserted', dryRun: this.dryRun };
  }

  /**
   * Process multiple files.
   *
   * @param {string[]} filePaths
   * @returns {Promise<object[]>}
   */
  async processFiles(filePaths) {
    const results = [];
    for (const fp of filePaths) {
      results.push(await this.processFile(fp));
    }
    return results;
  }
}
