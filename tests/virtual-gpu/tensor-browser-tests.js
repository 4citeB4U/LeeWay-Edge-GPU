/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.TENSOR_BROWSER.G2
WHAT: Real-device tensor and CPU-worker recovery tests. WHY: Distinguish hardware execution from injected unit faults.
WHO: Agent Lee. WHERE: Isolated existing GPU qualification browser. WHEN: Explicit test run.
HOW: Fixed data, real shader/readback, destroy only a test-owned device, scalar comparison. LICENSE: MIT
*/
import {prepareTensorTask} from '../../dispatch/tensor.dispatch.mjs';
import {TENSOR_OPERATION} from '../../dispatch/tensor-contract.mjs';
import {tensorGemmWGSL} from '../../shaders/tensor-gemm.wgsl.js';
import {cpuTensor} from '../../fallback/cpu.engine.js';
import {cpuTensorReference,compareTensorResults} from '../../fallback/tensor-reference.mjs';
import {HybridDispatcher} from '../../core/hybrid.dispatcher.js';
import {getBufferPoolStats,clearBufferPool} from '../../buffers/buffer.pool.js';
const assert=(v,s)=>{if(!v)throw Error(s);};
const rejects=async(fn,code)=>{try{await fn();}catch(e){if(code)assert(e.code===code,'Expected '+code+' got '+(e.code||e.message));return;}throw Error('Expected rejection');};
const data=(m,k,n,activation='identity')=>({operation:TENSOR_OPERATION,m,k,n,activation,
 A:Float32Array.from({length:m*k},(_,i)=>(i%17-8)/8),B:Float32Array.from({length:k*n},(_,i)=>(i%13-6)/8),bias:Float32Array.from({length:n},(_,i)=>(i%5-2)/4)});
function configuration(device,{budget,controller}={}){
 let cpuCalls=0;
 const dispatcher=new HybridDispatcher({webgpu:{run:(t,c)=>prepareTensorTask(device,t.input,{memoryBudgetBytes:budget,signal:c.signal}).run()},cpu:{run:(t,c)=>{cpuCalls++;return cpuTensor(t.input,{signal:c.signal});}}});
 return {dispatcher,cpuCalls:()=>cpuCalls,ctx:{capability:'WEBGPU',allowCpuFallback:true,controller:controller||{approve:async()=>true},verify:async(actual,t)=>compareTensorResults(actual,cpuTensorReference(t))}};
}
export async function runTensorBrowserTests(device,test){
 await test('TENSOR_FIXED_SHADER_COMPILES',async()=>{const r=await device.createShaderModule({code:tensorGemmWGSL}).getCompilationInfo();const errors=[...r.messages].filter(m=>m.type==='error');assert(!errors.length,errors.map(e=>e.message).join('\n'));return {kernel:'tile8_fused_bias_relu',hardwareInstructions:'NOT_CLAIMED'};});
 for(const [m,k,n]of [[1,1,1],[3,5,7],[9,7,17],[17,19,5],[32,16,48],[64,64,64]])for(const activation of ['identity','relu']){
  await test(`TENSOR_GPU_${m}_${k}_${n}_${activation}`,async()=>{
   const input=data(m,k,n,activation),expected=cpuTensorReference(input);const start=performance.now();
   const actual=await prepareTensorTask(device,input).run();const ms=performance.now()-start;
   const result=compareTensorResults(actual,expected);assert(result.valid,JSON.stringify(result));
   return {...result,m,k,n,activation,dispatchReadbackMs:ms,submissions:1,measurement:'HOST_INTERVAL_NOT_GPU_TIMESTAMP',backend:'REAL_WEBGPU'};
  });
 }
 await test('TENSOR_HYBRID_SUCCESS_CHECKED_AND_HASHED',async()=>{const f=configuration(device);const r=await f.dispatcher.dispatch({type:'TENSOR',input:data(9,7,17,'relu')},f.ctx);assert(r.backend==='WEBGPU'&&f.cpuCalls()===0,'Wrong route');assert(r.verification.valid&&/^[a-f0-9]{64}$/.test(r.sha256),'Missing result proof');return {backend:r.backend,sha256:r.sha256,attempts:r.attempts,verification:r.verification};});
 await test('TENSOR_REAL_DEVICE_RELEASE_RECOVERS_TO_CPU',async()=>{
  const adapter=await navigator.gpu.requestAdapter();assert(adapter,'Test adapter unavailable');const owned=await adapter.requestDevice();
  try{
   const input=data(17,19,5,'relu');const before=await prepareTensorTask(owned,input).run();assert(compareTensorResults(before,cpuTensorReference(input)).valid,'Pre-release hardware test failed');
   owned.destroy();const lost=await owned.lost;
   const f=configuration(owned);const r=await f.dispatcher.dispatch({type:'TENSOR',input},f.ctx);
   assert(r.backend==='CPU'&&r.recoveredFrom==='GPU_DEVICE_LOST'&&f.cpuCalls()===1,'Recovery failed');
   return {fault:'INTENTIONAL_RELEASE_OF_TEST_OWNED_GPUDEVICE',systemDriverChanged:false,lossReason:lost.reason,backend:r.backend,attempts:r.attempts,verification:r.verification};
  }finally{owned.destroy();}
 });
 await test('TENSOR_NO_DEVICE_RECOVERS_TO_CPU_WORKER',async()=>{const f=configuration(null);const r=await f.dispatcher.dispatch({type:'TENSOR',input:data(3,5,7)},f.ctx);assert(r.backend==='CPU'&&r.recoveredFrom==='GPU_UNAVAILABLE','No-device recovery failed');return {backend:r.backend,verification:r.verification};});
 await test('TENSOR_EXPLICIT_MEMORY_BUDGET_RECOVERS_WITHOUT_OVERSUBSCRIPTION',async()=>{const f=configuration(device,{budget:16});const r=await f.dispatcher.dispatch({type:'TENSOR',input:data(9,7,17)},f.ctx);assert(r.backend==='CPU'&&r.recoveredFrom==='GPU_BUDGET_EXCEEDED','Budget recovery failed');return {backend:r.backend,reason:r.recoveredFrom,policy:'CALLER_BYTE_BUDGET_NOT_PHYSICAL_VRAM_MEASUREMENT'};});
 await test('TENSOR_DENIED_ADMISSION_STARTS_NO_CPU_WORKER',async()=>{const f=configuration(null,{controller:{approve:async()=>false}});await rejects(()=>f.dispatcher.dispatch({type:'TENSOR',input:data(3,5,7)},f.ctx));assert(f.cpuCalls()===0,'Denial bypassed');});
 await test('TENSOR_CPU_WORKER_CANCELLED',async()=>{const abort=new AbortController();const promise=cpuTensor(data(256,256,256),{signal:abort.signal});abort.abort();await rejects(()=>promise,'TENSOR_CANCELLED');return {workerTermination:'CODE_PATH_EXECUTED_AFTER_ABORT',inputDiscarded:true};});
 await test('TENSOR_INVALID_DATA_NEVER_FALLS_BACK',async()=>{const f=configuration(null);const input=data(3,5,7);input.A[0]=NaN;await rejects(()=>f.dispatcher.dispatch({type:'TENSOR',input},f.ctx),'TENSOR_INPUT_INVALID');assert(f.cpuCalls()===0,'Invalid input replayed');});
 await test('TENSOR_REFERENCE_MISMATCH_NEVER_FALLS_BACK',async()=>{const f=configuration(device);f.ctx.verify=async()=>({valid:false,method:'INTENTIONALLY_REJECTED_REFERENCE'});await rejects(()=>f.dispatcher.dispatch({type:'TENSOR',input:data(3,5,7)},f.ctx),'TENSOR_REFERENCE_MISMATCH');assert(f.cpuCalls()===0,'Incorrect output hidden with fallback');});
 await test('TENSOR_NONBINARY_FLOATS_MATCH_REFERENCE_TOLERANCE',async()=>{const x=data(13,37,11,'relu');for(let i=0;i<x.A.length;i++)x.A[i]=(i%19-9)*0.013;for(let i=0;i<x.B.length;i++)x.B[i]=(i%23-11)*0.017;const actual=await prepareTensorTask(device,x).run();const comparison=compareTensorResults(actual,cpuTensorReference(x));assert(comparison.valid,'Nonbinary result mismatch');return comparison;});
 await test('TENSOR_ALL_GPU_LEASES_RETURNED',()=>{const stats=getBufferPoolStats(device);assert(stats.leasedBytes===0,'Leaked active tensor lease');clearBufferPool(device);assert(getBufferPoolStats(device).allocatedBytes===0,'Explicit release failed');return {beforeRelease:stats,afterRelease:getBufferPoolStats(device)};});
}
