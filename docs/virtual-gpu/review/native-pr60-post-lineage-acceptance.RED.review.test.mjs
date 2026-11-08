// INTENTIONALLY RED acceptance tests for C3's POST lineage owner.
// Execute separately, not in green CI until K2/J7 ratify the canonical wire shape.
// Synthetic callbacks do not constitute independent Veritas, owner consent or physical Metal proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import {join,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=process.env.LEEWAY_GPU_RUNTIME_ADAPTER_DIR;
if(!root||!isAbsolute(root))throw Error('PINNED_OWNER_ADAPTER_DIRECTORY_REQUIRED');
const {persistAndVerifyAppleGpu}=await import(pathToFileURL(join(root,'apple-gpu-continuum-veritas-adapter.mjs')).href);
const requestId='post-lineage-acceptance-20261019';
const applicationId='leeway-gpu-apple';
const claims=Object.freeze({
 preAdmissionId:'trusted-pre-fixture',reservationId:'reserved-native-fixture',
 deviceId:'iphone-device-fixture',leaseId:'ldwmd-lease-fixture',
 workloadHash:'c'.repeat(64)
});
const formula={stage:'FORMULA',requestId,receiptId:'formula-receipt'};
const memory={stage:'LDWMD',requestId,receiptId:'memory-receipt'};
const metal=(extra={})=>({stage:'APPLE_METAL',requestId,receiptId:'metal-receipt',...claims,...extra});
const authority=(priorEvidence,override={})=>{
 let writes=0;const records=[];
 const providers={
  verifyOwnerStop:async x=>({...x,verified:true,stopped:false}),
  continuumAppend:async record=>{writes++;records.push(record);return {requestId,recordId:'continuum-cell'}},
  continuumRead:async()=>({requestId,recordId:'continuum-cell',
   formulaReceiptId:'formula-receipt',ldwmdReceiptId:'memory-receipt',
   metalReceiptId:'metal-receipt',...claims}),
  verifyContinuum:async()=>({verified:true,requestId,recordId:'continuum-cell',receiptId:'continuum-proof'}),
  verifyVeritas:async()=>({verified:true,requestId,authority:'VERITAS',
   continuumReceiptId:'continuum-proof',receiptId:'synthetic-noncanonical'}),
  ...override
 };
 return {run:()=>persistAndVerifyAppleGpu({requestId,applicationId,priorEvidence},providers),
  getWrites:()=>writes,getRecords:()=>records};
};
const evidence=x=>[formula,memory,x];
test('RED: POST refuses incomplete native PRE/reservation/device/lease/workload lineage BEFORE persistence',async()=>{
 for(const key of Object.keys(claims)){
  const partial=metal();delete partial[key];
  const f=authority(evidence(partial));
  const response=await f.run();
  assert.equal(response.admitted,false, 'missing '+key+' must not produce an admitted result');
  assert.equal(f.getWrites(),0,'missing '+key+' must not persist an apparently complete execution');
 }
});
test('RED: Continuum body must include every authenticated PRE/dispatch identity',async()=>{
 const f=authority(evidence(metal()));
 const result=await f.run();
 assert.equal(result.admitted,true,'only fixture callback interface claim, not canonical admission');
 const record=f.getRecords()[0];
 for(const [key,value] of Object.entries(claims))
  assert.equal(record?.[key],value,'missing POST durable field: '+key);
});
test('RED: Continuum readback must reject altered reservation even if verifier callback says PASS',async()=>{
 const f=authority(evidence(metal()),{
  continuumRead:async()=>({requestId,recordId:'continuum-cell',formulaReceiptId:'formula-receipt',
   ldwmdReceiptId:'memory-receipt',metalReceiptId:'metal-receipt',
   ...claims,reservationId:'DIFFERENT_RESERVATION'})
 });
 const result=await f.run();
 assert.equal(result.admitted,false,'durable readback with conflicting PRE reservation cannot be admitted');
});
test('RED: POST identity context delivered to Veritas must include PRE, device, lease, workload',async()=>{
 let veritasRecord;
 const f=authority(evidence(metal()),{
  verifyVeritas:async x=>{veritasRecord=x.record;return {
    verified:true,requestId,authority:'VERITAS',continuumReceiptId:'continuum-proof',
    receiptId:'synthetic-noncanonical'};}
 });
 await f.run();
 for(const [key,value] of Object.entries(claims))
  assert.equal(veritasRecord?.[key],value,'Veritas evidence omitted '+key);
});
