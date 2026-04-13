/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SEO.AGENT.SCHEMA
TAG: SEO.SCHEMA.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=code

5WH:
WHAT = Schema agent — generates machine-readable schemas and capability metadata
WHY = Applications must expose structured data for AI tools, search engines, and voice assistants
WHO = Rapid Web Development
WHERE = src/agents/discovery/schema-agent.js
WHEN = 2026
HOW = Generates Schema.org JSON-LD, OpenGraph, and capability manifest from LEEWAY metadata

AGENTS:
SCHEMA
SITEMAP
DISCOVERY

LICENSE:
MIT
*/

/**
 * SchemaAgent generates structured discovery metadata from LEEWAY headers and config.
 */
export class SchemaAgent {
  /**
   * Generate Schema.org JSON-LD for a software application.
   *
   * @param {{ name: string, description: string, url?: string, version?: string, author?: string }} config
   * @returns {object} - JSON-LD schema object
   */
  generateSoftwareApplicationSchema(config) {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: config.name,
      description: config.description,
      url: config.url || '',
      version: config.version || '1.0.1',
      author: {
        '@type': 'Organization',
        name: config.author || 'Unknown',
      },
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
    };
  }

  /**
   * Generate OpenGraph metadata tags.
   *
   * @param {{ title: string, description: string, url?: string, image?: string, type?: string }} config
   * @returns {object[]} - Array of meta tag objects
   */
  generateOpenGraphMeta(config) {
    return [
      { property: 'og:title', content: config.title },
      { property: 'og:description', content: config.description },
      { property: 'og:type', content: config.type || 'website' },
      { property: 'og:url', content: config.url || '' },
      { property: 'og:image', content: config.image || '' },
    ];
  }

  /**
   * Generate FAQ structured data from a Q&A list.
   *
   * @param {{ question: string, answer: string }[]} faqs
   * @returns {object} - FAQ JSON-LD schema
   */
  generateFAQSchema(faqs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    };
  }

  /**
   * Generate a LEEWAY capability manifest for a module.
   *
   * @param {{ name: string, region: string, tag: string, fiveWH: object, agents: string[] }} header
   * @returns {object} - Capability manifest
   */
  generateCapabilityManifest(header) {
    return {
      leeway: '1.0',
      identity: {
        name: header.name || header.fiveWH?.WHAT || 'Unknown',
        region: header.region,
        tag: header.tag,
      },
      fiveWH: header.fiveWH,
      authorizedAgents: header.agents || [],
      generated: new Date().toISOString(),
    };
  }
}
