import test from 'node:test';
import assert from 'node:assert/strict';
import {persistAndVerifyAppleGpu} from './apple-gpu-continuum-veritas-adapter.mjs';
import {executeAppleGpuRequest} from './apple-gpu-request-chain.mjs';

const requestId='pr61-lineage-review-20261019',applicationId='leeway-gpu-apple',deviceId='fixture-physical-iphone';
const identities=Object.freeze({preAdmissionId:'pre-one',reservationId:'reservation-one',
 deviceId,leaseId:'lease-one',workloadHash:'a'.repeat(64)});
const proof=Object.freeze({requestId,applicationId,deviceId,formulaReceiptId:'formula-one',
 ldwmdReceiptId:'ldwmd-one',metalReceiptId:'metal-one',...identities,lineageReceiptId:'lineage-one'});
const evidence=()=>[
 {stage:'FORMULA',requestId,receiptId:proof.formulaReceiptId},
 {stage:'LDWMD',requestId,receiptId:proof.ldwmdReceiptId},
 {stage:'APPLE_METAL',requestId,receiptId:proof.metalReceiptId,...identities}
];
function mock(overrides={}){
 const appended=[],veritas=[];
 const fixture={
  verifyPostLineage:async scope=>({...scope,verified:true,lineageReceiptId:proof.lineageReceiptId}),
  verifyOwnerStop:async scope=>({...scope,verified:true,stopped:false}),
  continuumAppend:async record=>{appended.push(record);return{requestId,recordId:'record-one'};},
  continuumRead:async()=>({...proof,recordId:'record-one'}),
  verifyContinuum:async()=>({requestId,verified:true,recordId:'record-one',receiptId:'continuum-one'}),
  verifyVeritas:async arg=>{veritas.push(arg);return{verified:true,requestId,
   continuumReceiptId:'continuum-one',authority:'VERITAS',receiptId:'fixture-veritas'};},
  ...overrides
 };
 return {providers:fixture,appended,veritas,run:input=>persistAndVerifyAppleGpu({
  requestId,applicationId,deviceId,priorEvidence:evidence(),...input},fixture)};
}
test('valid synthetic trust callbacks carry all PRE identities to Continuum and Veritas',async()=>{
 const f=mock(),r=await f.run();
 assert.equal(r.admitted,true);assert.equal(f.appended.length,1);assert.equal(f.veritas.length,1);
 for(const key of Object.keys(proof)){assert.equal(f.appended[0][key],proof[key]);
 assert.equal(f.veritas[0].record[key],proof[key]);}
});
test('unbound independent POST lineage verifier fails before persistence',async()=>{
 const f=mock();delete f.providers.verifyPostLineage;
 const r=await f.run();assert.equal(r.reason,'TRUSTED_POST_LINEAGE_VERIFIER_UNBOUND');
 assert.equal(f.appended.length,0);
});
test('a trusted POST verifier that substitutes reservation is refused before persistence',async()=>{
 const f=mock({verifyPostLineage:async scope=>({...scope,verified:true,
  reservationId:'different-reservation',lineageReceiptId:'lineage-one'})});
 const r=await f.run();assert.equal(r.reason,'TRUSTED_POST_LINEAGE_UNVERIFIED');
 assert.equal(f.appended.length,0);
});
test('missing any native PRE identity fails before side effects',async()=>{
 for(const key of Object.keys(identities)){
  const f=mock(),ev=evidence(),metal=ev[2];delete metal[key];
  const r=await f.run({priorEvidence:ev});
  assert.equal(r.admitted,false,key);assert.equal(f.appended.length,0,key);
 }
});
test('Continuum substituted PRE identities fail durable readback comparisons',async()=>{
 for(const key of Object.keys(identities)){
  const f=mock({continuumRead:async()=>({...proof,recordId:'record-one',[key]: 'forged'})});
  const r=await f.run();assert.equal(r.reason,'PERSISTED_CONTENT_MISMATCH',key);
  assert.equal(f.veritas.length,0,key);
 }
});
test('trusted POST lineage callback error stays blocked with no Continuum write',async()=>{
 const f=mock({verifyPostLineage:async()=>{throw Error('fixture unavailable')}});
 const r=await f.run();assert.equal(r.reason,'TRUSTED_POST_LINEAGE_VERIFIER_FAILED');
 assert.equal(f.appended.length,0);
});
test('readback that omits lineage receipt is not accepted',async()=>{
 const f=mock({continuumRead:async()=>({...proof,recordId:'record-one',lineageReceiptId:undefined})});
 const r=await f.run();assert.equal(r.reason,'PERSISTED_CONTENT_MISMATCH');
});
test('request chain forwards Metal PRE lineage to POST provider without upgrading its authority',async()=>{
 let forwarded;
 const stageResult=(receiptId,authority)=>({requestId,admitted:true,receiptId,authority});
 const providers={
  deviceBridge:async()=>stageResult('bridge-one','TEST_BRIDGE'),
  formula:async()=>({...stageResult('formula-one','TEST_FORMULA'),traceId:requestId}),
  ldwmd:async()=>stageResult('ldwmd-one','TEST_LDWMD'),
  appleMetal:async()=>({...stageResult('metal-one','APPLE_METAL'),...identities}),
  continuum:async arg=>{forwarded=arg.priorEvidence.find(x=>x.stage==='APPLE_METAL');
   return stageResult('continuum-one','TEST_CONTINUUM');},
  veritas:async()=>stageResult('fixture-veritas','TEST_VERITAS')
 };
 const result=await executeAppleGpuRequest({requestId,applicationId,deviceId},providers);
 assert.equal(result.status,'PROVIDER_ATTESTED_CHAIN');
 for(const [key,value]of Object.entries(identities))assert.equal(forwarded[key],value);
 assert.notEqual(result.status,'CANONICAL_ADMITTED');
});
