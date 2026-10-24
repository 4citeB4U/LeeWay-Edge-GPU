/*
REGION: LEEWAY.EDGE_GPU.DISPATCH
TAG: LEEWAY.EDGE_GPU.MODEL_OPERATOR_ENCODER.G8
WHAT: Encode the fixed LeeWay transformer operators on one admitted GPUDevice.
WHY: Keep activations on-device; avoid one blocking host roundtrip per model operation.
WHO: Creator-authorized Agent Lee. ROLES: EXECUTE VERIFY.
WHERE: Existing GPU dispatcher, buffer pool and pipeline cache; not another memory authority.
WHEN: Explicit bounded model session. HOW: Budgeted leases, fixed shaders, validated shapes, scoped errors and readback.
LICENSE: MIT. No native/cloud model execution and no silent CPU math fallback.
*/
import {getBuffer,discardBuffer,clearBufferPool} from '../buffers/buffer.pool.js';
import {getPipeline,clearPipelineCache} from '../pipeline/pipeline.cache.js';
import {dequantizeWGSL,quantizedMatVecWGSL} from '../shaders/quantized-weights.wgsl.mjs';
import {rmsWGSL,elementWGSL,ropeWGSL,kvWriteWGSL,attentionWGSL,argmaxWGSL} from '../shaders/model-operators.wgsl.mjs';
const integer=(v,min,max,name)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('MODEL_'+name+'_INVALID');return v;};
export class ModelOperatorEncoder{
 constructor(device,{memoryBudgetBytes=512*1024*1024,allocationLease=null}={}){
  if(!device?.createBuffer)throw Error('MODEL_GPU_DEVICE_REQUIRED');
  if(allocationLease&&(allocationLease.owner!=='LEEWAY_DEVICE_WORKING_MEMORY_DATABASE'||typeof allocationLease.acquireBuffer!=='function'||typeof allocationLease.releaseBuffer!=='function'))throw Error('MODEL_LDWMD_LEASE_INVALID');
  this.allocationLease=allocationLease;this.device=device;this.budget=integer(memoryBudgetBytes,1024,4*1024*1024*1024,'MEMORY_BUDGET');
  this.leases=new Map();this.liveBytes=0;this.peakBytes=0;this.dispatches=0;this.lost=false;this.closed=false;
  device.lost.then(()=>{this.lost=true;});
  this.dummy=this.allocate(4);device.queue.writeBuffer(this.dummy,0,new Float32Array([1]));
 }
 allocate(bytes,usage=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC){
  if(this.closed||this.lost)throw Error('MODEL_GPU_DEVICE_UNAVAILABLE');
  bytes=Math.ceil(integer(bytes,1,Math.min(this.device.limits.maxBufferSize,this.device.limits.maxStorageBufferBindingSize),'BUFFER_BYTES')/4)*4;
  if(this.liveBytes+bytes>this.budget)throw Error('MODEL_MEMORY_BUDGET_EXCEEDED');
  const b=this.allocationLease?this.allocationLease.acquireBuffer({device:this.device,bytes,usage}):getBuffer(this.device,bytes,usage);if(!b||typeof b.then==='function'||b.size!==bytes||this.leases.has(b))throw Error('MODEL_LDWMD_BUFFER_LEASE_INVALID');this.leases.set(b,bytes);this.liveBytes+=bytes;this.peakBytes=Math.max(this.peakBytes,this.liveBytes);return b;
 }
 upload(bytes,usage){const data=bytes instanceof ArrayBuffer?new Uint8Array(bytes):new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength);const b=this.allocate(data.byteLength,usage);if(data.byteLength%4){const padded=new Uint8Array(Math.ceil(data.byteLength/4)*4);padded.set(data);this.device.queue.writeBuffer(b,0,padded);}else this.device.queue.writeBuffer(b,0,data);return b;}
 free(b){if(this.leases.has(b)){this.liveBytes-=this.leases.get(b);this.leases.delete(b);if(this.allocationLease)this.allocationLease.releaseBuffer(b);else discardBuffer(b);}}
 begin(){if(this.closed||this.lost)throw Error('MODEL_GPU_DEVICE_UNAVAILABLE');for(const f of ['out-of-memory','internal','validation'])this.device.pushErrorScope(f);return {encoder:this.device.createCommandEncoder(),temporary:[],commands:0};}
 parameter(batch,values,floats=[]){const raw=new ArrayBuffer(Math.ceil(values.length/4)*16),u=new Uint32Array(raw),f=new Float32Array(raw);values.forEach((v,i)=>{if(floats.includes(i))f[i]=v;else u[i]=v;});const b=this.upload(raw,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);batch.temporary.push(b);return b;}
 dispatch(batch,key,code,buffers,groups){
  integer(groups,1,this.device.limits.maxComputeWorkgroupsPerDimension,'WORKGROUPS');
  const pipeline=getPipeline(this.device,key,code);const bindings=this.device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:buffers.map((buffer,binding)=>({binding,resource:{buffer}}))});
  const p=batch.encoder.beginComputePass();p.setPipeline(pipeline);p.setBindGroup(0,bindings);p.dispatchWorkgroups(groups);p.end();batch.commands++;this.dispatches++;
 }
 decode(batch,packed,type,output,count,offset=0){integer(count,1,262144,'DECODE_COUNT');this.dispatch(batch,'model-decode-'+type,dequantizeWGSL(type),[packed,output,this.parameter(batch,[count,offset,0,0])],Math.ceil(count/128));}
 matvec(batch,packed,type,input,output,columns,rows,{rowOffset=0,outputOffset=0}={}){
  integer(columns,1,32768,'MATRIX_COLUMNS');integer(rows,1,65535,'MATRIX_ROWS');
  this.dispatch(batch,'model-matvec-'+type,quantizedMatVecWGSL(type),[packed,input,output,this.parameter(batch,[columns,rows,rowOffset,outputOffset])],rows);
 }
 norm(batch,input,weight,output,n,{groups=1,epsilon=1e-6,inputScale=1,offset=0}={}){
  integer(n,1,32768,'NORM_DIMENSION');integer(groups,1,256,'NORM_GROUPS');
  if(!Number.isFinite(epsilon)||epsilon<=0||!Number.isFinite(inputScale))throw Error('MODEL_NORM_PARAMETERS_INVALID');
  this.dispatch(batch,'model-rms',rmsWGSL,[input,weight||this.dummy,output,this.parameter(batch,[n,groups,weight?1:0,offset,epsilon,inputScale,0,0],[4,5])],groups);
 }
 element(batch,a,b,output,n,op,{aOffset=0,bOffset=0,scale=1,broadcast=false}={}){
  integer(n,1,1048576,'ELEMENT_COUNT');integer(op,0,6,'ELEMENT_OP');if(!Number.isFinite(scale))throw Error('MODEL_SCALE_INVALID');
  this.dispatch(batch,'model-element',elementWGSL,[a,b||this.dummy,output,this.parameter(batch,[n,op,aOffset,bOffset,scale,broadcast?1:0,0,0],[4])],Math.ceil(n/128));
 }
 rope(batch,input,output,dim,heads,position,base,{factors=null,rotary=dim}={}){
  integer(dim,2,512,'HEAD_DIM');integer(heads,1,128,'HEADS');integer(position,0,255,'POSITION');
  if(dim%2||rotary%2||rotary>dim||!Number.isFinite(base)||base<=0)throw Error('MODEL_ROPE_PARAMETERS_INVALID');
  this.dispatch(batch,'model-rope',ropeWGSL,[input,factors||this.dummy,output,this.parameter(batch,[dim,heads,position,rotary,base,factors?1:0,0,0],[4])],Math.ceil(dim*heads/128));
 }
 storeKV(batch,k,v,keys,values,width,position){this.dispatch(batch,'model-kv-write',kvWriteWGSL,[k,v,keys,values,this.parameter(batch,[width,position,0,0])],Math.ceil(width/128));}
 attention(batch,q,keys,values,output,{dim,heads,kvHeads,tokens,start=0,scale=1}){
  integer(tokens,1,256,'CONTEXT_TOKENS');integer(start,0,tokens-1,'ATTENTION_START');if(heads%kvHeads)throw Error('MODEL_HEAD_GROUP_INVALID');
  this.dispatch(batch,'model-attention',attentionWGSL,[q,keys,values,output,this.parameter(batch,[dim,heads,kvHeads,tokens,start,0,scale,0],[6])],heads);
 }
 argmax(batch,values,output,n){this.dispatch(batch,'model-argmax',argmaxWGSL,[values,output,this.parameter(batch,[n,0,0,0])],1);}
 copy(batch,source,target,bytes,sourceOffset=0,targetOffset=0){batch.encoder.copyBufferToBuffer(source,sourceOffset,target,targetOffset,bytes);}
 async finish(batch,readBuffer,byteLength){
  let staging,result,error;
  try{
   if(readBuffer){staging=this.allocate(byteLength,GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ);batch.encoder.copyBufferToBuffer(readBuffer,0,staging,0,byteLength);}
   this.device.queue.submit([batch.encoder.finish()]);
   // Pop in LIFO order immediately. All three checks complete before return, without serial awaits.
   const checks=[this.device.popErrorScope(),this.device.popErrorScope(),this.device.popErrorScope()];
   const checkTask=Promise.allSettled(checks);
   if(staging){await staging.mapAsync(GPUMapMode.READ);result=new Uint8Array(staging.getMappedRange()).slice();staging.unmap();}
   else await this.device.queue.onSubmittedWorkDone();
   const outcomes=await checkTask;
   const invalid=outcomes.find(x=>x.status==='rejected'||x.value);
   if(invalid)throw Error('MODEL_GPU_VALIDATION:'+String(invalid.reason?.message||invalid.value?.message));
   if(this.lost)throw Error('MODEL_GPU_DEVICE_LOST');return result;
  }catch(e){error=e;throw e;}
  finally{if(staging)this.free(staging);for(const b of batch.temporary)this.free(b);if(error)clearPipelineCache(this.device);}
 }
 async abort(batch){const outcomes=await Promise.allSettled([this.device.popErrorScope(),this.device.popErrorScope(),this.device.popErrorScope()]);for(const b of batch.temporary)this.free(b);return outcomes;}
 describe(){return {liveBytes:this.liveBytes,peakBytes:this.peakBytes,budgetBytes:this.budget,dispatches:this.dispatches,lost:this.lost,externalInferenceRuntime:false,neuralMath:'LEEWAY_WGSL',allocationOwner:this.allocationLease?'LDWMD_PRE_ADMITTED_BUFFER_LEASE':'DIAGNOSTIC_LOCAL_BUFFER_POOL'};}
 close(){if(this.closed)return;for(const b of [...this.leases.keys()])this.free(b);clearPipelineCache(this.device);if(!this.allocationLease)clearBufferPool(this.device);this.closed=true;}
}
