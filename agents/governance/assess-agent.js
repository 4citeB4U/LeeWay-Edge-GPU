/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.GOVERNANCE
TAG: AI.AGENT.ASSESS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=search

5WH:
WHAT = Assess agent — surveys what already exists before anything is created or patched
WHY = Prevents duplicate work, identifies existing patterns, and gives align/audit agents accurate ground truth
WHO = Rapid Web Development
WHERE = src/agents/governance/assess-agent.js
WHEN = 2026
HOW = Event-driven file walker, dormant until invoked, returns structured inventory

AGENTS:
ASSESS

LICENSE:
MIT
*/

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { parseHeader } from '../../core/header-parser.js';
import { classifyRegion } from '../../core/region-classifier.js';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', 'coverage']);
const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs', '.py', '.go', '.rs']);

/**
 * AssessAgent surveys a directory for existing files, headers, regions, and patterns.
 * Must be called before any modification or creation operations.
 */
export class AssessAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.maxDepth = options.maxDepth || 10;
    this.log = options.log || (() => {});
  }

  /**
   * Run assessment on the root directory.
   * @returns {Promise<AssessmentResult>}
   */
  async run() {
    const startTime = Date.now();
    const inventory = {
      totalFiles: 0,
      codeFiles: 0,
      filesWithHeaders: 0,
      filesWithoutHeaders: [],
      regionMap: {},
      tagMap: {},
      duplicateTags: [],
      missingHeaders: [],
      structure: {},
      coreProtectedFiles: [
        'src/index.js',
        'src/cli/leeway.js',
        'src/agents/governance/assess-agent.js',
        'src/agents/orchestration/doctor-agent.js'
      ],
      compromisedCoreFiles: [],
    };

    await this._walk(this.rootDir, inventory, 0);
    this._detectDuplicateTags(inventory);

    return {
      agent: 'assess-agent',
      rootDir: this.rootDir,
      durationMs: Date.now() - startTime,
      inventory,
      summary: this._buildSummary(inventory),
    };
  }

  async _walk(dir, inventory, depth) {
    if (depth > this.maxDepth) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      const relPath = relative(this.rootDir, fullPath);

      if (entry.isDirectory()) {
        inventory.structure[relPath] = 'directory';
        await this._walk(fullPath, inventory, depth + 1);
      } else if (entry.isFile()) {
        inventory.totalFiles++;
        inventory.structure[relPath] = 'file';

        if (CODE_EXTENSIONS.has(extname(entry.name))) {
          inventory.codeFiles++;
          await this._analyzeFile(fullPath, relPath, inventory);
        }
      }
    }
  }

  async _analyzeFile(fullPath, relPath, inventory) {
    let content;
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return;
    }

    const header = parseHeader(content);
    const isCore = inventory.coreProtectedFiles.some(f => relPath.endsWith(f));

    if (header) {
      inventory.filesWithHeaders++;
      if (header.region) {
        inventory.regionMap[header.region] = (inventory.regionMap[header.region] || 0) + 1;
      }
      if (header.tag) {
        if (!inventory.tagMap[header.tag]) inventory.tagMap[header.tag] = [];
        inventory.tagMap[header.tag].push(relPath);
      }
    } else {
      inventory.filesWithoutHeaders.push(relPath);
      inventory.missingHeaders.push(relPath);
      if (isCore) inventory.compromisedCoreFiles.push(relPath);

      const regionResult = classifyRegion(relPath);
      const region = regionResult.region;
      inventory.regionMap[`UNCLASSIFIED.${region}`] = (inventory.regionMap[`UNCLASSIFIED.${region}`] || 0) + 1;
    }
  }

  _detectDuplicateTags(inventory) {
    for (const [tag, files] of Object.entries(inventory.tagMap)) {
      if (files.length > 1) {
        inventory.duplicateTags.push({ tag, files });
      }
    }
  }

  _buildSummary(inventory) {
    const headerCoverage = inventory.codeFiles > 0
      ? Math.round((inventory.filesWithHeaders / inventory.codeFiles) * 100)
      : 0;

    return {
      headerCoverage: `${headerCoverage}%`,
      codeFiles: inventory.codeFiles,
      totalFiles: inventory.totalFiles,
      filesNeedingHeaders: inventory.missingHeaders.length,
      duplicateTagCount: inventory.duplicateTags.length,
      regionsFound: Object.keys(inventory.regionMap).filter(r => !r.startsWith('UNCLASSIFIED')).length,
      protectedFilesCompromised: inventory.compromisedCoreFiles.length > 0,
      compromisedFiles: inventory.compromisedCoreFiles,
    };
  }
}
