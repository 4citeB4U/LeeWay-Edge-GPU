/*
LEEWAY HEADER — DO NOT REMOVE

REGION: DOCS.AGENT.ARCHITECTURE
TAG: DOCS.STANDARD.ARCHITECTURE.MAP

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=network

5WH:
WHAT = Architecture map agent — produces a visual or JSON architecture map of the codebase
WHY = Understanding system architecture is essential for safe evolution and AI-assisted development
WHO = Rapid Web Development
WHERE = src/agents/discovery/architecture-map-agent.js
WHEN = 2026
HOW = Reads LEEWAY registry and builds a layered region/module graph in JSON and ASCII

AGENTS:
ARCHITECTURE
DOCS
REGISTRY

LICENSE:
MIT
*/

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { parseHeader } from '../../core/header-parser.js';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', '.leeway']);
const CODE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']);

/**
 * ArchitectureMapAgent builds a structured architecture map from LEEWAY headers.
 */
export class ArchitectureMapAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Build a JSON architecture map.
   * @returns {Promise<ArchitectureMap>}
   */
  async buildMap() {
    const map = {
      agent: 'architecture-map-agent',
      generated: new Date().toISOString(),
      regions: {},
      modules: {},
      edges: [],
    };

    await this._walk(this.rootDir, map);
    return map;
  }

  /**
   * Build an ASCII text architecture diagram.
   * @returns {Promise<string>}
   */
  async buildAsciiDiagram() {
    const map = await this.buildMap();
    const lines = [
      '╔════════════════════════════════════════╗',
      '║      LEEWAY™ ARCHITECTURE MAP          ║',
      '╚════════════════════════════════════════╝',
      '',
    ];

    for (const [region, data] of Object.entries(map.regions)) {
      lines.push(`┌─ ${region} (${data.color}) `);
      for (const mod of data.modules) {
        lines.push(`│  ├─ [${mod.tag || 'NO TAG'}] ${mod.path}`);
        lines.push(`│  │   └─ ${mod.what || 'No description'}`);
      }
      lines.push('│');
    }

    return lines.join('\n');
  }

  async _walk(dir, map, depth = 0) {
    if (depth > 8) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await this._walk(fullPath, map, depth + 1);
      } else if (CODE_EXTENSIONS.has(extname(entry.name))) {
        const relPath = relative(this.rootDir, fullPath);
        try {
          const content = await readFile(fullPath, 'utf8');
          const header = parseHeader(content);
          if (header) {
            const regionKey = header.region?.split('.')?.[0] || 'UNKNOWN';
            if (!map.regions[regionKey]) {
              map.regions[regionKey] = { modules: [], color: this._regionColor(regionKey) };
            }
            map.regions[regionKey].modules.push({
              path: relPath,
              tag: header.tag,
              what: header.fiveWH?.WHAT,
              agents: header.agents,
            });
            map.modules[relPath] = { region: regionKey, tag: header.tag };
          }
        } catch {
          continue;
        }
      }
    }
  }

  _regionColor(region) {
    const colors = { UI: '#39FF14', CORE: '#FF6B35', DATA: '#4ECDC4', AI: '#A855F7', SEO: '#F59E0B', UTIL: '#6B7280', MCP: '#0EA5E9', SECURITY: '#EF4444' };
    return colors[region] || '#888888';
  }
}
