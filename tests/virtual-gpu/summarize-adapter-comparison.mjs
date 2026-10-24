/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.ADAPTER_COMPARISON_SUMMARY.G4
WHAT: Derive comparisons from exact recorded runs, including failed follow-up attempts.
WHY: NVIDIA attribution must use actual adapter evidence and separate nested wait timing from GPU time.
WHO: Creator-authorized Agent Lee. ROLES: VERIFY. WHERE: Existing local evidence.
WHEN: Explicit invocation. HOW: Hash-verify inputs, extract recorded observations, preserve scope.
LICENSE: MIT. Not a production acceptance receipt.
*/
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=process.argv[2];if(!root)throw Error('BENCHMARK_ROOT_REQUIRED');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const median=v=>{const a=v.slice().sort((a,b)=>a-b);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
const cases=[
 {id:'intel-leola',app:'leola',run:'run-2026-10-16T07-53-12-140Z',sha:'51ead41855c5e264231bd52c4434d03a802e8808193b8bb4c20a1d738d90b8cc'},
 {id:'nvidia-leola',app:'leola',run:'run-2026-10-16T07-50-43-911Z',sha:'b69fd26c771a96deced835a1700557b6a43e7857c11e76cdc5f198e865e96a84'},
 {id:'intel-maps',app:'maps',run:'run-2026-10-16T07-16-42-990Z',sha:'2a16473372018c164b266fe91417b772fe2ff660ea3fc9abad2141c749428132'},
 {id:'nvidia-maps',app:'maps',run:'run-2026-10-16T07-47-42-063Z',sha:'ff940d5c2a317ca7c97c09aaae09f51f77aa0574d216bff2499f52f4d9679835'}
];
const results={},provenance=[];
for(const c of cases){
 const file=path.join(root,'runs',c.run,'application-results.json'),bytes=fs.readFileSync(file);if(hash(bytes)!==c.sha)throw Error('EVIDENCE_HASH_MISMATCH:'+c.id);
 const r=JSON.parse(bytes),a=r.applications.find(a=>a.id===c.app);if(a.outcome!=='EXECUTED_SEE_CLAIM_BOUNDARY')throw Error('APP_NOT_EXECUTED');
 const fit=a.exercise.componentFit;
 const requested=c.id.split('-')[0];if(!(a.identity.renderer||'').toLowerCase().includes(requested)||a.exercise.computeAdapter.vendor!==requested)throw Error('ADAPTER_NOT_MATCHED');
 const stages=a.exercise.stageAttribution;
 results[c.id]={app:c.app,sourceCommit:a.sourceCommit,webglRenderer:a.identity.renderer,webgpu:a.exercise.computeAdapter,
  scenario:a.navigation||a.cameraSetup,scene:{meshes:a.identity.meshes,renderDrawCallsAtSnapshot:a.identity.renderInfo?.calls,globeTiles:a.identity.globeTiles},
  ordinaryComponentTest:{samples:fit.leewayGpuEndToEndMs.samples,nativeCpuMedianMs:fit.nativeCpuMs.median,checkedGpuRoundtripMedianMs:fit.leewayGpuEndToEndMs.median,
   points:fit.testedVertices||fit.testedPoints,identityTransform:fit.identityTransform??(c.app==='leola'),resultSha256:fit.resultSha256,
   maxErrorAgainstNativeDouble:fit.gpuMaxAbsoluteErrorAgainstNativeDouble,diagnosticAccuracyTarget:fit.accuracyTarget,accuracyTargetMet:fit.accuracyTargetMet},
  inputSnapshotSha256:a.exercise.inputSnapshotSha256||null,
  attribution:stages?{modes:stages.modes,trials:stages.trials,timestampQuerySupported:stages.timestampQuerySupported,
   cpuFloat32InputResultMaxError:stages.cpuResultWithFloat32InputsMaxErrorVsNativeDouble}:null,
  cpuSampling:a.cpuSampling||null,
  pixelControls:a.exercise.sameModePixelControls||null,pixelComparisons:a.exercise.renderReuseCorrectness||null,
  transformReuseVerdict:a.exercise.renderReuseOutcome||'NOT_TESTED_IN_MAPS',
  renderRateTrials:a.exercise.renderReuseTrials||null};
 provenance.push({id:c.id,path:file,sha256:c.sha,startedUtc:r.startedUtc,endedUtc:r.endedUtc,benchmarkScriptSha256:r.benchmarkScriptSha256,exerciseScriptSha256:r.exerciseScriptSha256,closure:r.closure});
}
const n=results['nvidia-leola'],i=results['intel-leola'];
const programPercent=n.cpuSampling.topSelf.filter(x=>['getParameters','getProgram'].includes(x.name)).reduce((a,x)=>a+x.percent,0);
const snapshots=Object.fromEntries(['leola','maps'].map(app=>[app,execFileSync('git',['-C',path.join(root,app),'status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim()==='']));
const excluded=[
 {run:'run-2026-10-16T07-45-18-830Z',reason:'Initial combined-session Maps tile-readiness failure; Leola observations retained separately.'},
 {run:'run-2026-10-16T07-54-21-636Z',reason:'Fresh Intel Maps attribution run failed tile readiness, excluded from performance.'},
 {run:'run-2026-10-16T07-57-34-762Z',reason:'NVIDIA Maps follow-up attribution also timed out on tile readiness; no substitute scene/data generated.'}
].map(x=>{const p=path.join(root,'runs',x.run,'application-results.json');return {...x,path:p,sha256:hash(fs.readFileSync(p))};});
const coreFiles=['core/scene-transform-reuse.mjs','dispatch/tensor.dispatch.mjs','core/hybrid.dispatcher.js'];
const gpuRoot=path.resolve(root,'../LeeWay-Edge-GPU');
const coreUnchanged=coreFiles.map(f=>({path:f,beforeSha256:hash(fs.readFileSync(path.join(root,'g4-comparison-before',path.basename(f)))),afterSha256:hash(fs.readFileSync(path.join(gpuRoot,f)))}));
if(coreUnchanged.some(f=>f.beforeSha256!==f.afterSha256))throw Error('CORE_SOURCE_CHANGED');
const summary={schema:'leeway.nvidia-causal-comparison.g4',generatedUtc:new Date().toISOString(),
 verdict:'NVIDIA_CONFIRMED_SOFTWARE_SCHEDULING_AND_NUMERIC_REPRESENTATION_LIMITS_REMAIN',results,
 findings:{adapter:'Default Chrome selected Intel; isolated --force-high-performance-gpu selected NVIDIA for both APIs with no global setting mutation.',
  libraryCpuProgramSetupSelfPercent:programPercent,
  libraryNvidiaActiveVsRenderSuppressedMs:[n.attribution.modes.ACTIVE.checkedRoundtripMs,n.attribution.modes.SUPPRESSED_DIAGNOSTIC.checkedRoundtripMs],
  libraryIntelActiveVsRenderSuppressedMs:[i.attribution.modes.ACTIVE.checkedRoundtripMs,i.attribution.modes.SUPPRESSED_DIAGNOSTIC.checkedRoundtripMs],
  libraryInputHashesEqual:i.inputSnapshotSha256===n.inputSnapshotSha256,
  mapsOutputHashesEqual:results['intel-maps'].ordinaryComponentTest.resultSha256===results['nvidia-maps'].ordinaryComponentTest.resultSha256,
  mapsPrecisionFailureOnBoth:!results['intel-maps'].ordinaryComponentTest.accuracyTargetMet&&!results['nvidia-maps'].ordinaryComponentTest.accuracyTargetMet,
  nvidiaPixelBaselineAlsoDiffers:n.pixelControls.some(x=>x.mode==='BASELINE_VS_ITSELF'&&x.changedBytes>0),
  interpretation:'Large awaits include main-thread/render scheduling, not pure GPU arithmetic; current code serially awaits three error-scope promises. Render suppression is diagnostic only.',
  noRepairClaim:'Concurrent scope completion and renderer batching are next repair candidates, not fixes implemented in this campaign.'},
 boundaries:{normalGraphicsEnabled:true,scope:'SAME_PINNED_REAL_APPLICATIONS; library attribution is matched fresh; Maps uses prior valid Intel plus requested valid NVIDIA run because fresh follow-ups were blocked.',
  rendererCandidateNvidiaQualified:false,fullFormulaLdWmdIntegrationTested:false,formulaRouting:'NOT_EXECUTED',
  gpuTimestampNote:'Browser-quantized compute-pass timestamps; zero is not zero execution time. No precision-protection flags were disabled.',
  performanceNote:'CPU sample and GPU roundtrip differ in overhead. These are not hardware throughput or general-purpose superiority benchmarks.',
  skippedRenderingIsOptimization:false,appSourceUnchanged:snapshots,systemDriverChanged:false,globalGraphicsSettingsChanged:false,
  productionChanged:false,gitPushed:false,learningLedger:'NOT_UPDATED',c3:'OPEN',canonicalVeritasReceipt:'NOT_CREATED'},
 coreUnchanged,excludedRuns:excluded,provenance};
const out=path.join(root,'nvidia-comparison-g4');fs.mkdirSync(out,{recursive:true});
const full=path.join(out,'nvidia-comparison-full.json');fs.writeFileSync(full,JSON.stringify(summary,null,2));
const compact={schema:summary.schema,verdict:summary.verdict,generatedUtc:summary.generatedUtc,findings:summary.findings,boundaries:summary.boundaries,
 cases:Object.fromEntries(Object.entries(results).map(([key,r])=>[key,{...r,attribution:r.attribution?{modes:r.attribution.modes,timestampQuerySupported:r.attribution.timestampQuerySupported,cpuFloat32InputResultMaxError:r.attribution.cpuFloat32InputResultMaxError}:null,cpuSampling:r.cpuSampling?{topSelf:r.cpuSampling.topSelf.slice(0,10),scope:r.cpuSampling.scope}:null,renderRateTrials:undefined}])),
 coreUnchanged,excludedRuns:excluded,provenance,fullReportSha256:hash(fs.readFileSync(full))};
const short=path.join(out,'nvidia-comparison-summary.json');fs.writeFileSync(short,JSON.stringify(compact,null,2));
console.log(JSON.stringify({out,fullReportSha256:hash(fs.readFileSync(full)),summarySha256:hash(fs.readFileSync(short)),findings:summary.findings,
 componentTimes:Object.fromEntries(Object.entries(results).map(([k,r])=>[k,r.ordinaryComponentTest]))},null,2));
