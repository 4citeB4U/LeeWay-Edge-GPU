/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.STANDARDS
TAG: AI.AGENT.TAG.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=tag

5WH:
WHAT = Tag agent — infers TAG values from file path, purpose, and role
WHY = Every file needs an accurate TAG for the system to be machine-searchable
WHO = Rapid Web Development
WHERE = src/agents/standards/tag-agent.js
WHEN = 2026
HOW = Uses path heuristics and file content analysis to suggest optimal TAGs

AGENTS:
TAG
ASSESS

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { validateTag, inferTag } from '../../core/tag-validator.js';
import { parseHeader } from '../../core/header-parser.js';

/**
 * TagAgent infers and validates LEEWAY TAG values for files.
 */
export class TagAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Analyze a file and suggest or validate its TAG.
   *
   * @param {string} filePath
   * @returns {Promise<TagAnalysis>}
   */
  async analyzeFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    const relPath = filePath.startsWith('/') ? filePath.replace(this.rootDir + '/', '') : filePath;

    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { file: relPath, status: 'error', reason: 'Cannot read file' };
    }

    const header = parseHeader(content);
    const suggestedTag = inferTag(relPath, this._extractContext(content));

    if (!header) {
      return {
        file: relPath,
        status: 'no_header',
        suggestedTag,
        currentTag: null,
      };
    }

    if (!header.tag) {
      return {
        file: relPath,
        status: 'missing_tag',
        suggestedTag,
        currentTag: null,
      };
    }

    const { valid, errors } = validateTag(header.tag);
    return {
      file: relPath,
      status: valid ? 'valid' : 'invalid_tag',
      currentTag: header.tag,
      suggestedTag: valid ? header.tag : suggestedTag,
      errors: valid ? [] : errors,
    };
  }

  _extractContext(content) {
    const lines = content.split('\n').slice(0, 30).join(' ');
    const purposeMatch = lines.match(/(?:export|function|class|const)\s+([A-Za-z][A-Za-z0-9]+)/);
    return { purpose: purposeMatch ? purposeMatch[1] : 'MAIN' };
  }

  /**
   * Analyze multiple files.
   * @param {string[]} filePaths
   * @returns {Promise<TagAnalysis[]>}
   */
  async analyzeFiles(filePaths) {
    const results = [];
    for (const fp of filePaths) {
      results.push(await this.analyzeFile(fp));
    }
    return results;
  }
}
