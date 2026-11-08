// INTENTIONALLY RED K1/K2 acceptance contract for GPU original-workload binding.
// Review-only, synthetic providers and no real issuer/physical GPU/production admission.
// Hash canonicalization and field spelling must be ratified by the Formula/K1/C3 owners.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {join,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
const ownerSourceDir=process.env.LEEWAY_GPU_RUNTIME_ADAPTER_DIR;
if(!ownerSourceDir||!isAbsolute(ownerSourceDir))throw Error('PINNED_OWNER_ADAPTER_DIRECTORY_REQUIRED');
const own=filename=>import(pathToFileURL(join(ownerSourceDir,filename)).href);
const [{evaluateAppleGpuFormula},{acquireAppleGpuMemoryLease},{executeAppleGpuRequest}]=await Promise.all([
 own('apple-gpu-formula-adapter.mjs'),own('apple-gpu-ldwmd-adapter.mjs'),
 own('apple-gpu-request-chain.mjs')]);
const requestId='canonical-workload-review-001',applicationId='leeway-gpu-apple';
const deviceId='target-gpu-iphone-A',otherDevice='not-approved-device-B';
const workloadA=Buffer.from('original-owner-workload-A');
const workloadB=Buffer.from('original-owner-workload-B');
const sha=x=>createHash('sha256').update(x).digest('hex');
const originalDigest=sha(workloadA),otherDigest=sha(workloadB);
const mapped={request:{traceId:requestId,adapterId:'raw-base64-v1',
 input:{matrix:Array.from({length:16},()=>Array(6).fill(0))}},
 provenance:{source:'test-only',mapping:'test-only',authorization:'test-only'}};
const evaluation={runtimeExecutionState:'EXECUTED',verificationStatus:'UNVERIFIED',
 result:{formulaId:'LEEWAY-FORMULA-v1.0',inputHash:'fixture-evaluation-hash',
 resultHash:'fixture-output-hash',receiptPath:'untrusted-fixture'}};
const formulaProviders={
 mapWorkload:async()=>mapped,client:{evaluate:async()=>evaluation},
 verifyFormula:async()=>({verified:true,requestId,inputHash:evaluation.result.inputHash,
  resultHash:evaluation.result.resultHash,authority:'4citeB4U/Leeway-formula-live',
  receiptId:'formula-fixture'})
};
const formula=workload=>evaluateAppleGpuFormula({requestId,workload},formulaProviders);
const leaseEvidence=()=>[{stage:'FORMULA',requestId,receiptId:'formula-fixture',
 authority:'4citeB4U/Leeway-formula-live',workloadHash:originalDigest}];
const allocation={requestId,formulaReceiptId:'formula-fixture',leaseId:'lease-fixture',
 bytes:4096,deviceId:otherDevice,expiresAt:'2099-01-01T00:00:00Z'};
const leaseProviders={allocate:async()=>allocation,verifyLease:async()=>({
 verified:true,requestId,leaseId:'lease-fixture',formulaReceiptId:'formula-fixture',
 receiptId:'lease-receipt-fixture',authority:'LDWMD'})};
const lease=({workload=workloadA,device=deviceId,providers=leaseProviders}={})=>
 acquireAppleGpuMemoryLease({requestId,applicationId,workload,deviceId:device,
 priorEvidence:leaseEvidence()},providers);

test('RED: Formula rejects verifier missing the ORIGINAL workload digest',async()=>{
 const r=await formula(workloadA);
 assert.equal(r.admitted,false,'unbound original workload must not count as Formula GPU admission');
});
test('RED: Formula rejects stale signed/fixture workload digest after original bytes change',async()=>{
 const r=await evaluateAppleGpuFormula({requestId,workload:workloadB},{
 ...formulaProviders,verifyFormula:async()=>({...await formulaProviders.verifyFormula(),workloadHash:originalDigest})});
 assert.notEqual(originalDigest,otherDigest);
 assert.equal(r.admitted,false,'same request ID cannot authorize a different original workload');
});
test('RED: LDWMD rejects a lease verifier that never binds original Formula workload digest',async()=>{
 const r=await lease({providers:{...leaseProviders,
  allocate:async()=>({...allocation,deviceId})}});
 assert.equal(r.admitted,false,'verifier omitted original Formula workload hash');
});
test('RED: LDWMD rejects a device different from authorized requested target',async()=>{
 const r=await lease();
 assert.equal(r.admitted,false,'lease physical device differs from owner-authorized device');
});
test('RED: request chain rejects cross-stage workload/target disagreement before native callback',async()=>{
 let nativeCalled=false;
 const stage=(receiptId,authority,extra={})=>({requestId,admitted:true,receiptId,authority,...extra});
 const providers={
  deviceBridge:async()=>stage('bridge','TEST_BRIDGE'),
  formula:async()=>stage('formula-fixture','TEST_FORMULA',{traceId:requestId,workloadHash:originalDigest}),
  ldwmd:async()=>stage('lease-receipt-fixture','LDWMD',{
   workloadHash:originalDigest,deviceId,leaseId:'lease-fixture'}),
  appleMetal:async()=>{nativeCalled=true;return stage('metal','APPLE_METAL',{
   workloadHash:otherDigest,deviceId:otherDevice,leaseId:'lease-fixture',
   preAdmissionId:'synthetic-pre',reservationId:'synthetic-reservation'});},
  continuum:async()=>stage('continuum','TEST_CONTINUUM'),
  veritas:async()=>stage('veritas','TEST_VERITAS')
 };
 const result=await executeAppleGpuRequest({requestId,applicationId,
  workload:workloadA,deviceId},providers);
 assert.equal(result.status,'BLOCKED');
 assert.equal(nativeCalled,false,'native dispatch must not be invoked with inconsistent upstream trust');
});
