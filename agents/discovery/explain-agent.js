/*
LEEWAY HEADER — DO NOT REMOVE

REGION: DOCS.AGENT.EXPLAIN
TAG: DOCS.STANDARD.EXPLAIN.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=message-circle

5WH:
WHAT = Explain agent — explains a file, module, or service in plain English
WHY = Any file in a LEEWAY system must be self-explainable to any developer or AI tool
WHO = Rapid Web Development
WHERE = src/agents/discovery/explain-agent.js
WHEN = 2026
HOW = Reads LEEWAY headers and produces structured human-readable explanations

AGENTS:
EXPLAIN
DOCS
ASSESS

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseHeader } from '../../core/header-parser.js';
import { classifyRegion } from '../../core/region-classifier.js';

/**
 * ExplainAgent produces human-readable explanations of LEEWAY files and modules.
 */
export class ExplainAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Explain a file in plain English.
   *
   * @param {string} filePath
   * @returns {Promise<Explanation>}
   */
  async explain(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    const relPath = filePath.startsWith('/') ? filePath.replace(this.rootDir + '/', '') : filePath;

    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { file: relPath, explanation: 'File could not be read.', hasHeader: false };
    }

    const header = parseHeader(content);
    if (!header) {
      const { region, metadata } = classifyRegion(relPath);
      return {
        file: relPath,
        hasHeader: false,
        explanation: `This file does not have a LEEWAY header. Based on its path, it appears to be a ${metadata.label} (${region}) module. It has not been documented according to LEEWAY standards.`,
        region,
      };
    }

    const wh = header.fiveWH || {};
    const parts = [
      `This file is "${relPath}".`,
      wh.WHAT ? `It is: ${wh.WHAT}.` : null,
      wh.WHY ? `It exists because: ${wh.WHY}.` : null,
      header.region ? `It belongs to the ${header.region} system region.` : null,
      header.tag ? `Its discovery tag is ${header.tag}.` : null,
      wh.HOW ? `It operates via: ${wh.HOW}.` : null,
      wh.WHO ? `It was created by: ${wh.WHO}.` : null,
      header.agents?.length ? `It is managed by these agents: ${header.agents.join(', ')}.` : null,
    ].filter(Boolean);

    return {
      file: relPath,
      hasHeader: true,
      region: header.region,
      tag: header.tag,
      explanation: parts.join(' '),
      fiveWH: wh,
    };
  }
}
