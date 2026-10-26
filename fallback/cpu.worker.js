/*
REGION: LEEWAY.EDGE_GPU.FALLBACK
TAG: LEEWAY.EDGE_GPU.CPU_WORKER_EXECUTION.G22
WHAT: Execute existing square matmul or the fixed tensor contract in a worker.
WHY: Keep the original ordered reduction while improving row-major B locality.
WHO: Agent Lee K1; reviewed by K2/K1-H1. WHERE: Existing CPU worker.
WHEN: Explicit worker message. HOW: Bounded column block, Number accumulation,
one final Float32 store; original tensor path unchanged. LICENSE: MIT
*/
import {cpuTensorReference} from './tensor-reference.mjs';
self.onmessage=e=>{
 try{
  if(e.data?.op==='TENSOR'){self.postMessage(cpuTensorReference(e.data.input));return;}
  const {A,B,size}=e.data;
  if(!Number.isSafeInteger(size)||size<1||size>2048||!(A instanceof Float32Array)||!(B instanceof Float32Array)||A.length!==size*size||B.length!==size*size)throw Error('CPU_MATRIX_INPUT_INVALID');
  const result=new Float32Array(size*size);
  const blockWidth=32;
  const sums=new Float64Array(blockWidth);
  for(let i=0;i<size;i++){
   const row=i*size;
   for(let first=0;first<size;first+=blockWidth){
    const width=Math.min(blockWidth,size-first);
    sums.fill(0);
    // Each output still accumulates k=0..size-1 in JavaScript Number precision.
    // Avoid partial Float32 stores, which would change the rounding contract.
    for(let k=0;k<size;k++){
     const a=A[row+k], b=k*size+first;
     for(let j=0;j<width;j++)sums[j]+=a*B[b+j];
    }
    for(let j=0;j<width;j++)result[row+first+j]=sums[j];
   }
  }
  if(!result.every(Number.isFinite))throw Error('CPU_MATRIX_RESULT_NONFINITE');
  self.postMessage(result);
 }catch(error){self.postMessage({error:error.message,code:error.code||'CPU_EXECUTION_FAILED'});}
};
