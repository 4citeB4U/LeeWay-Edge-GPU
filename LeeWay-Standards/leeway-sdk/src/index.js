/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.INDEX.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = index module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = LeeWay-Standards\leeway-sdk\src\index.js
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

// Entry point to re-export key functions from the SDK
export { auditFile, auditDirectory } from './audit.js';
export { fixFile, fixDirectory } from './fix.js';
export { generateMarkdownReport } from './report.js';
export { inferTag, mapTagToRegion, generateDiscoveryPipeline } from './utils.js';