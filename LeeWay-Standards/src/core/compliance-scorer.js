/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.SDK.SCORER
TAG: CORE.SDK.COMPLIANCE.SCORER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=bar-chart-2

5WH:
WHAT = Scores LEEWAY compliance for files, directories, and repositories
WHY = The LEEWAY system must be able to quantify how well a codebase follows governance standards
WHO = Rapid Web Development
WHERE = src/core/compliance-scorer.js
WHEN = 2026
HOW = Weighted scoring across header, tag, placement, security, and naming rules

AGENTS:
AUDIT
ASSESS
DOCTOR

LICENSE:
MIT
*/

import { parseHeader, validateHeader } from './header-parser.js';
import { validateTag } from './tag-validator.js';
import { classifyRegion } from './region-classifier.js';

export const COMPLIANCE_LEVELS = {
  PLATINUM: { min: 95, label: 'Platinum', description: 'Fully LEEWAY-compliant' },
  GOLD: { min: 80, label: 'Gold', description: 'Mostly compliant, minor gaps' },
  SILVER: { min: 60, label: 'Silver', description: 'Partially compliant, moderate gaps' },
  BRONZE: { min: 40, label: 'Bronze', description: 'Minimal compliance, major gaps' },
  NONE: { min: 0, label: 'None', description: 'Not LEEWAY-compliant' },
};

const SCORE_WEIGHTS = {
  hasHeader: 30,
  headerValid: 20,
  tagValid: 15,
  regionDeclared: 10,
  namingConvention: 10,
  correctPlacement: 10,
  securityCompliant: 5,
};

/**
 * Score the LEEWAY compliance of a single file.
 *
 * @param {{ filePath: string, content: string }} file
 * @returns {{ score: number, level: string, breakdown: object, issues: string[] }}
 */
export function scoreCompliance(file) {
  const { filePath = '', content = '' } = file;
  const breakdown = {};
  const issues = [];
  let totalScore = 0;

  const header = parseHeader(content);
  const hasHeader = header !== null;
  breakdown.hasHeader = hasHeader ? SCORE_WEIGHTS.hasHeader : 0;
  totalScore += breakdown.hasHeader;
  if (!hasHeader) issues.push('Missing LEEWAY header block');

  if (hasHeader) {
    const { valid: headerValid, errors: headerErrors } = validateHeader(header);
    breakdown.headerValid = headerValid ? SCORE_WEIGHTS.headerValid : Math.round(SCORE_WEIGHTS.headerValid * (1 - headerErrors.length / 7));
    totalScore += breakdown.headerValid;
    if (!headerValid) issues.push(...headerErrors);

    if (header.tag) {
      const { valid: tagValid, errors: tagErrors } = validateTag(header.tag);
      breakdown.tagValid = tagValid ? SCORE_WEIGHTS.tagValid : 0;
      totalScore += breakdown.tagValid;
      if (!tagValid) issues.push(...tagErrors);
    } else {
      breakdown.tagValid = 0;
    }

    breakdown.regionDeclared = header.region ? SCORE_WEIGHTS.regionDeclared : 0;
    totalScore += breakdown.regionDeclared;
    if (!header.region) issues.push('Missing REGION declaration');
  } else {
    breakdown.headerValid = 0;
    breakdown.tagValid = 0;
    breakdown.regionDeclared = 0;
  }

  const namingScore = checkNamingConvention(filePath);
  breakdown.namingConvention = namingScore ? SCORE_WEIGHTS.namingConvention : 0;
  totalScore += breakdown.namingConvention;
  if (!namingScore) issues.push(`File naming convention violation: ${filePath}`);

  const placementScore = checkPlacement(filePath, header);
  breakdown.correctPlacement = placementScore ? SCORE_WEIGHTS.correctPlacement : 0;
  totalScore += breakdown.correctPlacement;
  if (!placementScore) issues.push(`File placement may be incorrect for region`);

  const securityScore = checkSecurity(content);
  breakdown.securityCompliant = securityScore ? SCORE_WEIGHTS.securityCompliant : 0;
  totalScore += breakdown.securityCompliant;
  if (!securityScore) issues.push('Potential security violation detected (secrets/credentials)');

  const score = Math.min(100, Math.max(0, totalScore));
  const level = getComplianceLevel(score);

  return { score, level, breakdown, issues };
}

function checkNamingConvention(filePath) {
  if (!filePath) return false;
  const path = filePath.replace(/\\/g, '/');
  const segments = path.split('/');
  const fileName = segments[segments.length - 1] || '';

  const isPascalCase = /^[A-Z][a-zA-Z0-9]*(\.[a-z]+)+$/.test(fileName);
  const isCamelCase = /^[a-z][a-zA-Z0-9]*(\.[a-z]+)+$/.test(fileName);
  const isKebabCase = /^[a-z][a-z0-9-]*(\.[a-z]+)+$/.test(fileName);

  return isPascalCase || isCamelCase || isKebabCase;
}

function checkPlacement(filePath, header) {
  if (!filePath || !header || !header.region) return true;
  const path = filePath.toLowerCase().replace(/\\/g, '/');
  const region = header.region.split('.')[0];

  // Exempt files that legitimately live outside region-mapped directories
  if (
    path.includes('/examples/') || path.startsWith('examples/') ||
    path.includes('/cli/') ||
    /(?:^|\/)index\.\w+$/.test(path)
  ) return true;

  const regionPathMap = {
    UI: ['components', 'pages', 'layouts', 'ui', 'views'],
    CORE: ['core', 'sdk', 'lib', 'runtime'],
    DATA: ['data', 'store', 'db', 'models'],
    AI: ['ai', 'agents', 'llm', 'ml'],
    SEO: ['seo', 'discovery', 'schema'],
    UTIL: ['utils', 'helpers', 'util'],
    MCP: ['mcp', 'transport'],
    SECURITY: ['security', 'auth'],
  };

  const expectedPaths = regionPathMap[region];
  if (!expectedPaths) return true;

  return expectedPaths.some(p => path.includes(`/${p}/`));
}

function checkSecurity(content) {
  if (!content) return true;
  const secretPatterns = [
    /(?:password|passwd|secret|api[_-]?key|token|credential)\s*[:=]\s*['"][^'"]{8,}/i,
    /(?:sk-|pk-)[a-zA-Z0-9]{20,}/,
    /[a-zA-Z0-9._%+-]+:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/,
  ];
  return !secretPatterns.some(pattern => pattern.test(content));
}

function getComplianceLevel(score) {
  for (const [level, data] of Object.entries(COMPLIANCE_LEVELS)) {
    if (score >= data.min) return level;
  }
  return 'NONE';
}
