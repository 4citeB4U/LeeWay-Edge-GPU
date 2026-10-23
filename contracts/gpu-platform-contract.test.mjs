import test from 'node:test';
import assert from 'node:assert/strict';
import { LEEWAY_GPU_PRODUCT, GPU_TARGET_PLATFORMS, createGpuPlatformContract,
  describeGpuPlatform, normalizeGpuPlatform } from './gpu-platform-contract.mjs';

const observation = (platform, kind = 'DEVICE_EXECUTION') => ({
  platform, kind, reference: 'evidence/fixture.json', sha256: 'a'.repeat(64),
  sourceRevision: 'fixture-revision', deviceId: 'fixture-device',
});

test('all six platforms share one standalone product without implying implementation', () => {
  assert.equal(LEEWAY_GPU_PRODUCT.serviceId, 'leeway.gpu.service');
  assert.equal(LEEWAY_GPU_PRODUCT.productName, 'LeeWay Edge GPU');
  assert.deepEqual(GPU_TARGET_PLATFORMS, ['WINDOWS', 'LINUX', 'ANDROID', 'MACOS', 'IOS', 'IPADOS']);
  for (const platform of GPU_TARGET_PLATFORMS) {
    const result = describeGpuPlatform({ platform, productionAccepted: true, executionAuthorized: true });
    assert.equal(result.serviceId, LEEWAY_GPU_PRODUCT.serviceId);
    assert.equal(result.targetSupport, 'PRODUCT_TARGET');
    assert.equal(result.adapterImplementation, 'NOT_REPORTED');
    assert.equal(result.platformExecutionEvidence, 'NOT_REPORTED');
    assert.equal(result.platformQualified, false);
    assert.equal(result.productionAccepted, false);
    assert.equal(result.executionAuthorized, false);
  }
});

test('host aliases normalize without collapsing iPhone and iPad targets', () => {
  assert.equal(normalizeGpuPlatform('win32'), 'WINDOWS');
  assert.equal(normalizeGpuPlatform('Samsung'), 'ANDROID');
  assert.equal(normalizeGpuPlatform('darwin'), 'MACOS');
  assert.equal(normalizeGpuPlatform('iPhone'), 'IOS');
  assert.equal(normalizeGpuPlatform('iPad'), 'IPADOS');
  assert.throws(() => normalizeGpuPlatform(''), /GPU_PLATFORM_UNKNOWN/);
  assert.throws(() => normalizeGpuPlatform('future-os'), /GPU_PLATFORM_UNKNOWN/);
});

test('source, build, and device execution references retain separate scopes', () => {
  const result = describeGpuPlatform({ platform: 'IOS',
    adapter: { id: 'fixture.metal', backend: 'Metal', source: { reference: 'native/fixture.swift', revision: 'fixture-revision' } },
    observations: [observation('IOS', 'BUILD'), observation('IOS')],
    capabilityProfiles: ['leeway.gpu.model.infer'],
  });
  assert.equal(result.adapterImplementation, 'SOURCE_REFERENCED');
  assert.deepEqual(result.observations.map(item => item.kind), ['BUILD', 'DEVICE_EXECUTION']);
  assert.ok(result.observations.every(item => item.verificationState === 'REFERENCE_NOT_VERIFIED'));
  assert.equal(result.capabilityProfiles[0].qualification, 'NOT_ESTABLISHED_BY_CONTRACT');
  assert.equal(result.platformQualified, false);
});

test('a macOS build host does not turn an iPhone artifact into macOS device evidence', () => {
  assert.throws(() => describeGpuPlatform({ platform: 'MACOS', observations: [observation('IOS')] }), /EVIDENCE_REFERENCE_INVALID/);
  assert.throws(() => describeGpuPlatform({ platform: 'IPADOS', observations: [observation('IOS')] }), /EVIDENCE_REFERENCE_INVALID/);
});

test('governed evidence requires request identity and remains unverified', () => {
  assert.throws(() => describeGpuPlatform({ platform: 'LINUX', observations: [observation('LINUX', 'GOVERNED_EXECUTION')] }), /IDENTITY_REQUIRED/);
  const result = describeGpuPlatform({ platform: 'LINUX', observations: [{
    ...observation('LINUX', 'GOVERNED_EXECUTION'), requestId: 'fixture-request', workloadHash: 'b'.repeat(64), verified: true,
  }] });
  assert.equal(result.observations[0].verificationState, 'REFERENCE_NOT_VERIFIED');
  assert.equal(result.productionAccepted, false);
  assert.equal(result.executionAuthorized, false);
});

test('capability profiles are extensible without replacing existing definitions', () => {
  const contract = createGpuPlatformContract({ capabilityProfiles: [{
    id: 'leeway.gpu.audio', description: 'Fixture profile', operations: ['audio.transform'],
  }] });
  assert.equal(contract.describePlatform({ platform: 'ANDROID', capabilityProfiles: ['leeway.gpu.audio'] }).capabilityProfiles[0].id, 'leeway.gpu.audio');
  assert.throws(() => createGpuPlatformContract({ capabilityProfiles: [{
    id: 'leeway.gpu.tensor', description: 'replacement', operations: ['other'],
  }] }), /DUPLICATE/);
  assert.throws(() => describeGpuPlatform({ platform: 'IOS', capabilityProfiles: ['leeway.gpu.audio'] }), /PROFILE_UNKNOWN/);
});

test('contract output is immutable and does not retain mutable source objects', () => {
  const input = observation('WINDOWS');
  const result = describeGpuPlatform({ platform: 'WINDOWS', observations: [input] });
  input.reference = 'changed';
  assert.equal(result.observations[0].reference, 'evidence/fixture.json');
  assert.throws(() => result.observations.push(input), TypeError);
  assert.throws(() => { result.observations[0].verificationState = 'VERIFIED'; }, TypeError);
});
