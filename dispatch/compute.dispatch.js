/*
REGION: LEEWAY.EDGE_GPU.DISPATCH
TAG: LEEWAY.EDGE_GPU.MATMUL_DISPATCH.G0
WHAT: Validated existing matrix operation with bounded resource lifecycle.
WHY: Invalid inputs, device errors and exceptions must not leak leases or claim success.
WHO: Creator-authorized Agent Lee. WHERE: Existing GPU dispatcher.
WHEN: Explicit admitted task execution. HOW: Snapshot, serialize device scope, dispatch, read, clean.
LICENSE: MIT
*/
import {getPipeline,clearPipelineCache} from '../pipeline/pipeline.cache.js';
import {getBuffer,releaseBuffer,discardBuffer} from '../buffers/buffer.pool.js';
import {matmulWGSL} from '../shaders/matmul.wgsl.js';
const tails=new WeakMap();
export function withDeviceSequence(device,fn){
 const previous=tails.get(device)||Promise.resolve();const next=previous.catch(()=>{}).then(fn);
 tails.set(device,next.catch(()=>{}));return next;
}
export function prepareMatMulTask(device,matA,matB,size){
 if(!device||typeof device.createBuffer!=='function')throw new TypeError('GPU_DEVICE_REQUIRED');
 if(!Number.isSafeInteger(size)||size<1||size>65535)throw new RangeError('MATMUL_SIZE_INVALID');
 const length=size*size,bytes=length*4;
 if(!(matA instanceof Float32Array)||!(matB instanceof Float32Array)||matA.length!==length||matB.length!==length)throw new TypeError('MATMUL_INPUT_SHAPE_INVALID');
 if(!matA.every(Number.isFinite)||!matB.every(Number.isFinite))throw new TypeError('MATMUL_NON_FINITE_INPUT');
 const maximum=Math.min(device.limits.maxBufferSize,device.limits.maxStorageBufferBindingSize,64*1024*1024);
 if(bytes>maximum||Math.ceil(size/8)>device.limits.maxComputeWorkgroupsPerDimension)throw new RangeError('MATMUL_DEVICE_BUDGET_EXCEEDED');
 const A=matA.slice(),B=matB.slice();
 return {TAG:'LEEWAY.COMPUTE.MATMUL.EXEC',REGION:'L7_EXECUTION_FABRIC',metadata:{size},
 run:()=>withDeviceSequence(device,async()=>{
  const leased=[];let uniform,read,result,failure;
  for(const filter of ['out-of-memory','internal','validation'])device.pushErrorScope(filter);
  try{
   const usage=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC;
   for(let i=0;i<3;i++)leased.push(getBuffer(device,bytes,usage));
   if(new Set(leased).size!==3)throw new Error('MATMUL_BUFFER_ALIAS');
   const [a,b,c]=leased;
   uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
   device.queue.writeBuffer(uniform,0,new Uint32Array([size,0,0,0]));
   device.queue.writeBuffer(a,0,A);device.queue.writeBuffer(b,0,B);
   const pipeline=getPipeline(device,'matmul_tiled8',matmulWGSL);
   const bindings=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
    {binding:0,resource:{buffer:a}},{binding:1,resource:{buffer:b}},
    {binding:2,resource:{buffer:c}},{binding:3,resource:{buffer:uniform}}
   ]});
   const encoder=device.createCommandEncoder();const pass=encoder.beginComputePass();
   pass.setPipeline(pipeline);pass.setBindGroup(0,bindings);pass.dispatchWorkgroups(Math.ceil(size/8),Math.ceil(size/8));pass.end();
   read=device.createBuffer({size:bytes,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
   encoder.copyBufferToBuffer(c,0,read,0,bytes);device.queue.submit([encoder.finish()]);
   await read.mapAsync(GPUMapMode.READ);
   result=new Float32Array(read.getMappedRange()).slice();read.unmap();
   if(!result.every(Number.isFinite))throw new Error('MATMUL_NON_FINITE_RESULT');
  }catch(error){failure=error;}
  finally{
   for(let i=0;i<3;i++){
    try{const error=await device.popErrorScope();if(error&&!failure)failure=new Error(error.message);}catch(error){failure??=error;}
   }
   try{read?.destroy();}catch{}try{uniform?.destroy();}catch{}
   for(const buffer of leased){if(failure)discardBuffer(buffer);else releaseBuffer(buffer);}
   if(failure)clearPipelineCache(device);
  }
  if(failure)throw failure;return result;
 })};
}
