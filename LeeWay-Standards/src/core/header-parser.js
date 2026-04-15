/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.SDK.PARSER
TAG: CORE.SDK.HEADER.PARSER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file-text

5WH:
WHAT = Parses, validates, and builds LEEWAY identity headers from source files
WHY = Every LEEWAY-compliant file must begin with a structured identity header; this module reads and writes those headers
WHO = Rapid Web Development
WHERE = src/core/header-parser.js
WHEN = 2026
HOW = Pure JS string parsing, no regex over-engineering, line-by-line state machine

AGENTS:
HEADER
ASSESS
AUDIT

LICENSE:
MIT
*/

const HEADER_START = 'LEEWAY HEADER — DO NOT REMOVE';
const HEADER_END_MARKER = '*/';
const REQUIRED_FIELDS = ['REGION', 'TAG', '5WH', 'LICENSE'];
const REQUIRED_5WH = ['WHAT', 'WHY', 'WHO', 'WHERE', 'WHEN', 'HOW'];

/**
 * Parse a LEEWAY header block from file content.
 * Returns a structured object or null if no valid header found.
 *
 * @param {string} content - Raw file content
 * @returns {{ region: string, tag: string, colorOnionHex: object, iconAscii: object, fiveWH: object, agents: string[], license: string } | null}
 */
export function parseHeader(content) {
  if (typeof content !== 'string') return null;

  const startIdx = content.indexOf(HEADER_START);
  if (startIdx === -1) return null;

  const endIdx = content.indexOf(HEADER_END_MARKER, startIdx);
  if (endIdx === -1) return null;

  const block = content.slice(startIdx, endIdx).trim();
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

  const result = {
    region: null,
    tag: null,
    colorOnionHex: {},
    iconAscii: {},
    fiveWH: {},
    agents: [],
    license: null,
  };

  let section = null;

  for (const line of lines) {
    if (line === HEADER_START) continue;

    if (line.startsWith('REGION:')) {
      result.region = line.slice('REGION:'.length).trim();
      section = null;
      continue;
    }
    if (line.startsWith('TAG:')) {
      result.tag = line.slice('TAG:'.length).trim();
      section = null;
      continue;
    }
    if (line === 'COLOR_ONION_HEX:') { section = 'color'; continue; }
    if (line === 'ICON_ASCII:') { section = 'icon'; continue; }
    if (line === '5WH:') { section = '5wh'; continue; }
    if (line === 'AGENTS:') { section = 'agents'; continue; }
    if (line === 'LICENSE:') { section = 'license'; continue; }

    switch (section) {
      case 'color': {
        const [key, val] = line.split('=');
        if (key && val) result.colorOnionHex[key.trim()] = val.trim();
        break;
      }
      case 'icon': {
        const [key, val] = line.split('=');
        if (key && val) result.iconAscii[key.trim()] = val.trim();
        break;
      }
      case '5wh': {
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const key = line.slice(0, eqIdx).trim();
          const val = line.slice(eqIdx + 1).trim();
          result.fiveWH[key] = val;
        }
        break;
      }
      case 'agents': {
        if (line) result.agents.push(line.trim());
        break;
      }
      case 'license': {
        if (line) result.license = line.trim();
        break;
      }
    }
  }

  return result;
}

/**
 * Validate a parsed LEEWAY header object.
 * Returns { valid: boolean, errors: string[] }
 *
 * @param {object} header - Result from parseHeader()
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateHeader(header) {
  const errors = [];

  if (!header) {
    return { valid: false, errors: ['No LEEWAY header found'] };
  }

  if (!header.region) errors.push('Missing REGION');
  if (!header.tag) errors.push('Missing TAG');
  if (!header.license) errors.push('Missing LICENSE');

  for (const field of REQUIRED_5WH) {
    if (!header.fiveWH[field]) {
      errors.push(`Missing 5WH field: ${field}`);
    }
  }

  if (header.tag) {
    const tagParts = header.tag.split('.');
    if (tagParts.length < 3) {
      errors.push('TAG must follow DOMAIN.SUBDOMAIN.ASSET.PURPOSE format (minimum 3 parts)');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build a LEEWAY header comment block from a header config object.
 *
 * @param {object} config - Header fields
 * @param {string} config.region
 * @param {string} config.tag
 * @param {object} [config.colorOnionHex]
 * @param {object} [config.iconAscii]
 * @param {object} config.fiveWH
 * @param {string[]} [config.agents]
 * @param {string} [config.license]
 * @returns {string} - Complete header comment block
 */
export function buildHeader(config) {
  const {
    region,
    tag,
    colorOnionHex = { NEON: '#39FF14', FLUO: '#0DFF94', PASTEL: '#C7FFD8' },
    iconAscii = { family: 'lucide', glyph: 'file' },
    fiveWH = {},
    agents = [],
    license = 'MIT',
  } = config;

  const colorLines = Object.entries(colorOnionHex).map(([k, v]) => `${k}=${v}`).join('\n');
  const iconLines = Object.entries(iconAscii).map(([k, v]) => `${k}=${v}`).join('\n');
  const wh5Lines = REQUIRED_5WH.map(k => `${k} = ${fiveWH[k] || '(not set)'}`).join('\n');
  const agentLines = agents.join('\n');

  return `/*
LEEWAY HEADER — DO NOT REMOVE

REGION: ${region}
TAG: ${tag}

COLOR_ONION_HEX:
${colorLines}

ICON_ASCII:
${iconLines}

5WH:
${wh5Lines}

AGENTS:
${agentLines}

LICENSE:
${license}
*/
`;
}
