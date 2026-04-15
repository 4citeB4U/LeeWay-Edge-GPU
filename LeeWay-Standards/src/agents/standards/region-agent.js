/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.STANDARDS
TAG: AI.AGENT.REGION.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=map

5WH:
WHAT = Region agent — assigns REGION correctly to files based on path and content
WHY = Files must belong to the correct system region for governance and discoverability
WHO = Rapid Web Development
WHERE = src/agents/standards/region-agent.js
WHEN = 2026
HOW = Path analysis and content scanning to determine the most appropriate region

AGENTS:
REGION
ASSESS

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { classifyRegion, REGIONS } from '../../core/region-classifier.js';
import { parseHeader } from '../../core/header-parser.js';

/**
 * RegionAgent assigns and validates LEEWAY REGION values.
 */
export class RegionAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Analyze a file and determine its correct REGION.
   *
   * @param {string} filePath
   * @returns {Promise<RegionAnalysis>}
   */
  async analyzeFile(filePath) {
    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    const relPath = filePath.startsWith('/') ? filePath.replace(this.rootDir + '/', '') : filePath;

    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { file: relPath, status: 'error' };
    }

    const header = parseHeader(content);
    const { region: inferredRegion, confidence, metadata } = classifyRegion(relPath);

    if (!header) {
      return {
        file: relPath,
        status: 'no_header',
        inferredRegion,
        confidence,
        description: metadata.description,
      };
    }

    const declaredRegion = header.region ? header.region.split('.')[0] : null;
    const mismatch = declaredRegion && declaredRegion !== inferredRegion && confidence === 'high';

    return {
      file: relPath,
      status: mismatch ? 'region_mismatch' : 'valid',
      declaredRegion: header.region,
      inferredRegion,
      confidence,
      description: metadata.description,
      mismatch,
    };
  }

  /**
   * Get a summary of all available regions.
   * @returns {object}
   */
  getRegionMap() {
    return Object.entries(REGIONS).reduce((acc, [key, val]) => {
      acc[key] = { label: val.label, description: val.description, color: val.color };
      return acc;
    }, {});
  }
}
