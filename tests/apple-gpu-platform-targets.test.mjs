// Build configuration regressions; these tests do not compile or execute Metal.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const project = read('native/apple/LeeWayGPUApple/project.yml');
const workflow = read('.github/workflows/apple-edge-gpu-qualification.yml');
test('iOS application target includes iPhone and iPad', () => {
  assert.match(project, /TARGETED_DEVICE_FAMILY: "1,2"/);
});
test('macOS application builds the same shared source directory', () => {
  assert.match(project, /LeeWayGPUMac:[\s\S]*?platform: macOS[\s\S]*?sources:\s*- path: Sources/);
  assert.equal((project.match(/PRODUCT_BUNDLE_IDENTIFIER: industries\.leeway\.gpu/g) || []).length, 2);
});
test('native CI separately builds macOS and iPhone/iPad and preserves unsigned scope', () => {
  assert.match(workflow, /scheme: LeeWayGPUMac/);
  assert.match(workflow, /scheme: LeeWayGPUApple/);
  assert.match(workflow, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(workflow, /pull_request:/);
});
