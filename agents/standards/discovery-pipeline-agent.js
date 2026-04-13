/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI.AGENT.STANDARDS
TAG: AI.AGENT.DISCOVERY.PIPELINE

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=git-merge

5WH:
WHAT = Discovery pipeline agent — ensures every artifact has the discovery chain metadata
WHY = LEEWAY applications must be visible to search engines, AI tools, and voice assistants
WHO = Rapid Web Development
WHERE = src/agents/standards/discovery-pipeline-agent.js
WHEN = 2026
HOW = Checks for Schema.org JSON-LD, OpenGraph, sitemap, and FAQ structured data presence

AGENTS:
DISCOVERY
SCHEMA
SITEMAP

LICENSE:
MIT
*/

import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DISCOVERY_CHECKS = [
  { id: 'jsonld', label: 'Schema.org JSON-LD', pattern: /<script[^>]+type="application\/ld\+json"/i },
  { id: 'opengraph', label: 'OpenGraph meta tags', pattern: /<meta[^>]+property="og:/i },
  { id: 'twitter_card', label: 'Twitter Card meta', pattern: /<meta[^>]+name="twitter:/i },
  { id: 'canonical', label: 'Canonical URL', pattern: /<link[^>]+rel="canonical"/i },
  { id: 'faq', label: 'FAQ structured data', pattern: /"@type"\s*:\s*"FAQPage"/i },
];

/**
 * DiscoveryPipelineAgent checks that HTML/JSX files include required discovery metadata.
 */
export class DiscoveryPipelineAgent {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  /**
   * Check a file for discovery chain completeness.
   *
   * @param {string} filePath
   * @returns {Promise<DiscoveryCheckResult>}
   */
  async checkFile(filePath) {
    const ext = extname(filePath).toLowerCase();
    const htmlLike = ['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte'];

    if (!htmlLike.includes(ext)) {
      return { file: filePath, applicable: false, reason: 'Not an HTML-like file' };
    }

    const fullPath = filePath.startsWith('/') ? filePath : join(this.rootDir, filePath);
    let content = '';
    try {
      content = await readFile(fullPath, 'utf8');
    } catch {
      return { file: filePath, applicable: true, status: 'error' };
    }

    const checks = DISCOVERY_CHECKS.map(check => ({
      ...check,
      present: check.pattern.test(content),
    }));

    const presentCount = checks.filter(c => c.present).length;
    const score = Math.round((presentCount / DISCOVERY_CHECKS.length) * 100);

    return {
      file: filePath,
      applicable: true,
      score,
      checks,
      missing: checks.filter(c => !c.present).map(c => c.label),
      status: score === 100 ? 'complete' : score >= 60 ? 'partial' : 'incomplete',
    };
  }
}
