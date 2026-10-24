/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.BROWSER_TESTS.G0
WHAT: Assertion-driven tests importing the actual GPU source. WHY: Reproduce before repair.
WHO: Agent Lee. WHERE: Isolated local browser. WHEN: Explicit test run.
HOW: Native device, compiler diagnostics, readback and negative tests. LICENSE: MIT
*/
import {runTensorBrowserTests} from './tensor-browser-tests.js';
import * as pool from '../../buffers/buffer.pool.js';
import {getPipeline} from '../../pipeline/pipeline.cache.js';
import {matmulWGSL} from '../../shaders/matmul.wgsl.js';
import {prepareMatMulTask} from '../../dispatch/compute.dispatch.js';
import {executeGPU} from '../../control/gpu.controller.bridge.js';
import {QuadPipeline} from '../../core/quad.pipeline.js';
import {cpuMatMul} from '../../fallback/cpu.engine.js';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const expectReject=async(fn,pattern)=>{try{await fn();}catch(e){if(pattern)assert(pattern.test(e.message),'Wrong error: '+e.message);return e.message;}throw Error('Expected rejection; operation was accepted.');};
export async function runTests({baseline=false}={}){
 const tests=[];const test=async(name,fn)=>{const t=performance.now();try{const evidence=await fn();tests.push({name,status:'PASS',ms:performance.now()-t,evidence:evidence??null});}catch(error){tests.push({name,status:'FAIL',ms:performance.now()-t,error:error.message});}};
 assert(navigator.gpu,'WebGPU unavailable in this browser.');
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
 assert(adapter,'No WebGPU adapter.');
 const info=adapter.info;
 const adapterRecord={vendor:info?.vendor,architecture:info?.architecture,device:info?.device,description:info?.description,isFallbackAdapter:info?.isFallbackAdapter??adapter.isFallbackAdapter??null};
 const d1=await adapter.requestDevice();const secondAdapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});assert(secondAdapter,'Second adapter unavailable');const d2=await secondAdapter.requestDevice();
 const uncaptured=[];for(const d of [d1,d2])d.addEventListener('uncapturederror',e=>uncaptured.push(e.error.message));
 try{
  await test('MATMUL_SHADER_COMPILES',async()=>{const report=await d1.createShaderModule({code:matmulWGSL}).getCompilationInfo();const errors=[...report.messages].filter(x=>x.type==='error').map(x=>x.message);assert(errors.length===0,errors.join('\n'));return {messages:[...report.messages].map(x=>({type:x.type,message:x.message}))};});
  await test('BUFFER_POOL_ISOLATES_DEVICES',async()=>{const usage=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;const a=pool.getBuffer(d1,64,usage);pool.releaseBuffer(a);const b=pool.getBuffer(d2,64,usage);assert(a!==b,'A buffer from device 1 was returned for device 2.');pool.releaseBuffer(b);return {distinct:true};});
  const code='@compute @workgroup_size(1) fn main() {}';
  await test('PIPELINE_CACHE_ISOLATES_DEVICES',async()=>{const p1=getPipeline(d1,'isolation-test',code);const p2=getPipeline(d2,'isolation-test',code);assert(p1!==p2,'A pipeline from device 1 was returned for device 2.');return {distinct:true};});
  await test('PIPELINE_CACHE_BINDS_SHADER_CONTENT',async()=>{const p1=getPipeline(d1,'source-test',code);const p2=getPipeline(d1,'source-test',code+'\n// version two');assert(p1!==p2,'A different shader reused a stale cache entry.');});
  await test('ASYNC_DENIAL_PREVENTS_EXECUTION',async()=>{let ran=false;await expectReject(()=>executeGPU({run:()=>{ran=true;}},{approve:async()=>false}));assert(!ran,'Denied task ran.');});
  await test('NON_BOOLEAN_APPROVAL_DENIED',async()=>{let ran=false;await expectReject(()=>executeGPU({run:()=>{ran=true;}},{approve:()=>({allowed:false})}));assert(!ran,'Non-boolean approval ran.');});
  await test('NO_REFERENCE_CANNOT_CLAIM_VERIFIED',async()=>{const q=new QuadPipeline({primary:{run:async()=>({id:'test',result:new Float32Array([1]),time:1})}});await expectReject(()=>q.run({metadata:{size:1}}));});
  if(tests[0].status==='PASS'){
   for(const n of [1,7,8,9,17,32,64])await test('GPU_CPU_READBACK_'+n,async()=>{
    const A=Float32Array.from({length:n*n},(_,i)=>(i%13-6)/8),B=Float32Array.from({length:n*n},(_,i)=>(i%11-5)/8);
    const expected=await cpuMatMul(A,B,n);const t=performance.now();const result=await prepareMatMulTask(d1,A,B,n).run();const duration=performance.now()-t;
    assert(result.length===expected.length,'Wrong output length');let maxError=0;
    for(let i=0;i<result.length;i++){assert(Number.isFinite(result[i]),'Non-finite output');maxError=Math.max(maxError,Math.abs(result[i]-expected[i]));}
    assert(maxError<1e-5,'Result mismatch: '+maxError);return {size:n,values:result.length,maxAbsoluteError:maxError,dispatchReadbackMs:duration,reference:'existing CPU worker'};
   });
  }else await test('GPU_READBACK_BLOCKED_BY_SHADER',()=>{throw Error('Actual shader compilation failed; GPU execution not claimed.');});
  if(!baseline){
   await test('MALFORMED_INPUT_DENIED',()=>expectReject(()=>prepareMatMulTask(d1,new Float32Array(3),new Float32Array(4),2).run()));
   await test('NONFINITE_INPUT_DENIED',()=>expectReject(()=>prepareMatMulTask(d1,new Float32Array([NaN]),new Float32Array([1]),1).run()));
   await test('VERIFIED_RESULT_HAS_REAL_SHA256',async()=>{
    const result=new Float32Array([1,2,3]);const q=new QuadPipeline({primary:{run:async()=>({id:'digest-test',result,time:1})},verifier:{verify:async()=>({valid:true,method:'independent-test-reference'})}});
    const r=await q.run({metadata:{size:1}});const expected=[...new Uint8Array(await crypto.subtle.digest('SHA-256',result))].map(x=>x.toString(16).padStart(2,'0')).join('');
    assert(r.verification.checksum==='SHA256: '+expected,'Digest is not SHA-256 of actual result bytes.');return {sha256:expected};
   });
   await test('REFERENCE_MISMATCH_REJECTED',async()=>{const q=new QuadPipeline({primary:{run:async()=>({result:new Float32Array([1]),time:1})},verifier:{verify:async()=>({valid:false,method:'independent-test-reference'})}});await expectReject(()=>q.run({metadata:{size:1}}));});
   await test('APPROVAL_EXCEPTION_PREVENTS_EXECUTION',async()=>{let ran=false;await expectReject(()=>executeGPU({run:()=>{ran=true;}},{approve:async()=>{throw Error('DENY_BY_EXCEPTION');}}),/DENY_BY_EXCEPTION/);assert(!ran,'Task ran after admission exception');});
   await test('ASYNC_APPROVAL_EXECUTES_ONCE',async()=>{let count=0;const result=await executeGPU({run:async()=>{count++;return 42;}},{approve:async()=>true});assert(count===1&&result===42,'Approval/execution mismatch');});
   await test('PREPARED_INPUT_SNAPSHOT_ISOLATED',async()=>{const A=new Float32Array([2]),B=new Float32Array([3]);const task=prepareMatMulTask(d1,A,B,1);A[0]=100;B[0]=100;const result=await task.run();assert(result[0]===6,'Inputs changed after task preparation');return {actual:result[0]};});
   await test('CONCURRENT_DISPATCHES_REMAIN_CORRECT',async()=>{const jobs=[8,17].map(async n=>{const A=Float32Array.from({length:n*n},(_,i)=>(i%7)/4),B=Float32Array.from({length:n*n},(_,i)=>(i%5)/4);const [actual,expected]=await Promise.all([prepareMatMulTask(d1,A,B,n).run(),cpuMatMul(A,B,n)]);assert(actual.every((v,i)=>Number.isFinite(v)&&Math.abs(v-expected[i])<1e-5),'Concurrent result mismatch');return n;});return {verifiedSizes:await Promise.all(jobs)};});
   await test('BUFFER_LEASES_RETURNED_AFTER_EXECUTION',()=>{const stats=pool.getBufferPoolStats(d1);assert(stats.leasedBytes===0,'GPU buffer lease leaked');return stats;});
   await runTensorBrowserTests(d1,test);
   await test('NO_UNCAPTURED_GPU_ERRORS',()=>{assert(uncaptured.length===0,uncaptured.join('\n'));});
  }
 }finally{d1.destroy();d2.destroy();}
 return {adapter:adapterRecord,tests,uncaptured,scope:'GPU module qualification; not a system graphics-driver qualification',formula:'NOT_EXECUTED',ldwmd:'NOT_BOUND'};
}
