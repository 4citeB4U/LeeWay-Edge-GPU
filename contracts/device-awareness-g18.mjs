// G18 J-5 admission: never treat self-asserted flags as verified hardware evidence.
const valid = v => typeof v === 'string' && v.trim().length > 0;
const modes = new Set(['LEEWAY_ONLY','LEEWAY_ASSIST','UNAVAILABLE']);
const isEvidence = e => e && valid(e.receiptId) && valid(e.source) && valid(e.sha256) && /^[a-f0-9]{64}$/i.test(e.sha256) && valid(e.observationId);
export function admitDeviceAwareness(o, verifyEvidence) {
  if (!o || !valid(o.deviceId) || !valid(o.platform) || !valid(o.observedAt) || !valid(o.source)) throw Error('DEVICE_OBSERVATION_INCOMPLETE');
  if (!Array.isArray(o.physicalGpus) || !o.physicalGpus.every(g => valid(g.name) && valid(g.manufacturer) && valid(g.source))) throw Error('PHYSICAL_GPU_PROVENANCE_REQUIRED');
  if (!o.leeway || o.leeway.name !== 'LeeWay Edge GPU' || o.leeway.manufacturer !== 'LeeWay Industries' || !modes.has(o.leeway.mode)) throw Error('LEEWAY_PROVIDER_IDENTITY_INVALID');
  if (o.diagnostics?.deviceId !== o.deviceId || o.digitalBrain?.deviceId !== o.deviceId || o.diagnostics?.observationId !== o.digitalBrain?.observationId || !valid(o.diagnostics?.observationId)) throw Error('BRAIN_DIAGNOSTICS_DIVERGED');
  const qualified = (kind) => { const e=o.leeway.evidence?.[kind]; return isEvidence(e) && e.observationId === o.diagnostics.observationId && typeof verifyEvidence === 'function' && verifyEvidence(kind,e,o) === true; };
  if (o.leeway.osNativeGpu === true && (!qualified('nativeEnumeration') || !qualified('commandReadback'))) throw Error('NATIVE_GPU_EVIDENCE_REQUIRED');
  if (o.leeway.mode !== 'UNAVAILABLE' && !qualified('execution')) throw Error('EXECUTION_EVIDENCE_REQUIRED');
  return Object.freeze({deviceId:o.deviceId,observationId:o.diagnostics.observationId,physicalGpuCount:o.physicalGpus.length,leewayMode:o.leeway.mode,osNativeGpu:o.leeway.osNativeGpu===true,diagnosticsBrainSynchronized:true,evidenceQualification:o.leeway.mode==='UNAVAILABLE'?'NOT_EXECUTED':'EXTERNALLY_VERIFIED_BY_CALLER'});
}
