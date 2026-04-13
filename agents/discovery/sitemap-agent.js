/*
LEEWAY HEADER — DO NOT REMOVE

REGION: SEO.AGENT.SITEMAP
TAG: SEO.SITEMAP.AGENT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=map

5WH:
WHAT = Sitemap agent — builds site and discovery maps from LEEWAY registry
WHY = Applications must expose sitemaps for crawlers, search engines, and AI indexers
WHO = Rapid Web Development
WHERE = src/agents/discovery/sitemap-agent.js
WHEN = 2026
HOW = Reads route registrations and LEEWAY headers to build XML and JSON sitemaps

AGENTS:
SITEMAP
SCHEMA
REGISTRY

LICENSE:
MIT
*/

/**
 * SitemapAgent builds XML and JSON sitemaps from route registrations.
 */
export class SitemapAgent {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://example.com';
    this.routes = [];
  }

  /**
   * Add a route to the sitemap.
   *
   * @param {{ path: string, priority?: number, changefreq?: string, lastmod?: string }} route
   */
  addRoute(route) {
    this.routes.push({
      path: route.path,
      priority: route.priority || 0.5,
      changefreq: route.changefreq || 'weekly',
      lastmod: route.lastmod || new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Generate an XML sitemap string.
   * @returns {string}
   */
  generateXML() {
    const urls = this.routes.map(route => `  <url>
    <loc>${this.baseUrl}${route.path}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  /**
   * Generate a JSON sitemap.
   * @returns {object}
   */
  generateJSON() {
    return {
      baseUrl: this.baseUrl,
      generated: new Date().toISOString(),
      routes: this.routes.map(r => ({
        url: `${this.baseUrl}${r.path}`,
        ...r,
      })),
    };
  }
}
