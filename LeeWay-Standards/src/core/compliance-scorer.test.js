/*
LEEWAY HEADER — DO NOT REMOVE

REGION: TEST.CORE.COMPLIANCE
TAG: TEST.UNIT.COMPLIANCE.SCORER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=test-tube

5WH:
WHAT = Unit tests for the LEEWAY compliance-scorer core module
WHY = Compliance scoring drives audit reports and governance gates
WHO = Rapid Web Development
WHERE = src/core/compliance-scorer.test.js
WHEN = 2026
HOW = Node.js built-in test runner (node:test) with assert

AGENTS:
AUDIT

LICENSE:
MIT
*/

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { scoreCompliance, COMPLIANCE_LEVELS } from './compliance-scorer.js';

const COMPLIANT_CONTENT = `/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.SDK.TEST
TAG: CORE.SDK.TEST.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = Test module
WHY = For compliance scoring tests
WHO = Test Author
WHERE = src/core/test.js
WHEN = 2026
HOW = Node.js

AGENTS:
ASSESS

LICENSE:
MIT
*/

export function test() {}
`;

const NON_COMPLIANT_CONTENT = `export function test() {}`;

describe('COMPLIANCE_LEVELS', () => {
  test('exports all compliance levels', () => {
    const required = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'NONE'];
    for (const level of required) {
      assert.ok(COMPLIANCE_LEVELS[level], `Should have level: ${level}`);
    }
  });

  test('levels have min and label', () => {
    for (const [key, level] of Object.entries(COMPLIANCE_LEVELS)) {
      assert.ok(typeof level.min === 'number', `${key} should have numeric min`);
      assert.ok(typeof level.label === 'string', `${key} should have label`);
    }
  });
});

describe('scoreCompliance', () => {
  test('scores a compliant file highly', () => {
    const result = scoreCompliance({ filePath: 'src/core/test.js', content: COMPLIANT_CONTENT });
    assert.ok(result.score >= 70, `Expected score >= 70, got ${result.score}`);
    assert.ok(['PLATINUM', 'GOLD', 'SILVER'].includes(result.level));
  });

  test('scores a non-compliant file low', () => {
    const result = scoreCompliance({ filePath: 'src/test.js', content: NON_COMPLIANT_CONTENT });
    assert.ok(result.score < 60, `Expected score < 60, got ${result.score}`);
  });

  test('reports missing header as an issue', () => {
    const result = scoreCompliance({ filePath: 'src/test.js', content: NON_COMPLIANT_CONTENT });
    assert.ok(result.issues.some(i => i.toLowerCase().includes('header')));
  });

  test('returns breakdown object', () => {
    const result = scoreCompliance({ filePath: 'src/core/test.js', content: COMPLIANT_CONTENT });
    assert.ok(typeof result.breakdown === 'object');
    assert.ok('hasHeader' in result.breakdown);
  });

  test('score is between 0 and 100', () => {
    const r1 = scoreCompliance({ filePath: 'src/test.js', content: NON_COMPLIANT_CONTENT });
    const r2 = scoreCompliance({ filePath: 'src/core/test.js', content: COMPLIANT_CONTENT });
    assert.ok(r1.score >= 0 && r1.score <= 100);
    assert.ok(r2.score >= 0 && r2.score <= 100);
  });

  test('detects potential secrets', () => {
    const content = COMPLIANT_CONTENT + '\nconst apiKey = "sk-abcdefghijklmnopqrstuvwxyz12345678";';
    const result = scoreCompliance({ filePath: 'src/core/test.js', content });
    assert.ok(result.issues.some(i => i.toLowerCase().includes('security')));
  });
});
