// Product policy and evidence inventory only. This module does not execute work,
// verify receipts, select a backend, or certify a platform.
export const LEEWAY_GPU_PRODUCT = Object.freeze({
  serviceId: 'leeway.gpu.service',
  productName: 'LeeWay Edge GPU',
  contractVersion: '1.0.0',
});

export const GPU_TARGET_PLATFORMS = Object.freeze([
  'WINDOWS', 'LINUX', 'ANDROID', 'MACOS', 'IOS', 'IPADOS',
]);

const aliases = Object.freeze({
  WINDOWS: 'WINDOWS', WIN32: 'WINDOWS',
  LINUX: 'LINUX',
  ANDROID: 'ANDROID', SAMSUNG: 'ANDROID',
  MACOS: 'MACOS', DARWIN: 'MACOS', MAC: 'MACOS',
  IOS: 'IOS', IPHONE: 'IOS',
  IPADOS: 'IPADOS', IPAD: 'IPADOS',
});
const text = value => typeof value === 'string' && value.trim().length > 0;
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const list = value => Array.isArray(value) && value.every(text);

export function normalizeGpuPlatform(platform) {
  const normalized = typeof platform === 'string' ? aliases[platform.trim().toUpperCase()] : undefined;
  if (!normalized) throw new Error('GPU_PLATFORM_UNKNOWN');
  return normalized;
}

function profile(value) {
  if (!value || !/^leeway\.gpu\.[a-z][a-z0-9.-]*$/.test(value.id ?? '') ||
      !text(value.description) || !list(value.operations) || value.operations.length === 0 ||
      new Set(value.operations).size !== value.operations.length) {
    throw new Error('GPU_CAPABILITY_PROFILE_INVALID');
  }
  return Object.freeze({ id: value.id, description: value.description, operations: Object.freeze([...value.operations]) });
}

export const GPU_CAPABILITY_PROFILES = Object.freeze([
  profile({ id: 'leeway.gpu.tensor', description: 'LeeWay tensor computation', operations: ['tensor.allocate', 'tensor.compute', 'tensor.readback'] }),
  profile({ id: 'leeway.gpu.model.infer', description: 'LeeWay-owned model execution', operations: ['model.load', 'model.infer', 'session.cancel'] }),
  profile({ id: 'leeway.gpu.spatial', description: 'LeeWay spatial mathematics', operations: ['spatial.transform', 'spatial.fold', 'spatial.readback'] }),
]);

const evidenceKinds = Object.freeze(['BUILD', 'DEVICE_EXECUTION', 'GOVERNED_EXECUTION']);

function observation(value, platform) {
  if (!value || !evidenceKinds.includes(value.kind) || !text(value.reference) || !digest(value.sha256) ||
      !text(value.sourceRevision) || normalizeGpuPlatform(value.platform) !== platform ||
      (value.kind !== 'BUILD' && !text(value.deviceId))) {
    throw new Error('GPU_PLATFORM_EVIDENCE_REFERENCE_INVALID');
  }
  if (value.kind === 'GOVERNED_EXECUTION' && (!text(value.requestId) || !digest(value.workloadHash))) {
    throw new Error('GPU_GOVERNED_EVIDENCE_IDENTITY_REQUIRED');
  }
  return Object.freeze({
    kind: value.kind, reference: value.reference, sha256: value.sha256.toLowerCase(),
    sourceRevision: value.sourceRevision, platform,
    ...(value.kind !== 'BUILD' ? { deviceId: value.deviceId } : {}),
    ...(value.kind === 'GOVERNED_EXECUTION' ? { requestId: value.requestId, workloadHash: value.workloadHash.toLowerCase() } : {}),
    verificationState: 'REFERENCE_NOT_VERIFIED',
  });
}

export function createGpuPlatformContract({ capabilityProfiles = [] } = {}) {
  if (!Array.isArray(capabilityProfiles)) throw new Error('GPU_CAPABILITY_PROFILES_INVALID');
  const profiles = [...GPU_CAPABILITY_PROFILES, ...capabilityProfiles.map(profile)];
  if (new Set(profiles.map(item => item.id)).size !== profiles.length) throw new Error('GPU_CAPABILITY_PROFILE_DUPLICATE');
  const frozenProfiles = Object.freeze(profiles);

  function describePlatform({ platform, adapter, observations = [], capabilityProfiles: requested = [] } = {}) {
    const target = normalizeGpuPlatform(platform);
    if (!Array.isArray(observations) || !list(requested)) throw new Error('GPU_PLATFORM_DESCRIPTION_INVALID');
    if (new Set(requested).size !== requested.length || requested.some(id => !profiles.some(item => item.id === id))) {
      throw new Error('GPU_CAPABILITY_PROFILE_UNKNOWN');
    }
    let source = null;
    if (adapter !== undefined) {
      if (!adapter || !text(adapter.id) || !text(adapter.backend) || !text(adapter.source?.reference) || !text(adapter.source?.revision)) {
        throw new Error('GPU_ADAPTER_SOURCE_REFERENCE_INVALID');
      }
      source = Object.freeze({ id: adapter.id, backend: adapter.backend,
        source: Object.freeze({ reference: adapter.source.reference, revision: adapter.source.revision }) });
    }
    const references = Object.freeze(observations.map(item => observation(item, target)));
    return Object.freeze({
      ...LEEWAY_GPU_PRODUCT,
      platform: target,
      targetSupport: 'PRODUCT_TARGET',
      adapterImplementation: source ? 'SOURCE_REFERENCED' : 'NOT_REPORTED',
      adapter: source,
      capabilityProfiles: Object.freeze(requested.map(id => Object.freeze({ id, qualification: 'NOT_ESTABLISHED_BY_CONTRACT' }))),
      platformExecutionEvidence: references.length ? 'REFERENCED_NOT_VERIFIED' : 'NOT_REPORTED',
      observations: references,
      platformQualified: false,
      productionAccepted: false,
      executionAuthorized: false,
      nativeGpuEnumeration: 'SEPARATE_ACCEPTANCE_REQUIRED',
    });
  }

  return Object.freeze({ product: LEEWAY_GPU_PRODUCT, platforms: GPU_TARGET_PLATFORMS,
    capabilityProfiles: frozenProfiles, describePlatform });
}

const defaultContract = createGpuPlatformContract();
export const describeGpuPlatform = options => defaultContract.describePlatform(options);
