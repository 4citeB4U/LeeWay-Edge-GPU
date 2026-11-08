// R2 independent contract review; explicit test-only invocation required.
// Does not define a new GPU issuer, owner authority, lease database or dispatcher.
// Example: $env:LEEWAY_GPU_RUNTIME_ADAPTER_DIR='E:\\runtime\\provider-fabric\\application-adapters'
//          node --test native-admission-contract.review.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {statSync} from 'node:fs';
const root=process.env.LEEWAY_GPU_RUNTIME_ADAPTER_DIR;
if(!root||!path.isAbsolute(root))throw Error('EXPLICIT_RUNTIME_ADAPTER_SOURCE_REQUIRED');
const entry=file=>{
 const location=path.join(root,file);statSync(location);return pathToFileURL(location).href;
};
const {dispatchAppleGpuWithLease}=await import(entry('apple-gpu-metal-lease-adapter.mjs'));
const {persistAndVerifyAppleGpu}=await import(entry('apple-gpu-continuum-veritas-adapter.mjs'));
const requestId='request-for-apple-gpu-001',applicationId='leeway-gpu-apple';
const evidence=[{stage:'FORMULA',requestId,receiptId:'formula-1'},{stage:'LDWMD',requestId,receiptId:'memory-1'}];
const lease=()=>({requestId,receiptId:'memory-1',formulaReceiptId:'formula-1',
 leaseId:'lease-1',deviceId:'device-B',bytes:1048576,expiresAt:'2050-01-01T00:00:00.000Z'});
function fixture(){
 let calls=0,params=[];
 return {
  services:{
   resolveLease:async()=>lease(),
   verifyLease:async()=>true, // controlled test callback, never a production authority
   dispatchNative:async x=>{
    calls++;params.push(x);
    return {requestId:x.requestId,deviceId:x.deviceId,leaseId:x.leaseId,
     backend:'APPLE_METAL',physicalExecution:true,readbackVerified:true,
     receiptId:'synthetic-not-physical'};
   }
  },getCalls:()=>calls,getParams:()=>params
 };
}
test('BASELINE: rejected LDWMD lease blocks native callback',async()=>{
 const f=fixture();f.services.verifyLease=async()=>false;
 const r=await dispatchAppleGpuWithLease({requestId,applicationId,priorEvidence:evidence},f.services);
 assert.equal(r.admitted,false);assert.equal(f.getCalls(),0);
});
test('ACCEPTANCE: pre-existing authenticated STOP prevents native dispatch',async()=>{
 const f=fixture();const stop=new AbortController();stop.abort('OWNER_STOP');
 const r=await dispatchAppleGpuWithLease({requestId,applicationId,priorEvidence:evidence,signal:stop.signal,stopRequested:true},f.services);
 assert.equal(r.admitted,false,'STOP must prevent dispatch');
 assert.equal(f.getCalls(),0);
});
test('ACCEPTANCE: duplicate request/lease cannot execute twice',async()=>{
 const f=fixture(),req={requestId,applicationId,priorEvidence:evidence};
 await dispatchAppleGpuWithLease(req,f.services);
 const retry=await dispatchAppleGpuWithLease(req,f.services);
 assert.equal(retry.admitted,false,'duplicate must require durable one-shot reservation');
 assert.equal(f.getCalls(),1);
});
test('ACCEPTANCE: signed target device must match verified physical lease device',async()=>{
 const f=fixture();
 const r=await dispatchAppleGpuWithLease({requestId,applicationId,deviceId:'device-A',priorEvidence:evidence},f.services);
 assert.equal(r.admitted,false,'wrong device must not reach native dispatch');
 assert.equal(f.getCalls(),0);
});
test('ACCEPTANCE: STOP must prevent new Continuum/Veritas side effects',async()=>{
 let appended=0;
 const providers={
  continuumAppend:async()=>{appended++;return {requestId,recordId:'record-1'}},
  continuumRead:async()=>({requestId,recordId:'record-1',
    formulaReceiptId:'formula-1',ldwmdReceiptId:'memory-1',metalReceiptId:'metal-1'}),
  verifyContinuum:async()=>({verified:true,requestId,recordId:'record-1',receiptId:'continuum-1'}),
  verifyVeritas:async()=>({verified:true,requestId,authority:'VERITAS',continuumReceiptId:'continuum-1',receiptId:'synthetic'})
 };
 const stop=new AbortController();stop.abort('OWNER_STOP');
 const r=await persistAndVerifyAppleGpu({requestId,applicationId,
  priorEvidence:[...evidence,{stage:'APPLE_METAL',requestId,receiptId:'metal-1'}],
  signal:stop.signal,stopRequested:true},providers);
 assert.equal(r.admitted,false);
 assert.equal(appended,0);
});
