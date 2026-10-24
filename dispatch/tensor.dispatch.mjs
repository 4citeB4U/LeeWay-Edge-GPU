/*
REGION: LEEWAY.EDGE_GPU.DISPATCH
TAG: LEEWAY.EDGE_GPU.TENSOR_DISPATCH.G2
WHAT: Execute the fixed tensor contract on an explicitly supplied GPUDevice.
WHY: Preserve typed resource failures, bounded allocation and real readback for failover.
WHO: Creator-authorized Agent Lee. WHERE: Existing Edge GPU compute path, not a driver.
WHEN: After admission. HOW: Reuse pool/cache/device sequence; one fused kernel; clean every lease.
ROLES: EXECUTE VERIFY. LICENSE: MIT
*/
import {withDeviceSequence} from './compute.dispatch.js';
import {getBuffer,releaseBuffer,discardBuffer} from '../buffers/buffer.pool.js';
import {getPipeline,clearPipelineCache} from '../pipeline/pipeline.cache.js';
import {tensorGemmWGSL} from '../shaders/tensor-gemm.wgsl.js';
import {snapshotTensor,tensorWorkingBytes,TensorError,requireNotCancelled} from './tensor-contract.mjs';
const monitors=new WeakMap();
function monitor(device){
 let value=monitors.get(device);
 if(!value){value={lost:false};value.event=device.lost.then(info=>{value.lost=true;value.reason=info.reason;return info;});monitors.set(device,value);}
 return value;
}
export function prepareTensorTask(device,input,{memoryBudgetBytes=32*1024*1024,signal}={}){
 const t=snapshotTensor(input);
 if(!Number.isSafeInteger(memoryBudgetBytes)||memoryBudgetBytes<0)throw new TensorError('TENSOR_INPUT_INVALID','memory budget');
 return {TAG:'LEEWAY.COMPUTE.TENSOR.EXEC',run:async()=>{
  requireNotCancelled(signal);
  if(!device||typeof device.createBuffer!=='function')throw new TensorError('GPU_UNAVAILABLE');
  const state=monitor(device);
  if(state.lost)throw new TensorError('GPU_DEVICE_LOST');
  const sizes=[t.A.byteLength,t.B.byteLength,t.m*t.n*4,t.bias.byteLength];
  if(tensorWorkingBytes(t)>memoryBudgetBytes||sizes.some(b=>b>Math.min(device.limits.maxBufferSize,device.limits.maxStorageBufferBindingSize))||Math.ceil(t.n/8)>device.limits.maxComputeWorkgroupsPerDimension||Math.ceil(t.m/8)>device.limits.maxComputeWorkgroupsPerDimension)throw new TensorError('GPU_BUDGET_EXCEEDED');
  return withDeviceSequence(device,async()=>{
   requireNotCancelled(signal);if(state.lost)throw new TensorError('GPU_DEVICE_LOST');
   const leased=[];let params,read,result,failure;
   for(const filter of ['out-of-memory','internal','validation'])device.pushErrorScope(filter);
   try{
    const usage=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST;
    for(const size of sizes)leased.push(getBuffer(device,size,usage));
    if(new Set(leased).size!==4)throw new TensorError('GPU_RESOURCE_ALIAS');
    const [a,b,y,bias]=leased;
    params=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    device.queue.writeBuffer(params,0,new Uint32Array([t.m,t.k,t.n,t.activation==='relu'?1:0]));
    device.queue.writeBuffer(a,0,t.A);device.queue.writeBuffer(b,0,t.B);device.queue.writeBuffer(bias,0,t.bias);
    const pipeline=getPipeline(device,'tensor-gemm-tile8-v1',tensorGemmWGSL);
    const bindings=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
     {binding:0,resource:{buffer:a}},{binding:1,resource:{buffer:b}},{binding:2,resource:{buffer:y}},
     {binding:3,resource:{buffer:bias}},{binding:4,resource:{buffer:params}}
    ]});
    const encoder=device.createCommandEncoder();const pass=encoder.beginComputePass();
    pass.setPipeline(pipeline);pass.setBindGroup(0,bindings);pass.dispatchWorkgroups(Math.ceil(t.n/8),Math.ceil(t.m/8));pass.end();
    read=device.createBuffer({size:sizes[2],usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    encoder.copyBufferToBuffer(y,0,read,0,sizes[2]);device.queue.submit([encoder.finish()]);
    await Promise.race([read.mapAsync(GPUMapMode.READ),state.event.then(()=>{throw new TensorError('GPU_DEVICE_LOST');})]);
    requireNotCancelled(signal);if(state.lost)throw new TensorError('GPU_DEVICE_LOST');
    result=new Float32Array(read.getMappedRange()).slice();read.unmap();
    if(!result.every(Number.isFinite))throw new TensorError('TENSOR_RESULT_INVALID');
   }catch(error){failure=error;}
   finally{
    for(let i=0;i<3;i++){
     try{const error=await device.popErrorScope();if(error){
      if(globalThis.GPUOutOfMemoryError&&error instanceof GPUOutOfMemoryError)failure=new TensorError('GPU_ALLOCATION_FAILED');
      else failure??=new TensorError('GPU_VALIDATION_FAILED',error.message);
     }}catch(error){failure??=error;}
    }
    if(state.lost)failure=new TensorError('GPU_DEVICE_LOST');
    try{read?.destroy();}catch{}try{params?.destroy();}catch{}
    for(const buffer of leased){if(failure)discardBuffer(buffer);else releaseBuffer(buffer);}
    if(failure)clearPipelineCache(device);
   }
   requireNotCancelled(signal);if(failure)throw failure;return result;
  });
 }};
}
