import { LEEWAY_GPU_PRODUCT, normalizeGpuPlatform } from './gpu-platform-contract.mjs';

// A reference preflight, never an acceptance issuer. Actual acceptance requires
// independent verification by the existing LeeWay authorities outside this module.
export const STANDALONE_PRODUCT_EVIDENCE_STAGES = Object.freeze([
  'installation', 'publicApi', 'lifecycleRecovery', 'applicationClient',
  'runtimeFabric', 'formula', 'veritasPre', 'ldwmd', 'computeReadback',
  'continuumReadback', 'veritasPost', 'receiptLedger', 'learningLedger',
]);
const requestStages = new Set(STANDALONE_PRODUCT_EVIDENCE_STAGES.slice(4));
const text = value => typeof value === 'string' && value.trim().length > 0;
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const shaEqual = (left, right) => digest(left) && digest(right) && left.toLowerCase() === right.toLowerCase();

function samePlatform(value, platform) {
  try { return normalizeGpuPlatform(value) === platform; } catch { return false; }
}

function referenceMatches(value, context, requestBound) {
  return value && text(value.reference) && digest(value.sha256) && text(value.sourceRevision) &&
    value.sourceRevision === context.sourceRevision && samePlatform(value.platform, context.platform) &&
    value.deviceId === context.deviceId && shaEqual(value.packageDigest, context.packageDigest) &&
    (!requestBound || (value.requestId === context.requestId && shaEqual(value.workloadHash, context.workloadHash) &&
      value.capabilityProfile === context.capabilityProfile));
}

export function assessStandaloneProductAcceptance(input = {}) {
  const platform = normalizeGpuPlatform(input.platform);
  if (!text(input.deviceId) || !text(input.sourceRevision) || !digest(input.packageDigest) ||
      !text(input.requestId) || !digest(input.workloadHash) || !/^leeway\.gpu\.[a-z][a-z0-9.-]*$/.test(input.capabilityProfile ?? '')) {
    throw new Error('STANDALONE_PRODUCT_IDENTITY_REQUIRED');
  }
  const context = { ...input, platform };
  const pending = STANDALONE_PRODUCT_EVIDENCE_STAGES.filter(stage =>
    !referenceMatches(input.evidence?.[stage], context, requestStages.has(stage)));
  return Object.freeze({
    ...LEEWAY_GPU_PRODUCT, platform, deviceId: input.deviceId,
    capabilityProfile: input.capabilityProfile,
    status: pending.length ? 'BLOCKED_MISSING_OR_MISMATCHED_REFERENCES' : 'EVIDENCE_REFERENCED_PENDING_INDEPENDENT_ACCEPTANCE',
    pendingEvidenceStages: Object.freeze(pending),
    independentVerification: 'REQUIRED',
    productionAccepted: false,
    qualifiedInference: false,
    executionAuthorized: false,
    nativeGpuEnumeration: 'SEPARATE_ACCEPTANCE_REQUIRED',
  });
}

// OS enumeration is a separate driver/API qualification. A standalone product
// does not acquire or lose its identity because a particular OS enumerates it.
export function assessNativeGpuEnumeration(input = {}) {
  const platform = normalizeGpuPlatform(input.platform);
  if (!text(input.deviceId) || !text(input.sourceRevision) || !digest(input.packageDigest)) {
    throw new Error('NATIVE_GPU_ENUMERATION_IDENTITY_REQUIRED');
  }
  const required = ['osEnumeration', 'providerIdentity', 'nativeDispatchReadback', 'driverQualification'];
  const pending = required.filter(stage => !referenceMatches(input.evidence?.[stage], { ...input, platform }, false));
  return Object.freeze({
    ...LEEWAY_GPU_PRODUCT, platform, deviceId: input.deviceId,
    scope: 'NATIVE_OS_GPU_ENUMERATION_ONLY',
    status: pending.length ? 'BLOCKED_MISSING_OR_MISMATCHED_REFERENCES' : 'EVIDENCE_REFERENCED_PENDING_INDEPENDENT_ACCEPTANCE',
    pendingEvidenceStages: Object.freeze(pending),
    nativeGpuVerified: false,
    productionAccepted: false,
    executionAuthorized: false,
  });
}
