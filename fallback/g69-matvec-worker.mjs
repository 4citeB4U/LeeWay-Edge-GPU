/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FALLBACK.MATVEC
TAG: LEEWAY.G69.WORKER_MATVEC
5WH: WHAT = Dedicated bounded matrix-vector worker operation.
WHY = Avoid square output arithmetic while retaining worker isolation.
WHO = LeeWay creator-directed diagnostic engineering.
WHERE = fallback/g69-matvec-worker.mjs
WHEN = 2026-10-22
HOW = Fixed Float32 input contract; ordered Number dot product, Float32 output.
LICENSE: MIT
AUTHORITY: Diagnostic; new kernel, not original G22 arithmetic or production-certified.
*/
import {parentPort} from 'node:worker_threads';
if(!parentPort)throw Error('G69_PORT_REQUIRED');
globalThis.fetch=()=>{throw Error('EXTERNAL_DENIED')};
globalThis.WebSocket=class {constructor(){throw Error('EXTERNAL_DENIED')}};
parentPort.on('message',({A,x,size})=>{
 try{
  if(!Number.isSafeInteger(size)||size<1||size>512||!(A instanceof Float32Array)||!(x instanceof Float32Array)||A.length!==size*size||x.length!==size||!A.every(Number.isFinite)||!x.every(Number.isFinite))throw Error('G69_INPUT_INVALID');
  const out=new Float32Array(size);
  for(let r=0;r<size;r++){let sum=0;for(let k=0;k<size;k++)sum+=A[r*size+k]*x[k];out[r]=sum;}
  if(!out.every(Number.isFinite))throw Error('G69_OUTPUT_NONFINITE');
  parentPort.postMessage({output:out});
 }catch(e){parentPort.postMessage({error:e.message})}
});
