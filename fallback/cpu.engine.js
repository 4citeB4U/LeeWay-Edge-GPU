/*
REGION: LEEWAY.EDGE_GPU.FALLBACK
TAG: LEEWAY.EDGE_GPU.CPU_WORKER.G2
WHAT: Existing worker execution with cancellation and bounded lifetime.
WHY: CPU fallback must not freeze the interface or survive an explicit cancellation.
WHO: Creator-authorized Agent Lee. WHERE: Existing CPU backend. WHEN: Admitted local computation.
HOW: Isolated module worker, explicit completion/error, terminate on every exit. LICENSE: MIT
*/
import {snapshotTensor,TensorError,requireNotCancelled} from '../dispatch/tensor-contract.mjs';
function runWorker(payload,{signal,timeoutMs=30000}={}){
 requireNotCancelled(signal);
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>120000)throw new TensorError('CPU_TIMEOUT_INVALID');
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./cpu.worker.js',import.meta.url),{type:'module'});
  let done=false;
  const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();error?reject(error):resolve(value);};
  const cancel=()=>finish(new TensorError('TENSOR_CANCELLED'));
  const timer=setTimeout(()=>finish(new TensorError('CPU_EXECUTION_TIMEOUT')),timeoutMs);
  signal?.addEventListener('abort',cancel,{once:true});
  worker.onmessage=e=>{if(e.data?.error)finish(new TensorError(e.data.code||'CPU_EXECUTION_FAILED',e.data.error));else finish(null,e.data);};
  worker.onerror=e=>{e.preventDefault();finish(new TensorError('CPU_EXECUTION_FAILED',e.message));};
  worker.onmessageerror=()=>finish(new TensorError('CPU_RESPONSE_INVALID'));
  if(signal?.aborted){cancel();return;}
  try{worker.postMessage(payload);}catch(error){finish(error);}
 });
}
export function cpuMatMul(A,B,size,options={}){return runWorker({A,B,size},options);}
export function cpuTensor(input,options={}){return runWorker({op:'TENSOR',input:snapshotTensor(input)},options);}
