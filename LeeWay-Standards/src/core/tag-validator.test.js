/*
LEEWAY HEADER — DO NOT REMOVE

REGION: TEST.CORE.TAG
TAG: TEST.UNIT.TAG.VALIDATOR

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=test-tube

5WH:
WHAT = Unit tests for the LEEWAY tag-validator core module
WHY = TAG validation is critical — invalid tags break discoverability and governance
WHO = Rapid Web Development
WHERE = src/core/tag-validator.test.js
WHEN = 2026
HOW = Node.js built-in test runner (node:test) with assert

AGENTS:
AUDIT

LICENSE:
MIT
*/

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateTag, inferTag } from './tag-validator.js';

describe('validateTag', () => {
  test('validates a correct tag', () => {
    const { valid, errors } = validateTag('UI.COMPONENT.NEXUS.BUTTON');
    assert.equal(valid, true);
    assert.equal(errors.length, 0);
  });

  test('rejects a tag with too few parts', () => {
    const { valid, errors } = validateTag('UI.COMPONENT');
    assert.equal(valid, false);
    assert.ok(errors.some(e => e.includes('3 parts')));
  });

  test('rejects an empty tag', () => {
    const { valid } = validateTag('');
    assert.equal(valid, false);
  });

  test('rejects null tag', () => {
    const { valid } = validateTag(null);
    assert.equal(valid, false);
  });

  test('rejects lowercase tag', () => {
    const { valid } = validateTag('ui.component.button');
    assert.equal(valid, false);
  });

  test('validates multi-part tags', () => {
    const tags = [
      'AI.ORCHESTRATION.MODEL.LOADER',
      'DATA.LOCAL.STORE.MAIN',
      'SEO.SCHEMA.GENERATOR.JSONLD',
      'UTIL.FORMAT.DATE.HELPER',
      'CORE.SDK.HEADER.PARSER',
    ];
    for (const tag of tags) {
      const { valid, errors } = validateTag(tag);
      assert.equal(valid, true, `Tag "${tag}" should be valid. Errors: ${errors.join(', ')}`);
    }
  });
});

describe('inferTag', () => {
  test('infers UI tag for component path', () => {
    const tag = inferTag('src/components/NexusButton.tsx');
    assert.ok(tag.startsWith('UI.COMPONENT.'));
  });

  test('infers AI tag for agent path', () => {
    const tag = inferTag('src/agents/assess-agent.js');
    assert.ok(tag.startsWith('AI.AGENT.'));
  });

  test('infers DATA tag for store path', () => {
    const tag = inferTag('src/store/userStore.js');
    assert.ok(tag.startsWith('DATA.STORE.'));
  });

  test('infers UTIL tag for utils path', () => {
    const tag = inferTag('src/utils/formatDate.js');
    assert.ok(tag.startsWith('UTIL.HELPER.'));
  });

  test('infers SECURITY tag for auth path', () => {
    const tag = inferTag('src/auth/validator.js');
    assert.ok(tag.startsWith('SECURITY.VALIDATOR.'));
  });

  test('returns fallback for unknown paths', () => {
    const tag = inferTag('src/unknown/something.js');
    assert.ok(typeof tag === 'string');
    assert.ok(tag.length > 0);
  });
});
