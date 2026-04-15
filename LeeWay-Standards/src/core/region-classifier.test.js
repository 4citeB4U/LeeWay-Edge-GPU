/*
LEEWAY HEADER — DO NOT REMOVE

REGION: TEST.CORE.REGION
TAG: TEST.UNIT.REGION.CLASSIFIER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=test-tube

5WH:
WHAT = Unit tests for the LEEWAY region-classifier core module
WHY = Region classification determines where files belong; errors affect entire governance pipeline
WHO = Rapid Web Development
WHERE = src/core/region-classifier.test.js
WHEN = 2026
HOW = Node.js built-in test runner (node:test) with assert

AGENTS:
AUDIT

LICENSE:
MIT
*/

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classifyRegion, REGIONS } from './region-classifier.js';

describe('REGIONS', () => {
  test('exports all required regions', () => {
    const required = ['UI', 'CORE', 'DATA', 'AI', 'SEO', 'UTIL', 'MCP', 'SECURITY', 'TEST', 'DOCS'];
    for (const r of required) {
      assert.ok(REGIONS[r], `Should have region: ${r}`);
    }
  });

  test('each region has required metadata', () => {
    for (const [key, region] of Object.entries(REGIONS)) {
      assert.ok(region.label, `${key} should have label`);
      assert.ok(region.description, `${key} should have description`);
      assert.ok(region.color, `${key} should have color`);
      assert.ok(Array.isArray(region.paths), `${key} should have paths array`);
    }
  });
});

describe('classifyRegion', () => {
  test('classifies UI component paths', () => {
    const { region } = classifyRegion('src/components/NexusButton.tsx');
    assert.equal(region, 'UI');
  });

  test('classifies AI agent paths', () => {
    const { region } = classifyRegion('src/agents/assess-agent.js');
    assert.equal(region, 'AI');
  });

  test('classifies DATA paths', () => {
    const { region } = classifyRegion('src/data/userStore.js');
    assert.equal(region, 'DATA');
  });

  test('classifies SECURITY paths', () => {
    const { region } = classifyRegion('src/security/validator.js');
    assert.equal(region, 'SECURITY');
  });

  test('classifies UTIL paths', () => {
    const { region } = classifyRegion('src/utils/formatDate.js');
    assert.equal(region, 'UTIL');
  });

  test('classifies DOCS paths', () => {
    const { region } = classifyRegion('docs/standards.md');
    assert.equal(region, 'DOCS');
  });

  test('returns CORE as fallback for unknown paths', () => {
    const { region } = classifyRegion('unknown/something.js');
    assert.equal(region, 'CORE');
  });

  test('handles null/empty paths gracefully', () => {
    const { region } = classifyRegion(null);
    assert.equal(region, 'CORE');
    const { region: r2 } = classifyRegion('');
    assert.equal(r2, 'CORE');
  });

  test('returns confidence level', () => {
    const { confidence } = classifyRegion('src/components/Button.tsx');
    assert.ok(['high', 'medium', 'low'].includes(confidence));
  });
});
