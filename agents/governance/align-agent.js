/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.GOVERNANCE
TAG: AI.AGENT.ALIGN.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=align-left

5WH:
WHAT = Align agent — normalizes files, settings, transports, ports, and env structure
WHY = Drift in naming, structure, and configuration breaks governance and causes deployment failures
WHO = Rapid Web Development
WHERE = src/agents/governance/align-agent.js
WHEN = 2026
HOW = Reads assessment results, proposes normalized corrections, applies non-destructive patches

AGENTS:
ALIGN
ASSESS

LICENSE:
MIT
*/

import { readFile, writeFile, rename } from 'node:fs/promises';
import { join, basename, dirname, extname } from 'node:path';
import { buildHeader, parseHeader } from '../../core/header-parser.js';
import { inferTag } from '../../core/tag-validator.js';
import { classifyRegion } from '../../core/region-classifier.js';

/**
 * AlignAgent normalizes files and structures according to LEEWAY standards.
 * Operates in dry-run mode by default — set options.dryRun = false to apply changes.
 */
export class AlignAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.dryRun = options.dryRun !== false;
    this.log = options.log || (() => {});
    this.changes = [];
  }

  /**
   * Align a list of files that were identified as needing headers by the assess agent.
   *
   * @param {string[]} filePaths - Relative file paths from assessment
   * @returns {Promise<AlignResult>}
   */
  async alignHeaders(filePaths) {
    const results = [];

    for (const relPath of filePaths) {
      const fullPath = join(this.rootDir, relPath);
      try {
        const content = await readFile(fullPath, 'utf8');
        const existingHeader = parseHeader(content);

        if (existingHeader) {
          results.push({ file: relPath, action: 'skipped', reason: 'Header already present' });
          continue;
        }

        const regionResult = classifyRegion(relPath);
        const tag = inferTag(relPath);
        const fileName = basename(relPath, extname(relPath));

        const header = buildHeader({
          region: regionResult.region,
          tag,
          fiveWH: {
            WHAT: `${fileName} module`,
            WHY: `Part of ${regionResult.region} region`,
            WHO: 'LEEWAY Align Agent',
            WHERE: relPath,
            WHEN: new Date().getFullYear().toString(),
            HOW: 'Auto-aligned by LEEWAY align-agent',
          },
          agents: ['ASSESS', 'ALIGN', 'AUDIT'],
          license: 'MIT',
        });

        const newContent = header + '\n' + content;

        if (!this.dryRun) {
          await writeFile(fullPath, newContent, 'utf8');
        }

        this.changes.push({ type: 'header_added', file: relPath });
        results.push({ file: relPath, action: 'header_added', dryRun: this.dryRun });
      } catch (err) {
        results.push({ file: relPath, action: 'error', reason: err.message });
      }
    }

    return {
      agent: 'align-agent',
      dryRun: this.dryRun,
      processed: results.length,
      results,
      changes: this.changes,
    };
  }

  /**
   * Align naming conventions for a list of files.
   * Reports violations without renaming (renaming requires explicit approval).
   *
   * @param {string[]} filePaths
   * @returns {Promise<object[]>}
   */
  async checkNaming(filePaths) {
    const violations = [];

    for (const relPath of filePaths) {
      const fileName = basename(relPath);
      const dir = dirname(relPath).toLowerCase();
      const ext = extname(fileName);
      const base = basename(fileName, ext);

      const isComponent = dir.includes('component') || dir.includes('page') || dir.includes('layout');
      const isUtil = dir.includes('util') || dir.includes('helper');

      if (isComponent) {
        const isPascal = /^[A-Z][a-zA-Z0-9]*$/.test(base);
        if (!isPascal) {
          violations.push({
            file: relPath,
            issue: 'React component should use PascalCase',
            current: base,
            suggested: base.charAt(0).toUpperCase() + base.slice(1),
          });
        }
      } else if (isUtil) {
        const isCamel = /^[a-z][a-zA-Z0-9]*$/.test(base);
        const isKebab = /^[a-z][a-z0-9-]*$/.test(base);
        if (!isCamel && !isKebab) {
          violations.push({
            file: relPath,
            issue: 'Utility file should use camelCase or kebab-case',
            current: base,
          });
        }
      }
    }

    return violations;
  }
}
