/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.SDK.CLASSIFIER
TAG: CORE.SDK.REGION.CLASSIFIER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=map-pin

5WH:
WHAT = Classifies files into LEEWAY system regions
WHY = Every file must belong to a named region that defines its role and layer in the system
WHO = Rapid Web Development
WHERE = src/core/region-classifier.js
WHEN = 2026
HOW = Path-based heuristics with configurable overrides

AGENTS:
REGION
ASSESS

LICENSE:
MIT
*/

/**
 * All recognized LEEWAY system regions with metadata.
 */
export const REGIONS = {
  UI: {
    label: 'User Interface',
    description: 'User interface components, pages, layouts, and styling',
    color: '#39FF14',
    paths: ['components', 'pages', 'layouts', 'ui', 'views', 'screens', 'styles', 'themes'],
  },
  CORE: {
    label: 'Core System',
    description: 'Core system logic, runtime, configuration, and SDK internals',
    color: '#FF6B35',
    paths: ['core', 'sdk', 'runtime', 'engine', 'config', 'lib'],
  },
  DATA: {
    label: 'Data Storage',
    description: 'Storage, database access, models, caches, and migrations',
    color: '#4ECDC4',
    paths: ['data', 'store', 'stores', 'db', 'database', 'models', 'migrations', 'cache'],
  },
  AI: {
    label: 'AI Orchestration',
    description: 'AI orchestration, models, prompts, agents, and memory',
    color: '#A855F7',
    paths: ['ai', 'agents', 'llm', 'ml', 'prompts', 'models', 'memory', 'orchestration'],
  },
  SEO: {
    label: 'Search & Discovery',
    description: 'SEO, structured data, sitemaps, and discovery metadata',
    color: '#F59E0B',
    paths: ['seo', 'discovery', 'schema', 'sitemap', 'metadata', 'structured-data'],
  },
  UTIL: {
    label: 'Utilities',
    description: 'Utility functions, formatters, helpers, and shared tools',
    color: '#6B7280',
    paths: ['utils', 'util', 'helpers', 'shared', 'common', 'tools'],
  },
  MCP: {
    label: 'Multi-Component Processing',
    description: 'MCP transport, endpoints, ports, processes, and manifests',
    color: '#0EA5E9',
    paths: ['mcp', 'transport', 'endpoints', 'ports', 'processes', 'manifests'],
  },
  SECURITY: {
    label: 'Security',
    description: 'Security, authentication, authorization, and policy enforcement',
    color: '#EF4444',
    paths: ['security', 'auth', 'authentication', 'authorization', 'policies', 'permissions'],
  },
  TEST: {
    label: 'Testing',
    description: 'Unit tests, integration tests, fixtures, and mocks',
    color: '#10B981',
    paths: ['test', 'tests', '__tests__', 'spec', 'specs', 'fixtures', 'mocks'],
  },
  DOCS: {
    label: 'Documentation',
    description: 'Standards documents, guides, schemas, and reports',
    color: '#8B5CF6',
    paths: ['docs', 'documentation', 'guides', 'reports', 'schemas', 'examples'],
  },
};

/**
 * Classify a file into a LEEWAY region based on its path.
 *
 * @param {string} filePath - Relative or absolute file path
 * @returns {{ region: string, confidence: 'high' | 'medium' | 'low', metadata: object }}
 */
export function classifyRegion(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return { region: 'CORE', confidence: 'low', metadata: REGIONS.CORE };
  }

  const path = filePath.toLowerCase().replace(/\\/g, '/');
  const segments = path.split('/').filter(Boolean);

  for (const [regionKey, regionData] of Object.entries(REGIONS)) {
    for (const pattern of regionData.paths) {
      if (segments.includes(pattern)) {
        return {
          region: regionKey,
          confidence: 'high',
          metadata: regionData,
        };
      }
    }
  }

  for (const [regionKey, regionData] of Object.entries(REGIONS)) {
    for (const pattern of regionData.paths) {
      if (path.includes(pattern)) {
        return {
          region: regionKey,
          confidence: 'medium',
          metadata: regionData,
        };
      }
    }
  }

  return { region: 'CORE', confidence: 'low', metadata: REGIONS.CORE };
}
