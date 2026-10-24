// Independent qualification of EXISTING PR60 C3 adapters. All callbacks are synthetic.
// Reservation storage reuses the PR49 single-volume replay API ONLY as a laboratory fixture.
// No signed PRE grant, independent Veritas, iPhone transport or production GPU authorization.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.env.LEEWAY_GPU_RUNTIME_ADAPTER_DIR;
if(!root||!isAbsolute(root))throw Error('OWNER_ADAPTER_SOURCE_DIRECTORY_REQUIRED');
const source=(file)=>pathToFileURL(join(root,file)).href;
const {dispatchAppleGpuWithLease}=await import(source('apple-gpu-metal-lease-adapter.mjs'));
const {persistAndVerifyAppleGpu}=await import(source('apple-gpu-continuum-veritas-adapter.mjs'));
const {createFileReplayConsumer}=await import(source('apple-gpu-file-replay-ledger.mjs'));

const requestId='gpu-admission-review-20261019-01',applicationId='leeway-gpu-apple';
const deviceId='iphone-physical-device-fixture';
const priorEvidence=[{stage:'FORMULA',requestId,receiptId:'formula-fixture'},{stage:'LDWMD',requestId,receiptId:'ldwmd-fixture'}];
const input=()=>({requestId,applicationId,deviceId,workload:{hash:'a'.repeat(64)},priorEvidence});
const lease=()=>({requestId,receiptId:'ldwmd-fixture',formulaReceiptId:'formula-fixture',
 leaseId:'physical-lease-fixture',deviceId,bytes:1048576,expiresAt:'2099-01-01T00:00:00Z'});

function services(t,override={}){
 const directory=mkdtempSync(join(tmpdir(),'lee-gpu-pr60-'));
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 let nativeCalls=0,reservationCalls=0,stopCalls=0,stopped=false;
 const consume=createFileReplayConsumer({directory});
 const reserveDispatch=async scope=>{
  reservationCalls++;
  const nonce='gpu-reservation-claim-'+scope.applicationId+'-'+scope.requestId+'-'+scope.leaseId;
  const first=await consume({applicationId:scope.applicationId,requestId:scope.requestId,
   nonce,grantId:scope.admissionId});
  return {...scope,reserved:first,reservationId:'test-only-reservation-1'};
 };
 const providers={
  verifyPreAdmission:async scope=>({...scope,verified:true,admissionId:'test-only-admission'}),
  verifyOwnerStop:async scope=>{stopCalls++;return {...scope,verified:true,stopped}},
  resolveLease:async()=>lease(),verifyLease:async()=>true,reserveDispatch,
  dispatchNative:async params=>{
   nativeCalls++;
   return {requestId:params.requestId,deviceId:params.deviceId,leaseId:params.leaseId,
    admissionId:params.admissionId,reservationId:params.reservationId,
    backend:'APPLE_METAL',physicalExecution:true,readbackVerified:true,receiptId:'synthetic-metal-readback'};
  },...override
 };
 return {providers,directory,getNativeCalls:()=>nativeCalls,getReservationCalls:()=>reservationCalls,
  getStopCalls:()=>stopCalls,setStopped:x=>{stopped=x},reopen:()=>createFileReplayConsumer({directory})};
}
test('independently scoped test providers execute one correlated interface call',async t=>{
 const f=services(t),r=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(r.admitted,true);assert.equal(r.preAdmissionId,'test-only-admission');
 assert.equal(r.reservationId,'test-only-reservation-1');assert.equal(f.getNativeCalls(),1);
});
test('same request/lease replay denied after durable store reconstruction',async t=>{
 const f=services(t);
 assert.equal((await dispatchAppleGpuWithLease(input(),f.providers)).admitted,true);
 const consumer=f.reopen();
 f.providers.reserveDispatch=async scope=>{
  const reserved=await consumer({applicationId:scope.applicationId,requestId:scope.requestId,
   nonce:'gpu-reservation-claim-'+scope.applicationId+'-'+scope.requestId+'-'+scope.leaseId,
   grantId:scope.admissionId});
  return {...scope,reserved,reservationId:'test-only-reservation-1'};
 };
 const repeat=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(repeat.admitted,false);
 assert.equal(repeat.reason,'DURABLE_DISPATCH_RESERVATION_DENIED');
 assert.equal(f.getNativeCalls(),1);
});
test('two concurrent requests for identical dispatch reservation cannot both execute',async t=>{
 const f=services(t);
 const runs=await Promise.all([dispatchAppleGpuWithLease(input(),f.providers),
  dispatchAppleGpuWithLease(input(),f.providers)]);
 assert.equal(runs.filter(x=>x.admitted===true).length,1);
 assert.equal(runs.filter(x=>x.admitted===false).length,1);
 assert.equal(f.getNativeCalls(),1);
});
test('missing PRE authority refuses reservation and native dispatch',async t=>{
 const f=services(t);delete f.providers.verifyPreAdmission;
 const r=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(r.reason,'TRUSTED_PRE_STOP_OR_RESERVATION_PROVIDER_UNBOUND');
 assert.equal(f.getReservationCalls(),0);assert.equal(f.getNativeCalls(),0);
});
test('mismatched target device is rejected before reservation',async t=>{
 const f=services(t);
 const r=await dispatchAppleGpuWithLease({...input(),deviceId:'different-iphone'},f.providers);
 assert.equal(r.reason,'TARGET_DEVICE_LEASE_MISMATCH');
 assert.equal(f.getReservationCalls(),0);assert.equal(f.getNativeCalls(),0);
});
test('owner STOP before physical dispatch is an uncompromising veto',async t=>{
 const f=services(t);f.setStopped(true);
 const r=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(r.reason,'OWNER_STOP_REQUESTED');
 assert.equal(f.getNativeCalls(),0);assert.equal(f.getReservationCalls(),0);
});
test('owner STOP after reservation denies native dispatch and leaves reservation spent',async t=>{
 let checks=0;const f=services(t);
 f.providers.verifyOwnerStop=async scope=>({...scope,verified:true,stopped:++checks>=3});
 const r=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(r.reason,'OWNER_STOP_REQUESTED');assert.equal(f.getNativeCalls(),0);
 assert.equal(f.getReservationCalls(),1);
 f.providers.verifyOwnerStop=async scope=>({...scope,verified:true,stopped:false});
 const retry=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(retry.reason,'DURABLE_DISPATCH_RESERVATION_DENIED');
 assert.equal(f.getNativeCalls(),0);
});
test('native output missing echoed reservation is rejected even when callback claims physical success',async t=>{
 const f=services(t,{dispatchNative:async params=>({requestId:params.requestId,
  deviceId:params.deviceId,leaseId:params.leaseId,admissionId:params.admissionId,
  backend:'APPLE_METAL',physicalExecution:true,readbackVerified:true,receiptId:'synthetic'})});
 const r=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(r.reason,'PHYSICAL_GPU_EVIDENCE_MISSING');
});
test('post-stage owner STOP before Continuum append denies storage side effect',async()=>{
 let calls=0;
 const r=await persistAndVerifyAppleGpu({requestId,applicationId,
  priorEvidence:[...priorEvidence,{stage:'APPLE_METAL',requestId,receiptId:'metal-fixture'}]},
  {continuumAppend:async()=>{calls++;return {requestId,recordId:'record'}},
   continuumRead:async()=>({}),verifyContinuum:async()=>({}),verifyVeritas:async()=>({}),
   verifyOwnerStop:async scope=>({...scope,verified:true,stopped:true})});
 assert.equal(r.admitted,false);assert.equal(r.reason,'OWNER_STOP_REQUESTED');
 assert.equal(calls,0);
});

test('STOP discovered after native callback is attempted requires independent reconciliation',async t=>{
 const f=services(t);let checks=0;
 f.providers.verifyOwnerStop=async scope=>({...scope,verified:true,stopped:++checks>=4});
 const result=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(f.getNativeCalls(),1);
 assert.equal(result.admitted,false);
 assert.equal(result.reason,'OWNER_STOP_AFTER_NATIVE_DISPATCH');
 assert.equal(result.dispatchAttempted,true);
 assert.equal(result.independentReconciliationRequired,true);
 assert.equal(result.receiptId,undefined);
});
test('native callback throws after reservation: outcome uncertain and no forged receipt',async t=>{
 const f=services(t,{dispatchNative:async()=>{throw Error('simulated uncertain native outcome')}});
 const result=await dispatchAppleGpuWithLease(input(),f.providers);
 assert.equal(result.admitted,false);
 assert.equal(result.reason,'NATIVE_METAL_DISPATCH_FAILED');
 assert.equal(result.dispatchAttempted,true);
 assert.equal(result.independentReconciliationRequired,true);
 assert.equal(result.receiptId,undefined);
});
