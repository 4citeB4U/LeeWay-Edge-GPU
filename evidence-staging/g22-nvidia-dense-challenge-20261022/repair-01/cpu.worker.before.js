/*
REGION: LEEWAY.EDGE_GPU.FALLBACK
TAG: LEEWAY.EDGE_GPU.CPU_WORKER_EXECUTION.G2
WHAT: Execute existing square matmul or the fixed tensor contract in a worker.
WHY: Preserve the legacy reference while adding a bounded CPU recovery operation.
WHO: Agent Lee. WHERE: Existing CPU worker. WHEN: Explicit worker message.
HOW: Independent scalar arithmetic and explicit error response. LICENSE: MIT
*/
import {cpuTensorReference} from './tensor-reference.mjs';
self.onmessage=e=>{
 try{
  if(e.data?.op==='TENSOR'){self.postMessage(cpuTensorReference(e.data.input));return;}
  const {A,B,size}=e.data;
  if(!Number.isSafeInteger(size)||size<1||size>2048||!(A instanceof Float32Array)||!(B instanceof Float32Array)||A.length!==size*size||B.length!==size*size)throw Error('CPU_MATRIX_INPUT_INVALID');
  const result=new Float32Array(size*size);
  for(let i=0;i<size;i++)for(let j=0;j<size;j++){
   let sum=0;for(let k=0;k<size;k++)sum+=A[i*size+k]*B[k*size+j];result[i*size+j]=sum;
  }
  self.postMessage(result);
 }catch(error){self.postMessage({error:error.message,code:error.code||'CPU_EXECUTION_FAILED'});}
};
