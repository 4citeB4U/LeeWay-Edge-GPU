/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.APPLICATION_EVIDENCE_SUMMARY.G3
WHAT: Derive a reproducible summary from the executed application reports.
WHY: Separate correctness, actual render-path changes, component costs and untested claims.
WHO: Creator-authorized Agent Lee. ROLES: VERIFY.
WHERE: Existing local GPU candidate and application benchmark evidence.
WHEN: Explicit report generation. HOW: Read exact input reports, calculate medians, retain hashes.
LICENSE: MIT. This is a local diagnostic observation, not a canonical Veritas receipt.
*/
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=process.argv[2];if(!root)throw Error('BENCHMARK_ROOT_REQUIRED');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const inputFiles={leola:'run-2026-10-16T07-19-47-637Z',maps:'run-2026-10-16T07-16-42-990Z'};
const median=values=>{const x=values.slice().sort((a,b)=>a-b);return x.length%2?x[(x.length-1)/2]:(x[x.length/2-1]+x[x.length/2])/2;};
const selected={};const sources=[];
for(const [id,run]of Object.entries(inputFiles)){
 const file=path.join(root,'runs',run,'application-results.json'),bytes=fs.readFileSync(file),r=JSON.parse(bytes);
 const app=r.applications.find(x=>x.id===id);if(!app||app.outcome!=='EXECUTED_SEE_CLAIM_BOUNDARY')throw Error('APPLICATION_REPORT_NOT_EXECUTED:'+id);
 selected[id]=app;sources.push({application:id,reportPath:file,sha256:hash(bytes),startedUtc:r.startedUtc,endedUtc:r.endedUtc,closure:r.closure,scriptSha256:r.benchmarkScriptSha256,exerciseSha256:r.exerciseScriptSha256});
}
const l=selected.leola,m=selected.maps,t=l.exercise.renderReuseTrials;
if(t.length!==8)throw Error('EIGHT_RENDER_WINDOWS_REQUIRED');
const baseline=t.filter(x=>x.mode==='EXISTING_RENDERER'),candidate=t.filter(x=>x.mode==='LEEWAY_TRANSFORM_REUSE');
const blocks=[];
for(let i=0;i<8;i+=4){const a=t.slice(i,i+4).filter(x=>x.mode==='EXISTING_RENDERER'),b=t.slice(i,i+4).filter(x=>x.mode==='LEEWAY_TRANSFORM_REUSE');const av=a.reduce((s,x)=>s+x.renderCallsPerSecond,0)/a.length,bv=b.reduce((s,x)=>s+x.renderCallsPerSecond,0)/b.length;blocks.push({block:blocks.length+1,baselineRenderCallsPerSecond:av,candidateRenderCallsPerSecond:bv,observedChangePercent:100*(bv/av-1)});}
const clean=Object.fromEntries(['leola','maps'].map(id=>[id,execFileSync('git',['-C',path.join(root,id),'status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim()==='']));
const summary={schema:'leeway.application-comparison-summary.g3',generatedUtc:new Date().toISOString(),
 overallVerdict:'APPLICATION_SPEEDUP_NOT_DEMONSTRATED',testClass:'LOCAL_REAL_APPLICATIONS_PLUS_CANDIDATE_TRANSFORM_REUSE_AND_DATA_FIT',
 environment:{platform:'Windows',browser:'Chrome 155',width:1280,height:720,deviceScaleFactor:1,headful:true,hardwareRenderer:l.identity.renderer,computeAdapter:l.exercise.computeAdapter,
  seedPolicy:'Same deterministic Math.random seed per fresh page',mapProviders:'KEYLESS_IMAGERY_ONLY_NO_LIVE_TRAFFIC_OR_MODEL_SERVICES',normalAppGpuEnabled:true},
 leola:{sourceCommit:l.sourceCommit,scenario:l.navigation,identity:l.identity,
  correctness:l.exercise.renderReuseCorrectness,
  renderComparison:{windows:8,windowsPerMode:4,measurement:'RENDER_CALL_RATE_AND_MAIN_THREAD_RENDER_CALL_WALL_DURATION_NOT_PRESENTED_FPS_OR_DEVICE_GPU_TIME',
   baselineMedianRenderCallsPerSecond:median(baseline.map(x=>x.renderCallsPerSecond)),candidateMedianRenderCallsPerSecond:median(candidate.map(x=>x.renderCallsPerSecond)),
   baselineMedianOfRenderCallMediansMs:median(baseline.map(x=>x.renderSubmissionCpuMs.median)),candidateMedianOfRenderCallMediansMs:median(candidate.map(x=>x.renderSubmissionCpuMs.median)),
   blocks,verdict:'NO_CONSISTENT_SPEEDUP_OPPOSITE_SIGNS_ACROSS_ABBA_BLOCKS',rawTrials:t},
  transformReuse:l.exercise.renderReuseStatistics,
  tensorFit:l.exercise.componentFit,
  tensorVerdict:'DO_NOT_OFFLOAD_THIS_IDENTITY_TRANSFORM_NOT_A_DENSE_TENSOR_THROUGHPUT_BENCHMARK'},
 maps:{sourceCommit:m.sourceCommit,scenario:m.cameraSetup,identity:m.identity,
  tensorFit:m.exercise.componentFit,renderNullControls:m.exercise.renderNullControl,
  verdict:'CANDIDATE_ROUNDTRIP_SLOWER_AND_ONE_CENTIMETER_DIAGNOSTIC_TARGET_FAILED',rendererUsesTensorOutput:false},
 scope:{sourceApplicationFilesUnmodified:clean,publishedApplicationsChanged:false,driverInstalled:false,remoteComputeUsed:false,nvidiaExecutionVerified:false,
  logisticsTested:false,formulaDirectedRoutingTested:false,fullLdWmdProductionBindingTested:false,canonicalC3Acceptance:false,learningLedgerUpdated:false,
  correctnessBoundary:'Pixel and matrix equality applies only to the three recorded snapshots, not universal application equivalence.',
  timingBoundary:'Native baseline is existing app math. Tensor roundtrip includes preparation, copies, approval, upload, compute, readback, comparison and hashing. Not a hardware-throughput comparison.',
  candidateScope:'Opt-in exact scene-transform reuse only; this is not the complete Formula/LDWMD/Cesium/Three.js system.'},
 sources};
const file=path.join(root,'application-comparison-summary.json');fs.writeFileSync(file,JSON.stringify(summary,null,2));
const compact={verdict:summary.overallVerdict,environment:summary.environment,
 leola:{sourceCommit:l.sourceCommit,meshes:l.identity.meshes,phase:l.identity.phase,geometryTriangles:l.identity.geometryTriangles,
  renderComparison:{...summary.leola.renderComparison,rawTrials:undefined},correctness:l.exercise.renderReuseCorrectness,
  tensorFit:{vertices:l.exercise.componentFit.testedVertices,identityTransform:l.exercise.componentFit.identityTransform,nativeMedianMs:l.exercise.componentFit.nativeCpuMs.median,checkedGpuMedianMs:l.exercise.componentFit.leewayGpuEndToEndMs.median,maxError:l.exercise.componentFit.gpuMaxAbsoluteErrorAgainstNativeDouble}},
 maps:{sourceCommit:m.sourceCommit,renderedTiles:m.exercise.componentFit.tiles,points:m.exercise.componentFit.testedPoints,nativeMedianMs:m.exercise.componentFit.nativeCpuMs.median,checkedGpuMedianMs:m.exercise.componentFit.leewayGpuEndToEndMs.median,maxErrorMeters:m.exercise.componentFit.gpuMaxAbsoluteErrorAgainstNativeDouble,requiredDiagnosticAccuracyMeters:m.exercise.componentFit.accuracyTarget,accuracyTargetMet:m.exercise.componentFit.accuracyTargetMet},
 scope:summary.scope,sources,summaryFile:file,summarySha256:hash(fs.readFileSync(file))};
fs.writeFileSync(path.join(root,'application-comparison-compact.json'),JSON.stringify(compact,null,2));
console.log(JSON.stringify(compact,null,2));
