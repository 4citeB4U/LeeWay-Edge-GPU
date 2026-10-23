/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
TAG: LEEWAY.G66.FULL_ATTENTION_KEY_PROJECTION_G22_LDWMD
5WH: WHAT = Execute all tiles of original Qwen3 2,560x1,024 key projection.
WHY = Connect complete genuine model operation to G22 and LDWMD;
WHO = Creator-directed engineering; WHERE = scripts/g66-execute-full-key-projection.mjs;
WHEN = 2026-10-22; HOW = 40 source-pinned G30 square matmuls with cleanup.
LICENSE: MIT; AUTHORITY: Diagnostic only, not full attention/model admission.
*/
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';import {performance} from 'node:perf_hooks';
import {cpuMatMulNode} from '../fallback/node-cpu.engine.mjs';
const root=process.env.LEEWAY_LDWMD_SOURCE_ROOT,dir=process.argv[2];
if(!root||!path.isAbsolute(root)||!dir||!path.isAbsolute(dir))throw Error('G66_ROOT_REQUIRED');
const bridge=path.join(root,'automation-runtime/src/vtensor/ldwmd-leeway-cpu-binding.mjs');
const digest=x=>createHash('sha256').update(x).digest('hex');
if(digest(fs.readFileSync(bridge))!=='d45fc2283bdc76ec0006482ae69b7505ae4dd1410ea99d330b85e0cc69c42b3c')throw Error('G66_G30_PIN_MISMATCH');
const {runG30LdwmdOriginalWorker}=await import(pathToFileURL(bridge).href);
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
if(manifest.tiles.length!==40||manifest.shape.join(',')!=='2560,1024')throw Error('G66_MANIFEST_INVALID');
const load=(file,len)=>{let raw=fs.readFileSync(path.join(dir,file));if(raw.length!==len*4)throw Error('G66_INPUT_SIZE');return new Float32Array(raw.buffer,raw.byteOffset,len).slice()};
const full=new Float64Array(1024);let leases=0;const start=performance.now();
for(const [i,tile] of manifest.tiles.entries()){
 const A=load(tile.stem+'.A.bin',65536),B=load(tile.stem+'.B.bin',65536);
 const outcome=await runG30LdwmdOriginalWorker({requestId:'g66-qwen3-key-'+i,sourceSha256:'1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c',size:256,A,B,originalWorker:cpuMatMulNode});
 if(!outcome.releaseZeroized||outcome.activeHostBytesAfter!==0)throw Error('G66_MEMORY_RELEASE_INVALID');
 for(let r=0;r<256;r++)full[tile.outBase+r]+=outcome.output[r*256];
 leases++;
}
const expected=load('expected.bin',1024),actual=Float32Array.from(full);
let mismatches=0,maxAbsoluteError=0;
for(let j=0;j<actual.length;j++){const delta=Math.abs(actual[j]-expected[j]);maxAbsoluteError=Math.max(maxAbsoluteError,delta);if(delta>1e-4+1e-4*Math.abs(expected[j]))mismatches++;}
const result={status:mismatches?'G66_FAIL':'G66_FULL_REAL_KEY_PROJECTION_PASS',shape:manifest.shape,tilesExecuted:leases,valuesVerified:1024,maxAbsoluteError,mismatches,elapsedMs:+(performance.now()-start).toFixed(3),outputSha256:digest(Buffer.from(actual.buffer)),allLDWMDLeasesZeroized:true,fullAttentionExecuted:false,tokenInferenceExecuted:false,productionAccepted:false};
console.log(JSON.stringify(result,null,2));if(mismatches)process.exitCode=1;
