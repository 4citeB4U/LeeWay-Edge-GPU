/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.APPLICATION_STAGE_ATTRIBUTION.G4
WHAT: Attribute the actual fixed tensor path's latency without rewriting its implementation.
WHY: Separate GPU arithmetic from browser scheduling, copies, verification and rendering contention.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS VERIFY.
WHERE: Isolated real application page. WHEN: Explicit diagnostic after ordinary comparison.
HOW: Temporary method timing, optional standard timestamp queries, matched render-contention ablation.
LICENSE: MIT. Suppressed rendering is a diagnostic only, never an application-speedup claim.
*/
export async function attributeApplicationStages({id,pack,reference,nativeTransform,renderOwner}){
 const {prepareTensorTask}=await import('/__leeway/dispatch/tensor.dispatch.mjs');
 const {HybridDispatcher}=await import('/__leeway/core/hybrid.dispatcher.js');
 const {cpuTensorReference,compareTensorResults}=await import('/__leeway/fallback/tensor-reference.mjs');
 const {clearBufferPool}=await import('/__leeway/buffers/buffer.pool.js');
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const median=a=>{const x=a.slice().sort((a,b)=>a-b);return x.length%2?x[(x.length-1)/2]:(x[x.length/2-1]+x[x.length/2])/2;};
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw Error('ATTRIBUTION_ADAPTER_UNAVAILABLE');
 const hasTimestamps=adapter.features.has('timestamp-query');
 const device=await adapter.requestDevice({requiredFeatures:hasTimestamps?['timestamp-query']:[]});
 const initialInput=pack(),floatReference=Float32Array.from(reference),floatCpu=cpuTensorReference(initialInput);
 let maxCpuFloatError=0;
 for(let i=0;i<reference.length;i++)maxCpuFloatError=Math.max(maxCpuFloatError,Math.abs(floatCpu[i]-reference[i]));
 const report={scope:'DIAGNOSTIC_STAGE_ATTRIBUTION_NOT_NORMAL_APPLICATION_PERFORMANCE',adapter:{vendor:adapter.info.vendor,architecture:adapter.info.architecture},
  timestampQuerySupported:hasTimestamps,normalKernelUnchanged:true,inputShape:[initialInput.m,initialInput.k,initialInput.n],
  cpuResultWithFloat32InputsMaxErrorVsNativeDouble:maxCpuFloatError,stagesNestedNotAdditive:true,trials:[]};
 const oldRender=renderOwner.render,oldDigest=crypto.subtle.digest;
 let suppress=false,sample=null,queryEnabled=false,queries,queryResolve,queryRead;
 const originalCreateBuffer=device.createBuffer.bind(device),originalCreateEncoder=device.createCommandEncoder.bind(device);
 const originalPop=device.popErrorScope.bind(device),originalWrite=device.queue.writeBuffer.bind(device.queue);
 const originalSubmit=device.queue.submit.bind(device.queue);
 const add=(key,n)=>{if(sample)sample[key]=(sample[key]||0)+n;};
 const timedAsync=(fn,key)=>async(...args)=>{const target=sample,start=performance.now();try{return await fn(...args);}finally{if(target)target[key]=(target[key]||0)+performance.now()-start;}};
 renderOwner.render=function(...args){if(suppress){add('suppressedRenderCalls',1);return;}const t=performance.now();try{return oldRender.apply(this,args);}finally{add('renderCallsWhileAwaiting',1);add('renderCallWallMsWhileAwaiting',performance.now()-t);}};
 crypto.subtle.digest=timedAsync(oldDigest.bind(crypto.subtle),'digestAwaitMs');
 device.popErrorScope=timedAsync(originalPop,'popErrorScopeAwaitMs');
 device.queue.writeBuffer=(...args)=>{const t=performance.now();try{return originalWrite(...args);}finally{add('writeBufferHostMs',performance.now()-t);add('writeBufferCalls',1);}};
 device.queue.submit=(...args)=>{const t=performance.now();try{return originalSubmit(...args);}finally{add('submitHostMs',performance.now()-t);}};
 device.createBuffer=descriptor=>{const t=performance.now(),b=originalCreateBuffer(descriptor);add('createBufferHostMs',performance.now()-t);add('createdBufferBytes',descriptor.size);
  const map=b.mapAsync.bind(b);b.mapAsync=timedAsync(map,'outputMapAwaitMs');return b;};
 if(hasTimestamps){
  queries=device.createQuerySet({type:'timestamp',count:2});
  queryResolve=originalCreateBuffer({size:256,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC});
  queryRead=originalCreateBuffer({size:16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
  device.createCommandEncoder=(...args)=>{
   const e=originalCreateEncoder(...args),begin=e.beginComputePass.bind(e),finish=e.finish.bind(e);let used=false;
   e.beginComputePass=(desc={})=>{if(queryEnabled){used=true;return begin({...desc,timestampWrites:{querySet:queries,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1}});}return begin(desc);};
   e.finish=(...a)=>{if(used){e.resolveQuerySet(queries,0,2,queryResolve,0);e.copyBufferToBuffer(queryResolve,0,queryRead,0,16);}return finish(...a);};
   return e;
  };
 }
 const dispatcher=new HybridDispatcher({webgpu:{run:async(task,ctx)=>{
  const t=performance.now();const prepared=prepareTensorTask(device,task.input,{signal:ctx.signal});add('prepareTaskValidationCopyMs',performance.now()-t);
  const started=performance.now();try{return await prepared.run();}finally{add('backendRunAwaitMs',performance.now()-started);}
 }}});
 const ctx={capability:'WEBGPU',allowCpuFallback:false,controller:{approve:async()=>{add('admissionCalls',1);return true;}},verify:async actual=>{
  const started=performance.now();try{return compareTensorResults(actual,floatReference,{absoluteTolerance:id==='maps'?2:0.0001,relativeTolerance:1e-5});}finally{add('verificationHostMs',performance.now()-started);}
 }};
 try{
  // Warm the real pipeline and buffer pool before stage attribution.
  for(let i=0;i<2;i++)await dispatcher.dispatch({type:'TENSOR',input:pack()},ctx);
  for(const mode of ['ACTIVE','SUPPRESSED_DIAGNOSTIC','SUPPRESSED_DIAGNOSTIC','ACTIVE']){
   suppress=mode!=='ACTIVE';await wait(250);
   for(let trial=0;trial<4;trial++){
    sample={mode,trial,renderCallsWhileAwaiting:0,renderCallWallMsWhileAwaiting:0,outputMapAwaitMs:0,popErrorScopeAwaitMs:0,digestAwaitMs:0};
    const start=performance.now(),packStart=performance.now(),input=pack();sample.packMs=performance.now()-packStart;
    queryEnabled=hasTimestamps;
    const result=await dispatcher.dispatch({type:'TENSOR',input},ctx);queryEnabled=false;
    sample.checkedRoundtripMs=performance.now()-start;
    sample.resultSha256=result.sha256;sample.referenceValid=result.verification.valid;
    let maxError=0;for(let i=0;i<reference.length;i++)maxError=Math.max(maxError,Math.abs(result.result[i]-reference[i]));sample.maxErrorAgainstNativeDouble=maxError;
    const finished=sample;sample=null;
    if(hasTimestamps){
     await queryRead.mapAsync(GPUMapMode.READ);const q=new BigUint64Array(queryRead.getMappedRange()).slice();queryRead.unmap();
     finished.gpuPassTimestampMs=Number(q[1]-q[0])/1e6;
     finished.timestampBoundary='GPU_COMPUTE_PASS_ONLY_BROWSER_QUANTIZATION_POSSIBLE_NOT_UPLOAD_OR_QUEUE_WAIT';
    }
    report.trials.push(finished);
   }
  }
  suppress=false;
  report.modes=Object.fromEntries(['ACTIVE','SUPPRESSED_DIAGNOSTIC'].map(mode=>{
   const rows=report.trials.filter(t=>t.mode===mode),keys=['checkedRoundtripMs','backendRunAwaitMs','packMs','prepareTaskValidationCopyMs','writeBufferHostMs','outputMapAwaitMs','popErrorScopeAwaitMs','verificationHostMs','digestAwaitMs','renderCallsWhileAwaiting','renderCallWallMsWhileAwaiting','gpuPassTimestampMs'];
   return [mode,Object.fromEntries(keys.map(key=>[key,median(rows.map(r=>r[key]||0))]))];
  }));
  report.claim='Rendering suppression is a causal interference test, NOT a usable rendering optimization. Normal source unchanged.';
  return report;
 }finally{
  sample=null;suppress=false;queryEnabled=false;renderOwner.render=oldRender;crypto.subtle.digest=oldDigest;
  clearBufferPool(device);queries?.destroy();queryResolve?.destroy();queryRead?.destroy();device.destroy();
 }
}
