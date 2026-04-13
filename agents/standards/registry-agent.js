/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.STANDARDS
TAG: AI.AGENT.REGISTRY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=database

5WH:
WHAT = Registry agent — updates tag registry, file registry, and system map
WHY = A LEEWAY system needs a queryable registry of all files and their identities
WHO = Rapid Web Development
WHERE = src/agents/standards/registry-agent.js
WHEN = 2026
HOW = Walks codebase, reads LEEWAY headers, writes to .leeway/registry.json

AGENTS:
REGISTRY
ASSESS
AUDIT

LICENSE:
MIT
*/

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { parseHeader } from '../../core/header-parser.js';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', 'coverage']);
const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']);

/**
 * RegistryAgent builds and updates the LEEWAY file and tag registries.
 */
export class RegistryAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.registryDir = join(this.rootDir, '.leeway');
    this.registryPath = join(this.registryDir, 'registry.json');
  }

  /**
   * Build the registry from the current codebase.
   * @returns {Promise<Registry>}
   */
  async build() {
    const registry = {
      version: '1.0.1',
      built: new Date().toISOString(),
      rootDir: this.rootDir,
      files: {},
      tags: {},
      regions: {},
    };

    await this._walk(this.rootDir, registry);
    return registry;
  }

  /**
   * Build and persist the registry to .leeway/registry.json
   * @returns {Promise<Registry>}
   */
  async buildAndSave() {
    const registry = await this.build();

    try {
      await mkdir(this.registryDir, { recursive: true });
      await writeFile(this.registryPath, JSON.stringify(registry, null, 2), 'utf8');
      registry.savedTo = this.registryPath;
    } catch (err) {
      registry.saveError = err.message;
    }

    return registry;
  }

  /**
   * Load the existing registry from disk.
   * @returns {Promise<Registry | null>}
   */
  async load() {
    try {
      const raw = await readFile(this.registryPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async _walk(dir, registry, depth = 0) {
    if (depth > 10) return;

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
        await this._walk(fullPath, registry, depth + 1);
      } else if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) {
        await this._indexFile(fullPath, relPath, registry);
      }
    }
  }

  async _indexFile(fullPath, relPath, registry) {
    let content;
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return;
    }

    const header = parseHeader(content);
    const entry = {
      path: relPath,
      hasHeader: !!header,
      region: header?.region || null,
      tag: header?.tag || null,
      agents: header?.agents || [],
      license: header?.license || null,
      fiveWH: header?.fiveWH || {},
    };

    registry.files[relPath] = entry;

    if (header?.tag) {
      if (!registry.tags[header.tag]) registry.tags[header.tag] = [];
      registry.tags[header.tag].push(relPath);
    }

    if (header?.region) {
      const regionKey = header.region.split('.')[0];
      registry.regions[regionKey] = (registry.regions[regionKey] || 0) + 1;
    }
  }
}
