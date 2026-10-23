/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.MODEL_HUB
TAG: LEEWAY.G69.WORKER_REAL_QWEN3_PROJECTION
5WH: WHAT = Execute complete real Qwen3 key projection via bounded matvec worker.
WHY = Measure worker-isolated efficient operator against G68 and G67.
WHO = Creator-directed engineering.
WHERE = scripts/g69-worker-matvec-projection.mjs
WHEN = 2026-10-22
HOW = Reuse G66 exact model tiles, independent expected hash, one worker.
LICENSE: MIT
AUTHORITY: Diagnostic; LDWMD binding pending.
*/
import fs from 'node:fs';import path from 'node:path';import {Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';import {createHash} from 'node:crypto';
const dir=process.argv[2];if(!dir||!path.isAbsolute(dir))throw Error('G69_DIR_REQUIRED');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
if(manifest.tiles.length!==40||manifest.shape.join(',')!=='2560,1024')throw Error('G69_MANIFEST_INVALID');
const load=(name,len)=>{const bytes=fs.readFileSync(path.join(dir,name));if(bytes.length!==len*4)throw Error('G69_SIZE_INVALID');return new Float32Array(bytes.buffer,bytes.byteOffset,len).slice()};
const worker=new Worker(new URL('../fallback/g69-matvec-worker.mjs',import.meta.url));let pending=null;
worker.on('message',msg=>{const p=pending;pending=null;if(!p)return;if(msg.error)p.reject(Error(msg.error));else p.resolve(msg.output)});
worker.on('error',e=>{if(pending){pending.reject(e);pending=null}});
worker.on('exit',code=>{if(pending){pending.reject(Error('WORKER_EXIT_'+code));pending=null}});
const execute=(A,x)=>new Promise((resolve,reject)=>{if(pending)return reject(Error('BUSY'));pending={resolve,reject};worker.postMessage({A,x,size:256})});
const result=new Float64Array(1024);const start=performance.now();let tiles=0;
try{
 for(const tile of manifest.tiles){
  const A=load(tile.stem+'.A.bin',65536),B=load(tile.stem+'.B.bin',65536),x=new Float32Array(256);
  for(let k=0;k<256;k++)x[k]=B[k*256];
  const out=await execute(A,x);
  if(!(out instanceof Float32Array)||out.length!==256)throw Error('INVALID_OUTPUT');
  for(let r=0;r<256;r++)result[tile.outBase+r]+=out[r];
  A.fill(0);B.fill(0);x.fill(0);out.fill(0);tiles++;
 }
}finally{await worker.terminate()}
const actual=Float32Array.from(result),expected=load('expected.bin',1024);let mismatches=0,maxError=0;
for(let i=0;i<1024;i++){const error=Math.abs(actual[i]-expected[i]);maxError=Math.max(maxError,error);if(error>1e-4+1e-4*Math.abs(expected[i]))mismatches++;}
const sha=createHash('sha256').update(Buffer.from(actual.buffer)).digest('hex');
console.log(JSON.stringify({status:mismatches?'G69_FAIL':'G69_WORKER_MATVEC_PASS',tiles,workerLaunches:1,valuesVerified:1024,mismatches,maxError,elapsedMs:+(performance.now()-start).toFixed(3),outputSha256:sha,ldwmdBound:false,fullInference:false,productionAccepted:false},null,2));if(mismatches)process.exitCode=1;
