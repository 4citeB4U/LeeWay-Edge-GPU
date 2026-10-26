/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.TENSOR_UNIT.G2
WHAT: Pure tensor and dispatcher negative tests. WHY: Failover must not mask authorization or correctness failures.
WHO: Agent Lee. WHERE: Canonical GPU module imports. WHEN: node --test.
HOW: Labeled injected resource faults plus actual CPU calculation; no hardware qualification claim.
ROLES: VERIFY. LICENSE: MIT
*/
import test from 'node:test';import assert from 'node:assert/strict';
import {HybridDispatcher} from '../../core/hybrid.dispatcher.js';
import {TENSOR_OPERATION,snapshotTensor,TensorError} from '../../dispatch/tensor-contract.mjs';
import {cpuTensorReference,compareTensorResults} from '../../fallback/tensor-reference.mjs';
const input=()=>({operation:TENSOR_OPERATION,m:2,k:3,n:2,A:new Float32Array([1,2,3,4,5,6]),B:new Float32Array([1,2,3,4,5,6]),bias:new Float32Array([-30,1]),activation:'relu'});
const fixture=(gpu,controller={approve:async()=>true})=>{
 let gpuCalls=0,cpuCalls=0;
 const d=new HybridDispatcher({webgpu:{run:async(t,c)=>{gpuCalls++;return gpu(t,c);}},cpu:{run:async t=>{cpuCalls++;return cpuTensorReference(t.input);}}});
 const ctx={capability:'WEBGPU',allowCpuFallback:true,controller,verify:async(actual,t)=>compareTensorResults(actual,cpuTensorReference(t))};
 return {d,ctx,calls:()=>({gpuCalls,cpuCalls})};
};
test('rectangular fused CPU reference has explicit known answer',()=>{assert.deepEqual([...cpuTensorReference(input())],[0,29,19,65]);});
test('input snapshot does not alias caller arrays',()=>{const x=input(),s=snapshotTensor(x);x.A[0]=999;assert.equal(s.A[0],1);});
test('invalid shape fails before allocation',()=>{assert.throws(()=>snapshotTensor({...input(),A:new Float32Array(1)}),/A/);});
test('nonfinite inputs rejected',()=>{const x=input();x.B[0]=NaN;assert.throws(()=>snapshotTensor(x));});
test('unknown activation rejected',()=>{assert.throws(()=>snapshotTensor({...input(),activation:'magic'}));});
test('numerical mismatch detected',()=>{assert.equal(compareTensorResults(new Float32Array([1]),new Float32Array([2])).valid,false);});
test('injected device loss retries the pure input once on CPU',async()=>{const f=fixture(async()=>{throw new TensorError('GPU_DEVICE_LOST');});const r=await f.d.dispatch({type:'TENSOR',input:input()},f.ctx);assert.equal(r.backend,'CPU');assert.equal(r.recoveredFrom,'GPU_DEVICE_LOST');assert.deepEqual([...r.result],[0,29,19,65]);assert.deepEqual(f.calls(),{gpuCalls:1,cpuCalls:1});});
test('denied admission cannot trigger fallback',async()=>{const f=fixture(async t=>cpuTensorReference(t.input),{approve:async()=>false});await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx));assert.deepEqual(f.calls(),{gpuCalls:0,cpuCalls:0});});
test('CPU fallback requires its own explicit approval',async()=>{let approvals=0;const f=fixture(async()=>{throw new TensorError('GPU_DEVICE_LOST');},{approve:async()=>++approvals===1});await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx));assert.deepEqual(f.calls(),{gpuCalls:1,cpuCalls:0});});
test('validation failure is not hidden by fallback',async()=>{const f=fixture(async()=>{throw new TensorError('GPU_VALIDATION_FAILED');});await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx),e=>e.code==='GPU_VALIDATION_FAILED');assert.equal(f.calls().cpuCalls,0);});
test('wrong GPU result is rejected instead of hidden with CPU',async()=>{const f=fixture(async()=>new Float32Array(4));await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx),e=>e.code==='TENSOR_REFERENCE_MISMATCH');assert.equal(f.calls().cpuCalls,0);});
test('pre-cancelled operation executes on neither backend',async()=>{const f=fixture(async t=>cpuTensorReference(t.input));const cancel=new AbortController();cancel.abort();f.ctx.signal=cancel.signal;await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx),e=>e.code==='TENSOR_CANCELLED');assert.deepEqual(f.calls(),{gpuCalls:0,cpuCalls:0});});
test('disabled fallback preserves the resource failure',async()=>{const f=fixture(async()=>{throw new TensorError('GPU_ALLOCATION_FAILED');});f.ctx.allowCpuFallback=false;await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx),e=>e.code==='GPU_ALLOCATION_FAILED');assert.equal(f.calls().cpuCalls,0);});
test('fallback uses preserved input not a backend-mutated copy',async()=>{const f=fixture(async t=>{t.input.A[0]=999;throw new TensorError('GPU_DEVICE_LOST');});const r=await f.d.dispatch({type:'TENSOR',input:input()},f.ctx);assert.deepEqual([...r.result],[0,29,19,65]);});
test('reference method is mandatory',async()=>{const f=fixture(async t=>cpuTensorReference(t.input));delete f.ctx.verify;await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx),e=>e.code==='TENSOR_REFERENCE_REQUIRED');assert.deepEqual(f.calls(),{gpuCalls:0,cpuCalls:0});});
test('successful GPU attempt is checked and hashed',async()=>{const f=fixture(async t=>cpuTensorReference(t.input));const r=await f.d.dispatch({type:'TENSOR',input:input()},f.ctx);assert.equal(r.backend,'WEBGPU');assert.match(r.sha256,/^[a-f0-9]{64}$/);assert.equal(r.verification.valid,true);assert.equal(r.routingAuthority,'EXPLICIT_POLICY_NOT_FORMULA');assert.equal(f.calls().cpuCalls,0);});
test('shared mutable inputs cannot masquerade as stable snapshots',()=>{const x=input();x.A=new Float32Array(new SharedArrayBuffer(24));assert.throws(()=>snapshotTensor(x));});
test('unclassified errors are not treated as resource exhaustion',async()=>{const f=fixture(async()=>{throw Error('GPU_DEVICE_LOST');});await assert.rejects(()=>f.d.dispatch({type:'TENSOR',input:input()},f.ctx));assert.equal(f.calls().cpuCalls,0);});
