/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.G23.SOFTWARE_CHAIN_TEST
5WH:
WHAT = Exercise actual G22 software math under every G23 consumer chain stage.
WHY = Catch missing authorities, false admission and undurable results.
WHO = Creator-authorized LeeWay engineering; synthetic host stubs are NOT production authority.
WHERE = tests/virtual-gpu/governed-software-compute.test.mjs
WHEN = 2026-10-22
HOW = Fail-closed stage tests using original LeeWay worker and independent numeric oracle.
LICENSE: MIT
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createGovernedSoftwareCompute,SOFTWARE_CAPABILITY} from '../../core/governed-software-compute.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const task=()=>({requestId:'g23-001',sourceSha256:'a'.repeat(64),size:2,
 A:Float32Array.of(1,2,3,4),B:Float32Array.of(5,6,7,8)});
function makeHost(overrides={}){
 const calls=[];let saved;
 const wrap=(name,fn)=>(...args)=>{calls.push(name);return fn(...args);};
 const receipt=(name,b)=>({status:'PASS',requestId:b.requestId,inputSha256:b.inputSha256,receiptId:name});
 const host={
  verifyCanonicalHost:wrap('source',b=>({status:'PASS',requestId:b.requestId,sourceSha256:b.sourceSha256,capability:SOFTWARE_CAPABILITY})),
  runtimeAuthorize:wrap('runtime',b=>receipt('runtime-r',b)),
  formulaEvaluate:wrap('formula',b=>receipt('formula-r',b)),
  formulaReplayVerify:wrap('formula-replay',b=>receipt('replay-r',b)),
  veritasPre:wrap('pre',b=>receipt('pre-r',b)),
  veritasPost:wrap('post',b=>receipt('post-r',b)),
  veritasVerify:wrap('veritas-verify',b=>receipt('verified-'+b.phase,b)),
  ldwmdAcquire:wrap('ldwmd-acquire',b=>({status:'PASS',requestId:b.requestId,leaseId:'lease-r',memoryKind:'HOST_RAM',allocatedBytes:b.allocationBytes})),
  ldwmdVerify:wrap('ldwmd-verify',b=>receipt('lease-verification-r',b)),
  ldwmdRelease:wrap('ldwmd-release',b=>({status:'PASS',requestId:b.requestId,leaseId:b.lease.leaseId,activeBytes:0})),
  outputVerify:wrap('output-verify',b=>{const a=b.output;return a instanceof Float32Array&&
   a.length===4&&[19,22,43,50].every((v,i)=>v===a[i])&&hash(Buffer.from(a.buffer))===b.resultSha256
   ?{status:'PASS',requestId:b.requestId,resultSha256:b.resultSha256,receiptId:'oracle-r'}:{status:'BLOCKED'};}),
  continuumStore:wrap('continuum-store',b=>{saved=Buffer.from(b.output.buffer,b.output.byteOffset,b.output.byteLength);saved=Buffer.from(saved);return {status:'PASS',requestId:b.requestId,recordId:'continuum-r',resultSha256:b.resultSha256};}),
  continuumReadback:wrap('continuum-readback',b=>({recordId:b.stored.recordId,bytes:Buffer.from(saved)})),
  receiptAppend:wrap('receipt-append',b=>receipt('ledger-r',b)),
  receiptReadback:wrap('receipt-readback',b=>receipt('chain-r',b)),
  learningAdmit:wrap('learning-admit',b=>({status:'PASS',requestId:b.requestId,eventId:'learning-r'})),
  learningReadback:wrap('learning-readback',b=>({status:'PASS',requestId:b.requestId,eventId:b.learning.eventId,receiptId:b.receipt.receiptId,resultSha256:b.resultSha256}))
 };
 Object.assign(host,overrides);
 return {host,calls};
}
test('full stage chain calls the real LeeWay CPU engine, without production promotion',async()=>{
 const {host,calls}=makeHost();
 const result=await createGovernedSoftwareCompute(host).execute(task());
 assert.equal(result.status,'FULL_CHAIN_CONSUMER_CHECKS_PASS');
 assert.equal(result.productionAccepted,false);
 assert.equal(result.independentProductionCertificate,false);
 assert.equal(result.externalGpuProvider,false);
 assert.deepEqual([...result.output],[19,22,43,50]);
 assert.deepEqual(calls,['source','runtime','formula','formula-replay','pre','veritas-verify',
   'ldwmd-acquire','ldwmd-verify','output-verify','continuum-store',
   'continuum-readback','post','veritas-verify','receipt-append',
   'receipt-readback','learning-admit','learning-readback','ldwmd-release']);
});
test('host missing canonical stages is rejected at construction',()=>{
 const {host}=makeHost();delete host.formulaEvaluate;
 assert.throws(()=>createGovernedSoftwareCompute(host),/G23_HOST_BINDING_MISSING_formulaEvaluate/);
});
const rejectStage=(name,override,expected,beforeNever,afterRequired)=>test(name,async()=>{
 const {host,calls}=makeHost(override);
 await assert.rejects(createGovernedSoftwareCompute(host).execute(task()),expected);
 if(beforeNever)assert.ok(!calls.includes(beforeNever),beforeNever+' was invoked before authorization');
 if(afterRequired)assert.ok(calls.includes(afterRequired),afterRequired+' not invoked for cleanup');
});
rejectStage('unverified source blocks Runtime', {verifyCanonicalHost:()=>({status:'BLOCKED'})},
 /G23_CANONICAL_HOST_SOURCE_UNQUALIFIED/,'runtime');
rejectStage('Formula replay failure blocks Veritas and allocations',{formulaReplayVerify:()=>({status:'BLOCKED'})},
 /G23_FORMULA_REPLAY_UNVERIFIED/,'ldwmd-acquire');
rejectStage('Veritas PRE failure blocks allocation',{veritasPre:()=>({status:'BLOCKED'})},
 /G23_VERITAS_PRE_UNVERIFIED/,'ldwmd-acquire');
rejectStage('wrong-kind LDWMD allocation is blocked with cleanup',{ldwmdAcquire:b=>({status:'PASS',requestId:b.requestId,leaseId:'lease-r',memoryKind:'GPU_VRAM',allocatedBytes:b.allocationBytes})},
 /G23_LDWMD_HOST_LEASE_UNVERIFIED/,'continuum-store','ldwmd-release');
rejectStage('incorrect output prevents Continuum and issues release',{outputVerify:()=>({status:'BLOCKED'})},
 /G23_INDEPENDENT_OUTPUT_PROOF_UNVERIFIED/,'continuum-store','ldwmd-release');
rejectStage('wrong Continuum bytes prevent Veritas POST',{continuumReadback:b=>({recordId:b.stored.recordId,bytes:Buffer.alloc(16,42)})},
 /G23_CONTINUUM_OUTCOME_RECONCILIATION_REQUIRED/,'post','ldwmd-release');
rejectStage('Veritas POST failure blocks ledger',{veritasPost:()=>({status:'BLOCKED'})},
 /G23_CONTINUUM_OUTCOME_RECONCILIATION_REQUIRED/,'receipt-append','ldwmd-release');
rejectStage('Receipt chain readback failure blocks Learning Ledger',{receiptReadback:()=>({status:'BLOCKED'})},
 /G23_RECEIPT_OUTCOME_RECONCILIATION_REQUIRED/,'learning-admit','ldwmd-release');
rejectStage('Learning readback ambiguity requires reconciliation',{learningReadback:()=>({status:'BLOCKED'})},
 /G23_LEARNING_OUTCOME_RECONCILIATION_REQUIRED/,null,'ldwmd-release');
rejectStage('LDWMD release failure is not a completed result',{ldwmdRelease:()=>({status:'BLOCKED'})},
 /G23_LDWMD_RELEASE_UNVERIFIED/);
test('reject request-supplied host authority',async()=>{
 const {host}=makeHost();
 await assert.rejects(createGovernedSoftwareCompute(host).execute({...task(),host:{}}),/G23_REQUEST_OR_SOURCE_PIN_INVALID/);
});
test('abort and shared buffer rejected',async()=>{
 const {host}=makeHost(),ac=new AbortController();ac.abort();
 await assert.rejects(createGovernedSoftwareCompute(host).execute(task(),{signal:ac.signal}),/G23_REQUEST_CANCELLED/);
 if(typeof SharedArrayBuffer!=='undefined'){
  const t=task();t.A=new Float32Array(new SharedArrayBuffer(16));
  await assert.rejects(createGovernedSoftwareCompute(host).execute(t),/G23_SOFTWARE_MATRIX_INPUT_INVALID/);
 }
});
