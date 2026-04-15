/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.SDK.VALIDATOR
TAG: CORE.SDK.TAG.VALIDATOR

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=tag

5WH:
WHAT = Validates and infers LEEWAY TAG values for files
WHY = Every file needs a structured TAG to be discoverable and machine-readable
WHO = Rapid Web Development
WHERE = src/core/tag-validator.js
WHEN = 2026
HOW = Pattern matching against known domain/subdomain/asset/purpose vocabulary

AGENTS:
TAG
ASSESS

LICENSE:
MIT
*/

const TAG_DOMAINS = ['UI', 'CORE', 'DATA', 'AI', 'SEO', 'UTIL', 'MCP', 'SECURITY', 'TEST', 'DOCS'];

const DOMAIN_SUBDOMAINS = {
  UI: ['COMPONENT', 'PAGE', 'LAYOUT', 'HOOK', 'CONTEXT', 'STYLE', 'THEME'],
  CORE: ['SDK', 'ENGINE', 'RUNTIME', 'CONFIG', 'SCHEMA', 'REGISTRY'],
  DATA: ['LOCAL', 'REMOTE', 'STORE', 'CACHE', 'MODEL', 'MIGRATION'],
  AI: ['ORCHESTRATION', 'MODEL', 'PROMPT', 'ROUTER', 'AGENT', 'MEMORY'],
  SEO: ['SCHEMA', 'META', 'SITEMAP', 'GENERATOR', 'DISCOVERY', 'INTENT'],
  UTIL: ['FORMAT', 'DATE', 'STRING', 'MATH', 'CRYPTO', 'LOGGER', 'HELPER'],
  MCP: ['TRANSPORT', 'ENDPOINT', 'PORT', 'PROCESS', 'MANIFEST', 'HEALTH', 'ENV', 'RUNTIME'],
  SECURITY: ['SCANNER', 'POLICY', 'PERMISSION', 'VALIDATOR', 'AUDIT', 'PRIVACY', 'ACCESS'],
  TEST: ['UNIT', 'INTEGRATION', 'E2E', 'FIXTURE', 'MOCK'],
  DOCS: ['STANDARD', 'GUIDE', 'SCHEMA', 'REPORT', 'EXAMPLE'],
};

/**
 * Validate a LEEWAY TAG string.
 * Format: DOMAIN.SUBDOMAIN.ASSET.PURPOSE (minimum 3 parts)
 *
 * @param {string} tag
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTag(tag) {
  const errors = [];

  if (!tag || typeof tag !== 'string') {
    return { valid: false, errors: ['TAG must be a non-empty string'] };
  }

  const parts = tag.toUpperCase().split('.');
  if (parts.length < 3) {
    errors.push('TAG must have at least 3 parts: DOMAIN.SUBDOMAIN.ASSET');
  }

  const [domain, subdomain] = parts;

  if (!TAG_DOMAINS.includes(domain)) {
    errors.push(`Unknown TAG domain "${domain}". Valid: ${TAG_DOMAINS.join(', ')}`);
  } else if (subdomain && DOMAIN_SUBDOMAINS[domain]) {
    if (!DOMAIN_SUBDOMAINS[domain].includes(subdomain)) {
      errors.push(`Unknown subdomain "${subdomain}" for domain "${domain}". Valid: ${DOMAIN_SUBDOMAINS[domain].join(', ')}`);
    }
  }

  const tagPattern = /^[A-Z][A-Z0-9]*(\.[A-Z][A-Z0-9]*)+$/;
  if (!tagPattern.test(tag)) {
    errors.push('TAG must use UPPERCASE.DOT.NOTATION with alphanumeric segments');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Infer a LEEWAY TAG from a file path and optional context.
 *
 * @param {string} filePath - Relative or absolute file path
 * @param {{ purpose?: string, name?: string }} [context]
 * @returns {string} - Inferred TAG string
 */
export function inferTag(filePath, context = {}) {
  const path = filePath.toLowerCase().replace(/\\/g, '/');
  const normalizedOriginal = filePath.replace(/\\/g, '/');
  const originalSegments = normalizedOriginal.split('/').filter(Boolean);
  const originalFileName = originalSegments[originalSegments.length - 1] || '';
  const segments = path.split('/').filter(Boolean);
  const fileName = segments[segments.length - 1] || '';
  const baseName = fileName.replace(/\.[^.]+$/, '').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const purpose = (context.purpose || 'MAIN').toUpperCase().replace(/[^A-Z0-9]/g, '_');

  if (path.includes('/components/') || path.includes('/ui/')) {
    return `UI.COMPONENT.${baseName}.${purpose}`;
  }
  if (path.includes('/pages/') || path.includes('/page/')) {
    return `UI.PAGE.${baseName}.${purpose}`;
  }
  if (path.includes('/hooks/') || /^use[A-Z]/.test(originalFileName)) {
    return `UI.HOOK.${baseName}.${purpose}`;
  }
  if (path.includes('/agents/')) {
    return `AI.AGENT.${baseName}.${purpose}`;
  }
  if (path.includes('/ai/') || path.includes('/llm/')) {
    return `AI.ORCHESTRATION.${baseName}.${purpose}`;
  }
  if (path.includes('/data/') || path.includes('/store/') || path.includes('/db/')) {
    return `DATA.STORE.${baseName}.${purpose}`;
  }
  if (path.includes('/security/') || path.includes('/auth/')) {
    return `SECURITY.VALIDATOR.${baseName}.${purpose}`;
  }
  if (path.includes('/seo/') || path.includes('/discovery/') || path.includes('/schema/')) {
    return `SEO.SCHEMA.${baseName}.${purpose}`;
  }
  if (path.includes('/utils/') || path.includes('/helpers/') || path.includes('/util/')) {
    return `UTIL.HELPER.${baseName}.${purpose}`;
  }
  if (path.includes('/mcp/') || path.includes('/transport/')) {
    return `MCP.TRANSPORT.${baseName}.${purpose}`;
  }
  if (path.includes('/core/') || path.includes('/sdk/')) {
    return `CORE.SDK.${baseName}.${purpose}`;
  }
  if (path.includes('/docs/') || path.includes('/documentation/')) {
    return `DOCS.STANDARD.${baseName}.${purpose}`;
  }

  return `CORE.SDK.${baseName}.${purpose}`;
}
