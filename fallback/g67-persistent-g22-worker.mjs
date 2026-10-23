/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FALLBACK
TAG: LEEWAY.G67.PERSISTENT_ORIGINAL_G22_WORKER
5WH: WHAT = Reuse original G22 CPU worker for bounded sequential matrix requests.
WHY = Eliminate repeated worker startup in the full Qwen3 projection benchmark.
WHO = Creator-directed diagnostic engineering.
WHERE = fallback/g67-persistent-g22-worker.mjs
WHEN = 2026-10-22
HOW = One original node-cpu.worker.mjs thread, serialized requests, verified close.
LICENSE: MIT
AUTHORITY: Diagnostic only, not production or external inference.
*/
import {Worker} from 'node:worker_threads';
export function createG67Worker(){
 const worker=new Worker(new URL('./node-cpu.worker.mjs',import.meta.url),{workerData:{denyExternalProviders:true}});
 let closed=false,pending=null;
 const fault=e=>{closed=true;if(pending){pending.reject(e);pending=null;}};
 worker.on('error',fault);
 worker.on('exit',code=>fault(Error('G67_WORKER_EXIT_'+code)));
 worker.on('message',msg=>{
  const p=pending;pending=null;if(!p)return;
  if(msg?.kind!=='result'||msg.value?.error||!(msg.value instanceof Float32Array))p.reject(Error(msg?.value?.error||'G67_RESULT_INVALID'));
  else p.resolve(msg.value);
 });
 return {
  async execute(A,B,size){
   if(closed||pending)throw Error('G67_WORKER_BUSY_OR_CLOSED');
   if(!Number.isSafeInteger(size)||size<1||size>512||!(A instanceof Float32Array)||!(B instanceof Float32Array)||A.length!==size*size||B.length!==size*size||!A.every(Number.isFinite)||!B.every(Number.isFinite))throw Error('G67_INPUT_INVALID');
   return new Promise((resolve,reject)=>{pending={resolve,reject};try{worker.postMessage({A:A.slice(),B:B.slice(),size})}catch(e){pending=null;reject(e)}});
  },
  async close(){if(closed)return;closed=true;if(pending){pending.reject(Error('G67_CLOSED'));pending=null;}await worker.terminate()}
 }
}
