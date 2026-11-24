// Independent K1/K2 review. All issuer/formula/lease callbacks are synthetic.
// These tests DOCUMENT source contract gaps and must NOT be interpreted as production admissions.
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
const requestId='formula-ldwmd-review-20261019',applicationId='leeway-gpu-apple';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const workloadA=Buffer.from('owner-original-gpu-workload-A','utf8');
const workloadB=Buffer.from('owner-original-gpu-workload-B','utf8');
const matrix=Array.from({length:16},()=>Array(6).fill(0));
const formulaServices={
 mapWorkload:async()=>({request:{traceId:requestId,adapterId:'raw-base64-v1',input:{matrix}},
  provenance:{source:'synthetic',mapping:'fixture-only',authorization:'untrusted-test'}}),
 client:{evaluate:async()=>({runtimeExecutionState:'EXECUTED',verificationStatus:'UNVERIFIED',
  result:{formulaId:'LEEWAY-FORMULA-v1.0',inputHash:'fixture-input',resultHash:'fixture-result',receiptPath:'noncanonical'}})},
 verifyFormula:async()=>({verified:true,requestId,inputHash:'fixture-input',resultHash:'fixture-result',
  authority:'4citeB4U/Leeway-formula-live',receiptId:'formula-fixture'})
};
const formula=workload=>evaluateAppleGpuFormula({requestId,workload},formulaServices);
const stage=()=>[{stage:'FORMULA',requestId,receiptId:'formula-fixture',authority:'4citeB4U/Leeway-formula-live'}];
const leaseServices={
 allocate:async()=>({requestId,formulaReceiptId:'formula-fixture',leaseId:'lease-test',
  bytes:4096,deviceId:'different-device-B',expiresAt:'2099-01-01T00:00:00Z'}),
 verifyLease:async()=>({verified:true,requestId,formulaReceiptId:'formula-fixture',leaseId:'lease-test',
  receiptId:'ldwmd-fixture',authority:'LDWMD'})
};
const lease=(workload, deviceId='requested-device-A')=>
 acquireAppleGpuMemoryLease({requestId,applicationId,workload,deviceId,priorEvidence:stage()},leaseServices);
test('actual Formula adapter admits two different original workloads with same fixture verdict',async()=>{
 assert.notEqual(digest(workloadA),digest(workloadB));
 const a=await formula(workloadA),b=await formula(workloadB);
 assert.equal(a.admitted,true);assert.equal(b.admitted,true);
 assert.deepEqual(a,b,'Formula outcome is independent of original workload bytes given same injected mapping/verifier');
});
test('Formula admitted result does not expose trusted original workload SHA256',async()=>{
 const x=await formula(workloadA);
 assert.equal(x.workloadHash,undefined);
});
test('actual LDWMD adapter admits different workload bytes with same fixture lease',async()=>{
 const a=await lease(workloadA),b=await lease(workloadB);
 assert.equal(a.admitted,true);assert.equal(b.admitted,true);
 assert.deepEqual(a,b);
});
test('LDWMD does not reject requested device/lease device mismatch at this adapter boundary',async()=>{
 const result=await lease(workloadA,'requested-device-A');
 assert.equal(result.admitted,true);
 assert.equal(result.deviceId,'different-device-B');
 assert.equal(result.workloadHash,undefined);
});
test('high-level request-chain evidence has no original workload digest for Formula or LDWMD',async()=>{
 const providers={
  deviceBridge:async()=>({requestId,admitted:true,authority:'TEST_BRIDGE',receiptId:'bridge'}),
  formula:async()=>({...await formula(workloadA)}),
  ldwmd:async()=>({...await lease(workloadB)}),
  appleMetal:async()=>({requestId,admitted:true,authority:'TEST_NATIVE',receiptId:'metal',
   preAdmissionId:'synthetic-pre',reservationId:'synthetic-reservation',
   deviceId:'different-device-B',leaseId:'lease-test',workloadHash:digest(workloadB)}),
  continuum:async()=>({requestId,admitted:true,authority:'TEST_CONTINUUM',receiptId:'continuum'}),
  veritas:async()=>({requestId,admitted:true,authority:'TEST_VERITAS',receiptId:'veritas'})
 };
 const result=await executeAppleGpuRequest({requestId,applicationId,workload:workloadA,
  deviceId:'requested-device-A'},providers);
 assert.equal(result.status,'PROVIDER_ATTESTED_CHAIN');
 const first=result.evidence.find(x=>x.stage==='FORMULA');
 const second=result.evidence.find(x=>x.stage==='LDWMD');
 assert.equal(first.workloadHash,undefined);
 assert.equal(second.workloadHash,undefined);
 assert.equal(result.evidence.find(x=>x.stage==='APPLE_METAL').workloadHash,digest(workloadB));
 assert.notEqual(result.status,'CANONICAL_ADMITTED');
});
