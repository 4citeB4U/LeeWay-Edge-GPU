/*
LEEWAY HEADER — DO NOT REMOVE

REGION: TEST.CORE.HEADER
TAG: TEST.UNIT.HEADER.PARSER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=test-tube

5WH:
WHAT = Unit tests for the LEEWAY header-parser core module
WHY = The header parser is foundational — every other module depends on it working correctly
WHO = Rapid Web Development
WHERE = src/core/header-parser.test.js
WHEN = 2026
HOW = Node.js built-in test runner (node:test) with assert

AGENTS:
AUDIT
ASSESS

LICENSE:
MIT
*/

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseHeader, validateHeader, buildHeader } from './header-parser.js';

const SAMPLE_HEADER_CONTENT = `/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.NEXUS
TAG: UI.COMPONENT.NEXUS.BUTTON

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=layout-dashboard

5WH:
WHAT = Nexus button component
WHY = Primary voice control interface
WHO = Rapid Web Development
WHERE = src/components/NexusButton.tsx
WHEN = 2026
HOW = React + Tailwind

AGENTS:
AZR
PHI3

LICENSE:
MIT
*/

export function NexusButton() {}
`;

const NO_HEADER_CONTENT = `export function NexusButton() {}`;

describe('parseHeader', () => {
  test('parses a valid LEEWAY header', () => {
    const result = parseHeader(SAMPLE_HEADER_CONTENT);
    assert.ok(result, 'Should return an object');
    assert.equal(result.region, 'UI.COMPONENT.NEXUS');
    assert.equal(result.tag, 'UI.COMPONENT.NEXUS.BUTTON');
    assert.equal(result.license, 'MIT');
    assert.deepEqual(result.agents, ['AZR', 'PHI3']);
  });

  test('returns null when no header is present', () => {
    const result = parseHeader(NO_HEADER_CONTENT);
    assert.equal(result, null);
  });

  test('returns null for non-string input', () => {
    assert.equal(parseHeader(null), null);
    assert.equal(parseHeader(undefined), null);
    assert.equal(parseHeader(42), null);
  });

  test('parses 5WH fields correctly', () => {
    const result = parseHeader(SAMPLE_HEADER_CONTENT);
    assert.ok(result.fiveWH);
    assert.equal(result.fiveWH.WHAT, 'Nexus button component');
    assert.equal(result.fiveWH.WHY, 'Primary voice control interface');
    assert.equal(result.fiveWH.WHO, 'Rapid Web Development');
    assert.equal(result.fiveWH.WHEN, '2026');
  });

  test('parses color hex values', () => {
    const result = parseHeader(SAMPLE_HEADER_CONTENT);
    assert.equal(result.colorOnionHex.NEON, '#39FF14');
    assert.equal(result.colorOnionHex.FLUO, '#0DFF94');
  });

  test('parses icon ascii fields', () => {
    const result = parseHeader(SAMPLE_HEADER_CONTENT);
    assert.equal(result.iconAscii.family, 'lucide');
    assert.equal(result.iconAscii.glyph, 'layout-dashboard');
  });
});

describe('validateHeader', () => {
  test('validates a complete header as valid', () => {
    const header = parseHeader(SAMPLE_HEADER_CONTENT);
    const { valid, errors } = validateHeader(header);
    assert.equal(valid, true);
    assert.equal(errors.length, 0);
  });

  test('returns error for null header', () => {
    const { valid, errors } = validateHeader(null);
    assert.equal(valid, false);
    assert.ok(errors.length > 0);
  });

  test('reports missing REGION', () => {
    const { valid, errors } = validateHeader({ tag: 'UI.COMPONENT.X.Y', license: 'MIT', fiveWH: { WHAT: 'x', WHY: 'y', WHO: 'z', WHERE: 'a', WHEN: '2026', HOW: 'b' } });
    assert.equal(valid, false);
    assert.ok(errors.some(e => e.includes('REGION')));
  });

  test('reports missing 5WH fields', () => {
    const { valid, errors } = validateHeader({ region: 'UI', tag: 'UI.X.Y', license: 'MIT', fiveWH: {} });
    assert.equal(valid, false);
    assert.ok(errors.some(e => e.includes('WHAT')));
  });

  test('reports invalid TAG format', () => {
    const { valid, errors } = validateHeader({
      region: 'UI',
      tag: 'BADTAG',
      license: 'MIT',
      fiveWH: { WHAT: 'x', WHY: 'y', WHO: 'z', WHERE: 'a', WHEN: '2026', HOW: 'b' },
    });
    assert.equal(valid, false);
    assert.ok(errors.some(e => e.toLowerCase().includes('tag')));
  });
});

describe('buildHeader', () => {
  test('builds a valid header string', () => {
    const header = buildHeader({
      region: 'UI.COMPONENT.TEST',
      tag: 'UI.COMPONENT.TEST.MAIN',
      fiveWH: {
        WHAT: 'Test component',
        WHY: 'For testing',
        WHO: 'Test Author',
        WHERE: 'src/test.js',
        WHEN: '2026',
        HOW: 'Node.js',
      },
      agents: ['ASSESS'],
      license: 'MIT',
    });

    assert.ok(typeof header === 'string');
    assert.ok(header.includes('LEEWAY HEADER — DO NOT REMOVE'));
    assert.ok(header.includes('REGION: UI.COMPONENT.TEST'));
    assert.ok(header.includes('TAG: UI.COMPONENT.TEST.MAIN'));
    assert.ok(header.includes('MIT'));
    assert.ok(header.includes('ASSESS'));
  });

  test('built header is parseable', () => {
    const header = buildHeader({
      region: 'CORE.SDK.TEST',
      tag: 'CORE.SDK.TEST.UNIT',
      fiveWH: {
        WHAT: 'Test',
        WHY: 'Testing',
        WHO: 'Dev',
        WHERE: 'test.js',
        WHEN: '2026',
        HOW: 'Node',
      },
    });

    const content = header + '\nexport default {};';
    const parsed = parseHeader(content);
    assert.ok(parsed);
    assert.equal(parsed.region, 'CORE.SDK.TEST');
    assert.equal(parsed.tag, 'CORE.SDK.TEST.UNIT');
  });
});
