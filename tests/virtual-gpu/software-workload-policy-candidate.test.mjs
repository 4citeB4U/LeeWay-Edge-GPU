/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FORMULA_DOMAIN_POLICY.TEST
TAG: LEEWAY.G32.WORKLOAD_ENVELOPE_FAULT_CASES
5WH:
WHAT = Test measured software workload resource bound without pretending Formula grants admission.
WHY = Prevent golden-state mathematical proof from becoming unchecked CPU scheduling.
WHO = Creator-authorized engineering; tested policy is nonproduction.
WHERE = tests/virtual-gpu/software-workload-policy-candidate.test.mjs
WHEN = 2026-10-22
HOW = Real G22 observation samples plus controlled Formula response test fixtures.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {measureLeeWaySoftwareWindow}
 from '../../core/canonical-formula-software-observation.mjs';
import {assessG32SoftwareWorkloadEnvelope}
 from '../../core/software-workload-policy-candidate.mjs';
async function fixture(){
  const measurements=await measureLeeWaySoftwareWindow({size:2,samples:16});
  const requestId='g32-formula-software-resource-check';
  const formulaResult={
    status:'CANONICAL_FORMULA_EXECUTION_REPLAY_VERIFIED_POLICY_UNQUALIFIED',
    requestId,originalEngineHash:'6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e',
    originalAdapterHash:'3264d0a97a76246b31c5ca759b5993188cbae10422eb153ac395e3fb5e2470e0',
    inputHash:'a'.repeat(64),resultHash:'b'.repeat(64),
    sourceReferenceVerified:true,serviceResultMatchesPinnedReference:true,
    externalGpuProviderUsed:false
  };
  return {requestId,size:256,measurements,formulaResult,
    hostAvailableBytes:16*1024*1024,hostReservedBytes:1024*1024};
}
test('G32 16x6 real worker samples imply 6 matrices memory floor for G30 256',async()=>{
  const f=await fixture(),r=assessG32SoftwareWorkloadEnvelope(f);
  assert.equal(r.status,'G32_WORKLOAD_MEASURED_ENVELOPE_FIT_CANDIDATE');
  assert.equal(r.minimumAccountedBytes,1572864);
  assert.equal(r.ldwmdLeaseBytes,786432);
  assert.equal(r.originalG22CopyBytes,786432);
  assert.ok(r.observedMedianLatencyMs>0);
  assert.equal(r.budgetFit,true);
  assert.equal(r.ownerPolicyApproved,false);
  assert.equal(r.productionAdmissionAuthorized,false);
});
test('G32 reject insufficient real host RAM including original worker copies',async()=>{
  const f=await fixture();f.hostAvailableBytes=1000000;f.hostReservedBytes=0;
  const r=assessG32SoftwareWorkloadEnvelope(f);
  assert.equal(r.status,'G32_INSUFFICIENT_HOST_RAM');
  assert.equal(r.budgetFit,false);
  assert.equal(r.productionAdmissionAuthorized,false);
});
test('G32 cannot use incorrect Formula request receipt',async()=>{
  const f=await fixture();f.formulaResult.requestId='different';
  const r=assessG32SoftwareWorkloadEnvelope(f);
  assert.equal(r.reason,'G32_CANONICAL_FORMULA_TRACE_NOT_VERIFIED');
});
test('G32 mathematical correctness dimension must be observed, never invented',async()=>{
  const f=await fixture();f.measurements.stateRows[3][0]=0.5;
  const r=assessG32SoftwareWorkloadEnvelope(f);
  assert.equal(r.reason,'G32_MEASURED_G26_STATES_NOT_VERIFIED');
});
test('G32 requires actual canonical pinned Formula source, not fake golden',async()=>{
  const f=await fixture();f.formulaResult.originalEngineHash='c'.repeat(64);
  assert.equal(assessG32SoftwareWorkloadEnvelope(f).status,'BLOCKED');
});
test('G32 cannot claim a physical GPU-backed sample is LeeWay only',async()=>{
  const f=await fixture();f.measurements={...f.measurements,noPhysicalGpuProvider:false};
  assert.equal(assessG32SoftwareWorkloadEnvelope(f).reason,
    'G32_MEASURED_G26_STATES_NOT_VERIFIED');
});
test('G32 no host memory observation means no allocation',async()=>{
  const f=await fixture();delete f.hostAvailableBytes;
  assert.equal(assessG32SoftwareWorkloadEnvelope(f).reason,
    'G32_HOST_CAPACITY_UNVERIFIED');
});
