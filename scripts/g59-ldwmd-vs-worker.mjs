/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.BENCHMARK
TAG: LEEWAY.G59.LDWMD_VS_G22
5WH:
WHAT = Compare identical 256x256 original G22 matrix execution standalone vs G30 LDWMD.
WHY = Isolate verified host-memory lease overhead from worker overhead.
WHO = Creator-directed LeeWay engineering.
WHERE = scripts/g59-ldwmd-vs-worker.mjs
WHEN = 2026-10-22
HOW = Pin original G30 binding, exercise real G22 worker, compare byte-identical results.
LICENSE: MIT
AUTHORITY: Diagnostic only; no canonical Veritas or ledger writes.
*/
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {cpuMatMulNode} from '../fallback/node-cpu.engine.mjs';
const size=256,root=process.env.LEEWAY_LDWMD_SOURCE_ROOT;
if(!root||!path.isAbsolute(root))throw Error('PINNED_G30_ROOT_REQUIRED');
const bridge=path.join(root,'automation-runtime/src/vtensor/ldwmd-leeway-cpu-binding.mjs');
const pinned='d45fc2283bdc76ec0006482ae69b7505ae4dd1410ea99d330b85e0cc69c42b3c';
if(createHash('sha256').update(fs.readFileSync(bridge)).digest('hex')!==pinned)throw Error('G30_PIN_MISMATCH');
const {runG30LdwmdOriginalWorker}=await import(pathToFileURL(bridge).href);
const sourceSha256='1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c';
const A=Float32Array.from({length:size*size},(_,i)=>i%size===Math.floor(i/size)?1:0);
const B=Float32Array.from({length:size*size},(_,i)=>((i*13)%29)-14);
const hash=x=>createHash('sha256').update(Buffer.from(x.buffer,x.byteOffset,x.byteLength)).digest('hex');
const results={};
for(const mode of ['worker','ldwmd']){
 const runs=[];
 for(let i=0;i<3;i++){
  const start=performance.now();
  let output,leased=null,zeroized=null;
  if(mode==='worker'){output=await cpuMatMulNode(A,B,size,{denyExternalProviders:true})}
  else {const x=await runG30LdwmdOriginalWorker({requestId:'g59-'+i,sourceSha256,size,A,B,originalWorker:cpuMatMulNode});output=x.output;leased=x.allocatedHostBytes;zeroized=x.releaseZeroized&&x.activeHostBytesAfter===0}
  const elapsedMs=performance.now()-start;
  if(output.length!==B.length||output.some((v,j)=>v!==B[j]))throw Error('G59_REFERENCE_MISMATCH');
  if(mode==='ldwmd'&&!zeroized)throw Error('G59_LDWMD_RELEASE_FAILED');
  runs.push({elapsedMs:+elapsedMs.toFixed(3),outputSha256:hash(output),ldwmdAllocatedBytes:leased,zeroized});
 }
 results[mode]={medianMs:runs.map(x=>x.elapsedMs).sort((a,b)=>a-b)[1],runs};
}
console.log(JSON.stringify({status:'G59_PASS',shape:[size,size],results,productionAccepted:false},null,2));
