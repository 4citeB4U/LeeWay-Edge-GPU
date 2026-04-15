/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.UTILS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = utils module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWay-Standards\leeway-sdk\src\utils.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * Infer a LEEWAY TAG from a file path.
 *
 * TAGs are structured as DOMAIN.SUBDOMAIN.ASSET.PURPOSE. We map certain
 * common file locations to sensible defaults:
 *  - UI component files (e.g. src/components/Button.tsx) → UI.COMPONENT.Button.MAIN
 *  - UI page files (e.g. pages/Home.tsx) → UI.PUBLIC.PAGE.Home
 *  - AI/model loader files (e.g. src/ai/modelLoader.ts) → AI.ORCHESTRATION.MODEL.LOADER
 *  - Data store files (e.g. src/store/userStore.ts) → DATA.LOCAL.STORE.MAIN
 *  - Tools (e.g. tools/sitemapGenerator.js) → TOOLS.{TYPE}.{NAME}.MAIN where TYPE is directory name
 * If none of the above matches, we use UNKNOWN.UNKNOWN.UNKNOWN.UNKNOWN.
 */
function inferTag(filePath) {
  const parts = filePath.split(/\\|\//);
  const fileNameWithExt = parts[parts.length - 1];
  const fileName = fileNameWithExt.replace(/\.[^.]+$/, '');
  // Determine by directory pattern
  const lowerPath = filePath.toLowerCase();
  if (lowerPath.includes('/components/') || lowerPath.includes('components\\')) {
    return `UI.COMPONENT.${capitalize(fileName)}.MAIN`;
  }
  if (lowerPath.includes('/pages/') || lowerPath.includes('pages\\')) {
    return `UI.PUBLIC.PAGE.${capitalize(fileName)}`;
  }
  if (lowerPath.includes('/ai/') || lowerPath.includes('ai\\')) {
    return 'AI.ORCHESTRATION.MODEL.LOADER';
  }
  if (lowerPath.includes('/store/') || lowerPath.includes('store\\') || lowerPath.includes('/data/') || lowerPath.includes('data\\')) {
    return 'DATA.LOCAL.STORE.MAIN';
  }
  if (lowerPath.includes('/tools/') || lowerPath.includes('tools\\')) {
    // Grab the tool type (folder right after tools)
    const toolIndex = parts.findIndex(p => p.toLowerCase() === 'tools');
    const type = toolIndex >= 0 && parts.length > toolIndex + 1 ? capitalize(parts[toolIndex + 1]) : 'General';
    return `TOOLS.${type}.${capitalize(fileName)}.MAIN`;
  }
  return 'UNKNOWN.UNKNOWN.UNKNOWN.UNKNOWN';
}

/**
 * Map a TAG's DOMAIN to its corresponding REGION.
 * The mapping is:
 * UI → 🔵 UI, AI → 🧠 AI, DATA → 💾 DATA,
 * CORE → 🟢 CORE, MCP → 🟣 MCP, SEO → 🔴 SEO, UTIL → 🟠 UTIL.
 * If unknown, returns ⚪ UNKNOWN.
 */
function mapTagToRegion(tag) {
  const domain = tag.split('.')[0].toUpperCase();
  switch (domain) {
    case 'UI':
      return '🔵 UI';
    case 'AI':
      return '🧠 AI';
    case 'DATA':
      return '💾 DATA';
    case 'CORE':
      return '🟢 CORE';
    case 'MCP':
      return '🟣 MCP';
    case 'SEO':
      return '🔴 SEO';
    case 'UTIL':
      return '🟠 UTIL';
    default:
      return '⚪ UNKNOWN';
  }
}

/**
 * Generate a DISCOVERY_PIPELINE stub following the canonical flow.
 */
function generateDiscoveryPipeline() {
  return 'Voice → Intent → Location → Vertical → Ranking → Render';
}

/**
 * Capitalize the first letter of a string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export { inferTag, mapTagToRegion, generateDiscoveryPipeline };