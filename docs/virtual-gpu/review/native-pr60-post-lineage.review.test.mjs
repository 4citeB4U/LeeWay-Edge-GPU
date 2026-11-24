// Diagnostic for PR60 POST receipt scope. Synthetic callbacks, NOT canonical Veritas.
import test from 'node:test';
import assert from 'node:assert/strict';
import {isAbsolute,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=process.env.LEEWAY_GPU_RUNTIME_ADAPTER_DIR;
if(!dir||!isAbsolute(dir))throw Error('OWNER_ADAPTER_SOURCE_DIRECTORY_REQUIRED');
const {persistAndVerifyAppleGpu}=await import(pathToFileURL(join(dir,'apple-gpu-continuum-veritas-adapter.mjs')).href);
const requestId='gpu-lineage-review-20261019',applicationId='leeway-gpu-apple';
const base=[{stage:'FORMULA',requestId,receiptId:'formula1'},
 {stage:'LDWMD',requestId,receiptId:'leaseReceipt1'}];
function providers(seen){
 return {
  verifyOwnerStop:async scope=>({...scope,verified:true,stopped:false}),
  continuumAppend:async record=>{seen.push(record);return {requestId,recordId:'record1'}},
  continuumRead:async()=>({requestId,recordId:'record1',formulaReceiptId:'formula1',
   ldwmdReceiptId:'leaseReceipt1',metalReceiptId:'metal1'}),
  verifyContinuum:async()=>({requestId,verified:true,recordId:'record1',receiptId:'continuum1'}),
  verifyVeritas:async()=>({requestId,verified:true,authority:'VERITAS',
   continuumReceiptId:'continuum1',receiptId:'veritas-callback1'})
 };
}
const metal=(overrides={})=>({stage:'APPLE_METAL',requestId,receiptId:'metal1',
 preAdmissionId:'admission-A',reservationId:'reserve-A',deviceId:'device-A',leaseId:'lease-A',...overrides});

test('POST record does not preserve PRE admission, reservation, device or physical lease',async()=>{
 const recorded=[];
 const r=await persistAndVerifyAppleGpu({requestId,applicationId,priorEvidence:[...base,metal()]},providers(recorded));
 assert.equal(r.admitted,true,'synthetic callback acceptance only');
 assert.equal(recorded.length,1);
 for(const key of ['preAdmissionId','reservationId','deviceId','leaseId'])assert.equal(recorded[0][key],undefined,key);
});
test('changing PRE/reservation/device metadata in stage evidence does not alter persisted POST record',async()=>{
 const first=[],second=[];
 const a=await persistAndVerifyAppleGpu({requestId,applicationId,priorEvidence:[...base,metal()]},providers(first));
 const b=await persistAndVerifyAppleGpu({requestId,applicationId,priorEvidence:[...base,
  metal({preAdmissionId:'forged-B',reservationId:'forged-B',deviceId:'other-device',leaseId:'different-lease'})]},providers(second));
 assert.equal(a.admitted,true);assert.equal(b.admitted,true);
 assert.deepEqual(first[0],second[0],'POST record identity loses authenticated PRE/reservation/device references');
});
