import test from 'node:test';
import assert from 'node:assert/strict';
import { GPU_TARGET_PLATFORMS } from './gpu-platform-contract.mjs';
import { STANDALONE_PRODUCT_EVIDENCE_STAGES, assessStandaloneProductAcceptance,
  assessNativeGpuEnumeration } from './standalone-product-acceptance.mjs';

// Synthetic reference records test correlation only; no physical execution or
// canonical authority is asserted by these fixtures.
const identity = (platform = 'LINUX') => ({
  platform, deviceId: 'fixture-device', sourceRevision: 'fixture-source',
  requestId: 'fixture-request', workloadHash: 'b'.repeat(64), packageDigest: 'c'.repeat(64),
  capabilityProfile: 'leeway.gpu.model.infer',
});
const reference = context => ({ ...context, reference: 'evidence/fixture.json', sha256: 'a'.repeat(64) });
const complete = platform => {
  const context = identity(platform);
  return { ...context, evidence: Object.fromEntries(STANDALONE_PRODUCT_EVIDENCE_STAGES.map(stage => [stage, reference(context)])) };
};

test('checklist booleans cannot certify any platform', () => {
  for (const platform of GPU_TARGET_PLATFORMS) {
    const result = assessStandaloneProductAcceptance({ ...identity(platform),
      evidence: Object.fromEntries(STANDALONE_PRODUCT_EVIDENCE_STAGES.map(stage => [stage, true])),
      verified: true, productionAccepted: true, qualifiedInference: true,
    });
    assert.equal(result.status, 'BLOCKED_MISSING_OR_MISMATCHED_REFERENCES');
    assert.equal(result.pendingEvidenceStages.length, STANDALONE_PRODUCT_EVIDENCE_STAGES.length);
    assert.equal(result.productionAccepted, false);
    assert.equal(result.qualifiedInference, false);
    assert.equal(result.executionAuthorized, false);
  }
});

test('complete references prepare independent review and never authorize execution', () => {
  for (const platform of GPU_TARGET_PLATFORMS) {
    const result = assessStandaloneProductAcceptance(complete(platform));
    assert.equal(result.status, 'EVIDENCE_REFERENCED_PENDING_INDEPENDENT_ACCEPTANCE');
    assert.deepEqual(result.pendingEvidenceStages, []);
    assert.equal(result.independentVerification, 'REQUIRED');
    assert.equal(result.productionAccepted, false);
    assert.equal(result.qualifiedInference, false);
    assert.equal(result.executionAuthorized, false);
    assert.equal(result.nativeGpuEnumeration, 'SEPARATE_ACCEPTANCE_REQUIRED');
  }
});

test('native OS enumeration is not a standalone product evidence gate', () => {
  const input = complete('MACOS');
  input.osNativeGpu = false;
  assert.equal(assessStandaloneProductAcceptance(input).pendingEvidenceStages.length, 0);
  const native = assessNativeGpuEnumeration(identity('MACOS'));
  assert.equal(native.scope, 'NATIVE_OS_GPU_ENUMERATION_ONLY');
  assert.equal(native.pendingEvidenceStages.length, 4);
  assert.equal(native.nativeGpuVerified, false);
});

test('stage request, workload, device, artifact, source, and platform substitutions are rejected', () => {
  for (const [key, value] of Object.entries({ requestId: 'other', workloadHash: 'd'.repeat(64),
    deviceId: 'other', packageDigest: 'e'.repeat(64), sourceRevision: 'other', platform: 'ANDROID', capabilityProfile: 'leeway.gpu.tensor' })) {
    const input = complete('LINUX');
    input.evidence.computeReadback[key] = value;
    assert.deepEqual(assessStandaloneProductAcceptance(input).pendingEvidenceStages, ['computeReadback'], key);
  }
});

test('missing post evidence or malformed digest stays blocked', () => {
  const input = complete('WINDOWS');
  delete input.evidence.veritasPost;
  input.evidence.receiptLedger.sha256 = 'not-a-digest';
  assert.deepEqual(assessStandaloneProductAcceptance(input).pendingEvidenceStages, ['veritasPost', 'receiptLedger']);
  assert.throws(() => assessStandaloneProductAcceptance({ ...input, requestId: '' }), /IDENTITY_REQUIRED/);
});

test('native driver metadata and complete native references cannot self-certify', () => {
  const context = identity('IOS');
  const evidence = Object.fromEntries(['osEnumeration', 'providerIdentity', 'nativeDispatchReadback', 'driverQualification'].map(stage => [stage, reference(context)]));
  const result = assessNativeGpuEnumeration({ ...context, evidence, nativeGpuVerified: true });
  assert.equal(result.status, 'EVIDENCE_REFERENCED_PENDING_INDEPENDENT_ACCEPTANCE');
  assert.equal(result.nativeGpuVerified, false);
  assert.equal(result.productionAccepted, false);
  assert.throws(() => result.pendingEvidenceStages.push('changed'), TypeError);
});
