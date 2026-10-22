/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.G24.LIVE_PROVIDER_READINESS.TEST
5WH:
WHAT = Test fail-closed source/authority inventory for software GPU provider.
WHY = Generic C3 or HTTP 200 alone must not activate production.
WHO = Creator-authorized LeeWay engineering; not an independent issuer.
WHERE = LeeWay-Edge-GPU/tests/virtual-gpu/canonical-provider-readiness.test.mjs
WHEN = 2026-10-22
HOW = Controlled observations tested without invoking a production workload.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {assessCanonicalSoftwareReadiness,probeCanonicalSoftwarePipeline} from '../../core/canonical-provider-readiness.mjs';
const passing = () => ({
  formula:{httpStatus:200,body:{status:'LEEWAY_FORMULA_V1_PASS',goldenVectorPass:true}},
  kernel:{httpStatus:200,body:{status:'PASS'}},
  receipt:{httpStatus:200,body:{status:'LEEWAY_RECEIPT_LEDGER_PASS',verification:{valid:true}}},
  gpu:{httpStatus:200,body:{
    serviceId:'leeway.gpu.service',
    softwareProviderQualified:true,softwareCapability:'leeway.gpu.software.compute',
    authorization:'SOFTWARE_GPU_ISSUER_QUALIFIED',
    formula:'SOFTWARE_WORKLOAD_POLICY_QUALIFIED',
    ldwmd:'HOST_RAM_LEASE_VERIFIED',
    continuum:'SOFTWARE_DURABLE_READBACK_VERIFIED',
    veritas:'SOFTWARE_PRE_POST_AUTHENTICATED'
  }},
  c3:{status:'VERIFIED_POST_RECEIPT_ADMISSION_READY',
      independentIssuerVerified:true,veritasAdmissionVerified:true,
      learningLedgerReadbackVerified:true,failures:[]},
  softwareChain:{status:'INDEPENDENTLY_CERTIFIED_SOFTWARE_GPU_EXECUTION',
    requestScoped:true,hostCpuOnly:true,hardwareGpuInvocationCount:0,
    veritasSignedAndIndependentlyVerified:true,durableLedgerReadback:true,
    sourceManifestSha256:'a'.repeat(64)}
});
test('empty observations fail every actual provider check',()=>{
  const result=assessCanonicalSoftwareReadiness();
  assert.equal(result.productionAdmissionAuthorized,false);
  assert.equal(result.productionExecutionAttempted,false);
  assert.equal(result.mutationPerformed,false);
  assert.ok(result.advisoryBlockers.length>=11);
});
test('Formula and Receipt health are not equivalent to the whole pipeline',()=>{
  const ok=passing();
  const result=assessCanonicalSoftwareReadiness({
    formula:ok.formula,receipt:ok.receipt,
    gpu:{httpStatus:200,body:{serviceId:'leeway.gpu.service',
      authorization:'CANONICAL_GPU_ISSUER_UNBOUND',dispatchAllowed:false}}
  });
  assert.ok(result.advisoryBlockers.includes('REAL_RUNTIME_ISSUER_NOT_ADMITTED'));
  assert.ok(result.advisoryBlockers.includes('FRESH_SOFTWARE_ONLY_SIGNED_CHAIN_MISSING'));
  assert.equal(result.productionAdmissionAuthorized,false);
});
test('even a complete-looking simulated report cannot issue production authority',()=>{
  const result=assessCanonicalSoftwareReadiness(passing());
  assert.deepEqual(result.advisoryBlockers,[]);
  assert.equal(result.status,'BLOCKED');
  assert.equal(result.independentProductionCertificate,false);
  assert.equal(result.productionAdmissionAuthorized,false);
});
test('real C3 admission cannot be substituted for a signed software-chain proof',()=>{
  const data=passing();delete data.softwareChain;
  const result=assessCanonicalSoftwareReadiness(data);
  assert.deepEqual(result.advisoryBlockers,['FRESH_SOFTWARE_ONLY_SIGNED_CHAIN_MISSING']);
});
test('wrong service identity fails even if every other field is green',()=>{
  const data=passing();data.gpu.body.serviceId='untrusted-gpu-service';
  const result=assessCanonicalSoftwareReadiness(data);
  assert.deepEqual(result.advisoryBlockers,['LEEWAY_GPU_SERVICE_ID_UNBOUND']);
});
test('physical GPU invocation blocks software-only chain claim',()=>{
  const data=passing();data.softwareChain.hardwareGpuInvocationCount=1;
  assert.ok(assessCanonicalSoftwareReadiness(data).advisoryBlockers.includes(
    'FRESH_SOFTWARE_ONLY_SIGNED_CHAIN_MISSING'));
});
test('runtime probe refuses a non-absolute root rather than searching arbitrary folders',async()=>{
  await assert.rejects(probeCanonicalSoftwarePipeline({runtimeRoot:'../not-a-runtime'}),
    /G24_CANONICAL_RUNTIME_ROOT_REQUIRED/);
});
