/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.APPLICATION_EXERCISE.G3
WHAT: Real app render baseline and native-vs-tensor transform fit test on live app-owned data.
WHY: Loading an accelerator is not evidence of accelerating the renderer.
WHO: Creator-authorized Agent Lee. ROLES: VERIFY.
WHERE: Isolated local Leola/Maps pages. WHEN: Explicit benchmark entry.
HOW: Preserve original rendering; observe ABBA null control; compare identical spatial transforms.
LICENSE: MIT. This is not a production renderer adapter or a canonical Veritas implementation.
*/
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const quantile=(v,p)=>{if(!v.length)return null;const x=v.slice().sort((a,b)=>a-b);return x[Math.min(x.length-1,Math.floor((x.length-1)*p))];};
const summary=v=>({samples:v.length,median:quantile(v,.5),p95:quantile(v,.95),min:v.length?Math.min(...v):null,max:v.length?Math.max(...v):null});
export async function runApplicationExercise(id,{attribution=false,softwareOnly=false}={}){
 const results={scope:'REAL_APP_RENDER_OBSERVATION_PLUS_APPLICATION_DATA_COMPONENT_TEST',application:id,formulaRouting:'NOT_EXECUTED',ldwmdProductionBinding:'NOT_USED',renderIntegration:'NOT_IMPLEMENTED'};
 let device=null,transformReuse=null;
 const target=id==='leola'?window.__world3D.renderer:window.__godsEyeView.viewer.scene;
 const original=target.render;let active=null;
 target.render=function(...args){const started=performance.now();const value=transformReuse?transformReuse.render(()=>original.apply(this,args),args[0]):original.apply(this,args);if(active){active.calls++;active.cpu.push(performance.now()-started);active.starts.push(started);}return value;};
 const prepareCamera=()=>{
  if(id!=='maps')return ()=>{};
  const c=window.__godsEyeView.viewer.camera;const position=c.position.clone(),direction=c.direction.clone(),up=c.up.clone();
  c.setView({destination:position,orientation:{direction,up}});let stop=false,raf;
  const started=performance.now();let previous=started;
  const move=t=>{if(stop)return;const dt=Math.min(t-previous,40)/1000;previous=t;c.rotateRight(dt*0.002);raf=requestAnimationFrame(move);};
  raf=requestAnimationFrame(move);
  return ()=>{stop=true;cancelAnimationFrame(raf);c.setView({destination:position,orientation:{direction,up}});};
 };
 try{
  const module=await import('/__leeway/dispatch/tensor.dispatch.mjs');
  const contract=await import('/__leeway/dispatch/tensor-contract.mjs');
  const {HybridDispatcher}=await import('/__leeway/core/hybrid.dispatcher.js');
  const {cpuTensor}=await import('/__leeway/fallback/cpu.engine.js');
  const {compareTensorResults}=await import('/__leeway/fallback/tensor-reference.mjs');
  results.renderNullControl=[];
  // ON means an actual GPUDevice is available, not an integrated accelerated renderer.
  for(const mode of ['OFF','ON','ON','OFF']){
   if(mode==='ON'&&!device&&!softwareOnly){const adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});device=await adapter?.requestDevice();results.computeAdapter=adapter?{vendor:adapter.info?.vendor,architecture:adapter.info?.architecture,isFallbackAdapter:adapter.info?.isFallbackAdapter??null}:null;}
   if(mode==='OFF'&&device){device.destroy();device=null;}
   const restoreCamera=prepareCamera();await wait(300);
   const count={calls:0,cpu:[],starts:[]};active=count;const begin=performance.now();await wait(2500);const elapsed=performance.now()-begin;active=null;restoreCamera();
   const intervals=count.starts.slice(1).map((x,i)=>x-count.starts[i]);
   results.renderNullControl.push({mode:mode==='ON'?(softwareOnly?'LEEWAY_LOADED_CPU_MODE_NO_RENDER_BINDING':'DEVICE_AVAILABLE_NO_RENDER_BINDING'):'EXISTING_RENDERER',
    elapsedMs:elapsed,renderCalls:count.calls,renderCallsPerSecond:count.calls*1000/elapsed,
    renderSubmissionCpuMs:summary(count.cpu),renderCallIntervalMs:summary(intervals),
    intervalsOver33ms:intervals.filter(x=>x>33.333).length,gpuTensorCallsInRenderer:0,
    scenario:id==='maps'?'EXISTING_GLOBE_SMALL_CAMERA_ROTATION':('EXISTING_LIBRARY_'+window.__world3D.phase.toUpperCase()+'_ANIMATION'),
    claim:'NULL_CONTROL_NOT_ACCELERATED_RENDERING'});
  }
  if(id==='leola'){
   const {createSceneTransformReuse}=await import('/__leeway/core/scene-transform-reuse.mjs');
   const world=window.__world3D;transformReuse=createSceneTransformReuse(world.scene);
   const gl=world.renderer.getContext(),width=world.renderer.domElement.width,height=world.renderer.domElement.height;
   const capture=enabled=>{
    transformReuse.setEnabled(enabled);world.renderer.render(world.scene,world.camera);
    const pixels=new Uint8Array(width*height*4);gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    const matrices=[];world.scene.traverse(o=>{if(o.matrixWorld)matrices.push(...o.matrixWorld.elements);});
    return {pixels,matrices,drawCalls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles};
   };
   const compare=name=>{
    const a=capture(false),b=capture(true);let changedBytes=0,maxChannelError=0,matrixDifferences=0,nonZeroBytes=0;for(const value of a.pixels)if(value!==0)nonZeroBytes++;
    for(let i=0;i<a.pixels.length;i++)if(a.pixels[i]!==b.pixels[i]){changedBytes++;maxChannelError=Math.max(maxChannelError,Math.abs(a.pixels[i]-b.pixels[i]));}
    for(let i=0;i<a.matrices.length;i++)if(a.matrices[i]!==b.matrices[i])matrixDifferences++;
    return {name,width,height,comparedBytes:a.pixels.length,nonZeroBytes,changedBytes,maxChannelError,matrixValues:a.matrices.length,matrixDifferences,
     sameDrawCalls:a.drawCalls===b.drawCalls,sameTriangles:a.triangles===b.triangles,
     pass:nonZeroBytes>width*height&&changedBytes===0&&matrixDifferences===0&&a.drawCalls===b.drawCalls&&a.triangles===b.triangles};
   };
   // Diagnose nondeterminism without loosening the existing zero-difference gate.
   results.sameModePixelControls=[];
   for(const enabled of [false,true,false]){
    const a=capture(enabled),b=capture(enabled);let changedBytes=0,maxChannelError=0;
    for(let i=0;i<a.pixels.length;i++)if(a.pixels[i]!==b.pixels[i]){changedBytes++;maxChannelError=Math.max(maxChannelError,Math.abs(a.pixels[i]-b.pixels[i]));}
    results.sameModePixelControls.push({mode:enabled?'CANDIDATE_VS_ITSELF':'BASELINE_VS_ITSELF',changedBytes,maxChannelError,comparedBytes:a.pixels.length});
   }
   results.renderReuseCorrectness=[compare('CURRENT_SCENE')];
   const moving=world.sailboats?.[0];
   if(moving){const old=moving.rotation.y;moving.rotation.y+=0.017;results.renderReuseCorrectness.push(compare('CHANGED_BOAT_TRANSFORM'));moving.rotation.y=old;}
   const oldX=world.camera.position.x;world.camera.position.x+=0.25;results.renderReuseCorrectness.push(compare('CHANGED_CAMERA'));world.camera.position.x=oldX;
   transformReuse.setEnabled(false);
   if(results.renderReuseCorrectness.some(x=>!x.pass)){
    results.renderReuseOutcome='REJECTED_PIXEL_OR_MATRIX_MISMATCH';
   }else{
    results.renderIntegration='REVERSIBLE_SCENE_TRANSFORM_REUSE_ONLY';
    results.renderReuseTrials=[];
    for(const mode of [false,true,true,false,false,true,true,false]){
     transformReuse.setEnabled(mode);await wait(400);
     const before=transformReuse.describe();const counts={calls:0,cpu:[],starts:[]};active=counts;
     const start=performance.now();await wait(2500);const elapsed=performance.now()-start;active=null;
     const after=transformReuse.describe(),intervals=counts.starts.slice(1).map((v,i)=>v-counts.starts[i]);
     results.renderReuseTrials.push({mode:mode?'LEEWAY_TRANSFORM_REUSE':'EXISTING_RENDERER',elapsedMs:elapsed,renderCalls:counts.calls,
      renderCallsPerSecond:counts.calls*1000/elapsed,renderSubmissionCpuMs:summary(counts.cpu),renderCallIntervalMs:summary(intervals),
      reusedTransforms:after.reused-before.reused,recomputedTransforms:after.recomputed-before.recomputed,
      drawCallsLastFrame:world.renderer.info.render.calls,trianglesLastFrame:world.renderer.info.render.triangles,
      geometryCount:world.renderer.info.memory.geometries,textureCount:world.renderer.info.memory.textures});
    }
    transformReuse.setEnabled(false);results.renderReuseOutcome='EXECUTED_LOCAL_COMPARISON';results.renderReuseStatistics=transformReuse.describe();
    results.renderReuseClaim='CPU_SCENE_MATRIX_REUSE_NOT_TENSOR_HARDWARE_OR_CANONICAL_FORMULA_ACCELERATION';
   }
  }
  if(!device&&!softwareOnly){const a=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});device=await a?.requestDevice();}
  if(!device&&!softwareOnly){results.componentFit={outcome:'BLOCKED_NO_COMPUTE_ADAPTER'};return results;}
  results.executionMode=softwareOnly?'CPU_ONLY':'HARDWARE_WEBGPU';
  let points=[],matrix,nativeTransform,description;
  if(id==='leola'){
   const world=window.__world3D;world.scene.updateMatrixWorld(true);let mesh=null;
   world.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes?.position&&(!mesh||o.geometry.attributes.position.count>mesh.geometry.attributes.position.count))mesh=o;});
   if(!mesh)throw Error('No real library geometry available');
   const pos=mesh.geometry.attributes.position;const count=Math.min(4096,pos.count);matrix=Array.from(mesh.matrixWorld.elements);
   for(let i=0;i<count;i++)points.push([pos.getX(i),pos.getY(i),pos.getZ(i)]);
   const Matrix=mesh.matrixWorld.clone();const Vec=world.camera.position.constructor;
   nativeTransform=()=>{const out=new Float64Array(count*4);const v=new Vec();for(let i=0;i<count;i++){v.set(...points[i]).applyMatrix4(Matrix);out.set([v.x,v.y,v.z,1],i*4);}return out;};
   description={source:'LIVE_LIBRARY_MESH_GEOMETRY',name:mesh.name||'(unnamed)',sourceVertexCount:pos.count,testedVertices:count,matrix:'ACTUAL_MESH_MATRIX_WORLD',units:'APP_SCENE_UNITS',accuracyTarget:0.0001};
  }else{
   const viewer=window.__godsEyeView.viewer;const Camera=viewer.camera;const Vec=Camera.position.constructor;const Matrix=Camera.viewMatrix.clone();matrix=Array.from({length:16},(_,i)=>Matrix[i]);
   const tiles=viewer.scene.globe?._surface?._tilesToRender||[];
   for(const tile of tiles.slice(0,512)){
    const r=tile.rectangle;if(!r)continue;
    for(const [lon,lat]of [[r.west,r.south],[r.east,r.south],[r.west,r.north],[r.east,r.north],[(r.west+r.east)/2,(r.south+r.north)/2]]){const p=Vec.fromRadians(lon,lat);points.push([p.x,p.y,p.z]);}
   }
   if(!points.length){results.componentFit={outcome:'BLOCKED_NO_RENDERED_GLOBE_TILES',reason:'No synthetic replacement positions generated'};return results;}
   const count=points.length,Mat=Matrix.constructor;
   nativeTransform=()=>{const out=new Float64Array(count*4),v=new Vec(),r=new Vec();for(let i=0;i<count;i++){v.x=points[i][0];v.y=points[i][1];v.z=points[i][2];Mat.multiplyByPoint(Matrix,v,r);out.set([r.x,r.y,r.z,1],i*4);}return out;};
   description={source:'BOUNDARIES_AND_CENTERS_OF_ACTUALLY_RENDERED_GLOBE_TILES',tiles:tiles.length,testedPoints:count,matrix:'ACTUAL_CAMERA_VIEW_MATRIX',units:'METERS',accuracyTarget:0.01,accuracyTargetDescription:'ONE_CENTIMETER_DIAGNOSTIC_TARGET_NOT_AN_EXISTING_PRODUCT_SLA'};
  }
  description.matrixValues=matrix;description.identityTransform=matrix.every((v,i)=>v===(i%5===0?1:0));
  results.inputSnapshotSha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({points,matrix}))))].map(v=>v.toString(16).padStart(2,'0')).join('');
  const reference=nativeTransform();const floatReference=Float32Array.from(reference);
  let gpuMaxError=0,cpuFloatMaxError=0;for(let i=0;i<reference.length;i++)cpuFloatMaxError=Math.max(cpuFloatMaxError,Math.abs(floatReference[i]-reference[i]));
  const pack=()=>({operation:contract.TENSOR_OPERATION,m:points.length,k:4,n:4,A:Float32Array.from(points.flatMap(p=>[...p,1])),B:Float32Array.from(matrix),activation:'identity'});
  let gpuCalls=0,cpuWorkerCalls=0;
  const dispatcher=new HybridDispatcher({webgpu:{run:(t,c)=>{gpuCalls++;return module.prepareTensorTask(device,t.input,{signal:c.signal}).run();}},cpu:{run:(t,c)=>{cpuWorkerCalls++;return cpuTensor(t.input,{signal:c.signal});}}});
  const ctx={capability:softwareOnly?'CPU':'WEBGPU',allowCpuFallback:false,controller:{approve:async()=>true},verify:async actual=>compareTensorResults(actual,floatReference,{absoluteTolerance:id==='maps'?2:0.0001,relativeTolerance:1e-5})};
  const cpuTimes=[],gpuTimes=[];let gpuResult;
  // Untimed warmup includes the actual native implementation and GPU shader compilation.
  for(let i=0;i<5;i++)nativeTransform();
  const warmStart=performance.now();gpuResult=await dispatcher.dispatch({type:'TENSOR',input:pack()},ctx);const coldGpuMs=performance.now()-warmStart;
  for(let trial=0;trial<12;trial++){
   const runCpu=()=>{const start=performance.now();let result;for(let j=0;j<25;j++)result=nativeTransform();cpuTimes.push((performance.now()-start)/25);if(result.length!==reference.length)throw Error('Native result shape changed');};
   const runGpu=async()=>{const start=performance.now();gpuResult=await dispatcher.dispatch({type:'TENSOR',input:pack()},ctx);gpuTimes.push(performance.now()-start);};
   if(trial%2){await runGpu();runCpu();}else{runCpu();await runGpu();}
  }
  for(let i=0;i<reference.length;i++)gpuMaxError=Math.max(gpuMaxError,Math.abs(gpuResult.result[i]-reference[i]));
  results.componentFit={outcome:'EXECUTED',...description,coldGpuMs,nativeCpuMs:summary(cpuTimes),leewayGpuEndToEndMs:summary(gpuTimes),
   gpuToNativeTimeRatio:quantile(gpuTimes,.5)/quantile(cpuTimes,.5),gpuMaxAbsoluteErrorAgainstNativeDouble:gpuMaxError,
   outputFloat32RoundingErrorAlone:cpuFloatMaxError,accuracyTargetMet:gpuMaxError<=description.accuracyTarget,
   actualBackend:gpuResult.backend,actualGpuCalls:gpuCalls,actualCpuWorkerCalls:cpuWorkerCalls,resultSha256:gpuResult.sha256,
   verifiedBy:gpuResult.verification,verificationScope:'COMPONENT_TOLERANCE_PLUS_SEPARATE_STRICT_NATIVE_DOUBLE_ERROR',
   timingBoundary:softwareOnly?'LEEWAY_CPU_INCLUDES_PACKING_SNAPSHOTS_APPROVAL_WORKER_MESSAGE_RESULT_REFERENCE_CHECK_HASH; NATIVE_USES_EXISTING_APP_MATH':'GPU_INCLUDES_PACKING_SNAPSHOTS_APPROVAL_UPLOAD_DISPATCH_READBACK_REFERENCE_CHECK_HASH; CPU_USES_EXISTING_NATIVE_MATH',
   rendererUsesCandidateResult:false,claim:'APPLICATION_DATA_FIT_TEST_NOT_APPLICATION_SPEEDUP'};
  if(softwareOnly){results.componentFit.leewayCpuEndToEndMs=results.componentFit.leewayGpuEndToEndMs;delete results.componentFit.leewayGpuEndToEndMs;delete results.componentFit.gpuToNativeTimeRatio;results.componentFit.coldCpuMs=results.componentFit.coldGpuMs;delete results.componentFit.coldGpuMs;if(gpuCalls!==0||gpuResult.backend!=='CPU')throw Error('CPU_ONLY_EXECUTION_BOUNDARY_FAILED');}
  if(attribution&&!softwareOnly){
   const {attributeApplicationStages}=await import('/__stage/');
   results.stageAttribution=await attributeApplicationStages({id,pack,reference,nativeTransform,renderOwner:target});
  }
  return results;
 }finally{active=null;target.render=original;transformReuse?.dispose();device?.destroy();}
}
