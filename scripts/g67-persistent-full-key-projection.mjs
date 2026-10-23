/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
TAG: LEEWAY.G67.PERSISTENT_G22_G30_FULL_PROJECTION
5WH: WHAT = Run entire Qwen3 attention key projection via one persistent original G22 worker.
WHY = Benchmark amortized startup against G66 repeated worker launches.
WHO = Creator-directed diagnostic engineering.
WHERE = scripts/g67-persistent-full-key-projection.mjs
WHEN = 2026-10-22
HOW = Source-pinned G30 LDWMD worker callback, independent output readback.
LICENSE: MIT; AUTHORITY: Diagnostic only; no full inference or canonical admission.
*/
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';import {performance} from 'node:perf_hooks';
import {createG67Worker} from '../fallback/g67-persistent-g22-worker.mjs';
const root=process.env.LEEWAY_LDWMD_SOURCE_ROOT,dir=process.argv[2];
if(!root||!path.isAbsolute(root)||!dir||!path.isAbsolute(dir))throw Error('G67_ROOT_REQUIRED');
const bridge=path.join(root,'automation-runtime/src/vtensor/ldwmd-leeway-cpu-binding.mjs');
const digest=x=>createHash('sha256').update(x).digest('hex');
if(digest(fs.readFileSync(bridge))!=='d45fc2283bdc76ec0006482ae69b7505ae4dd1410ea99d330b85e0cc69c42b3c')throw Error('G67_G30_PIN_MISMATCH');
const {runG30LdwmdOriginalWorker}=await import(pathToFileURL(bridge).href);
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
if(manifest.tiles.length!==40||manifest.shape.join(',')!=='2560,1024')throw Error('G67_MANIFEST_INVALID');
const load=(file,len)=>{const raw=fs.readFileSync(path.join(dir,file));if(raw.length!==len*4)throw Error('G67_INPUT_SIZE');return new Float32Array(raw.buffer,raw.byteOffset,len).slice()};
const result=new Float64Array(1024);let tiles=0;
const start=performance.now(),persistent=createG67Worker();
try{
 for(const [i,tile] of manifest.tiles.entries()){
  const A=load(tile.stem+'.A.bin',65536),B=load(tile.stem+'.B.bin',65536);
  const outcome=await runG30LdwmdOriginalWorker({requestId:'g67-qwen3-key-'+i,sourceSha256:'1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c',size:256,A,B,originalWorker:(a,b,s)=>persistent.execute(a,b,s)});
  if(!outcome.releaseZeroized||outcome.activeHostBytesAfter!==0)throw Error('G67_MEMORY_RELEASE_INVALID');
  for(let r=0;r<256;r++)result[tile.outBase+r]+=outcome.output[r*256];
  tiles++;
 }
}finally{await persistent.close()}
const expected=load('expected.bin',1024),actual=Float32Array.from(result);
let mismatches=0,maxAbsoluteError=0;
for(let j=0;j<actual.length;j++){const delta=Math.abs(actual[j]-expected[j]);maxAbsoluteError=Math.max(maxAbsoluteError,delta);if(delta>1e-4+1e-4*Math.abs(expected[j]))mismatches++}
const report={status:mismatches?'G67_FAIL':'G67_PERSISTENT_FULL_KEY_PROJECTION_PASS',tiles,outputElements:1024,maxAbsoluteError,mismatches,elapsedMs:+(performance.now()-start).toFixed(3),outputSha256:digest(Buffer.from(actual.buffer)),workerLaunches:1,ldwmdReleaseZeroized:true,fullAttentionExecuted:false,productionAccepted:false};
console.log(JSON.stringify(report,null,2));if(mismatches)process.exitCode=1;
