/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SEO.AGENT.INTENT
TAG: SEO.INTENT.REGISTRY.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=list-tree

5WH:
WHAT = Intent registry agent — tracks supported intents and their routes
WHY = AI agents and voice assistants need a machine-readable registry of supported intents
WHO = Rapid Web Development
WHERE = src/agents/discovery/intent-registry-agent.js
WHEN = 2026
HOW = Maintains a registry of intent-to-handler mappings in .leeway/intents.json

AGENTS:
INTENT
SCHEMA
REGISTRY

LICENSE:
MIT
*/

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * IntentRegistryAgent tracks supported intents and routes.
 */
export class IntentRegistryAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.registryPath = join(this.rootDir, '.leeway', 'intents.json');
    this.intents = new Map();
  }

  /**
   * Register an intent.
   *
   * @param {string} intentName
   * @param {{ handler: string, description: string, examples?: string[], parameters?: object }} config
   */
  register(intentName, config) {
    this.intents.set(intentName.toLowerCase(), {
      name: intentName,
      handler: config.handler,
      description: config.description,
      examples: config.examples || [],
      parameters: config.parameters || {},
      registered: new Date().toISOString(),
    });
  }

  /**
   * Resolve an intent by name.
   *
   * @param {string} intentName
   * @returns {object | null}
   */
  resolve(intentName) {
    return this.intents.get(intentName.toLowerCase()) || null;
  }

  /**
   * Persist the intent registry.
   */
  async save() {
    await mkdir(join(this.rootDir, '.leeway'), { recursive: true });
    const data = {
      version: '1.0',
      updated: new Date().toISOString(),
      intents: Object.fromEntries(this.intents),
    };
    await writeFile(this.registryPath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Load intents from disk.
   */
  async load() {
    try {
      const raw = await readFile(this.registryPath, 'utf8');
      const data = JSON.parse(raw);
      for (const [key, val] of Object.entries(data.intents || {})) {
        this.intents.set(key, val);
      }
    } catch {
      // No registry yet
    }
  }

  /**
   * Export as a machine-readable discovery manifest.
   * @returns {object}
   */
  toDiscoveryManifest() {
    return {
      '@context': 'https://schema.org',
      '@type': 'DataCatalog',
      name: 'LEEWAY Intent Registry',
      description: 'Machine-readable registry of supported intents and their handlers',
      dataset: Array.from(this.intents.values()).map(intent => ({
        '@type': 'Dataset',
        name: intent.name,
        description: intent.description,
        keywords: intent.examples,
      })),
    };
  }
}
