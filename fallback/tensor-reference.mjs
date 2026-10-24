/*
REGION: LEEWAY.EDGE_GPU.FALLBACK
TAG: LEEWAY.EDGE_GPU.TENSOR_CPU_REFERENCE.G2
WHAT: Independent scalar-loop reference for the fixed tensor operation.
WHY: CPU continuation must have explicit semantics and a numerical comparison baseline.
WHO: Creator-authorized Agent Lee. WHERE: Existing CPU worker capability.
WHEN: Admitted CPU execution or diagnostic comparison. HOW: Row-major scalar dot products; no GPU code reuse.
ROLES: EXECUTE VERIFY. LICENSE: MIT
*/
import {snapshotTensor,TensorError} from '../dispatch/tensor-contract.mjs';
export function cpuTensorReference(input){
 const t=snapshotTensor(input);const output=new Float32Array(t.m*t.n);
 for(let row=0;row<t.m;row++)for(let col=0;col<t.n;col++){
  let sum=0;
  for(let k=0;k<t.k;k++)sum+=t.A[row*t.k+k]*t.B[k*t.n+col];
  const value=sum+t.bias[col];output[row*t.n+col]=t.activation==='relu'?Math.max(0,value):value;
 }
 if(!output.every(Number.isFinite))throw new TensorError('TENSOR_RESULT_INVALID');
 return output;
}
export function compareTensorResults(actual,expected,{absoluteTolerance=1e-4,relativeTolerance=1e-4}={}){
 if(!Number.isFinite(absoluteTolerance)||absoluteTolerance<0||!Number.isFinite(relativeTolerance)||relativeTolerance<0)throw new TensorError('TENSOR_TOLERANCE_INVALID');
 if(!(actual instanceof Float32Array)||!(expected instanceof Float32Array)||actual.length!==expected.length)return {valid:false,method:'SCALAR_CPU_REFERENCE',reason:'SHAPE_MISMATCH'};
 let maxAbsoluteError=0,mismatches=0;
 for(let i=0;i<actual.length;i++){
  const error=Math.abs(actual[i]-expected[i]);
  if(!Number.isFinite(actual[i])||!Number.isFinite(expected[i])||error>absoluteTolerance+relativeTolerance*Math.abs(expected[i]))mismatches++;
  if(Number.isFinite(error))maxAbsoluteError=Math.max(maxAbsoluteError,error);
 }
 return {valid:mismatches===0,method:'SCALAR_CPU_REFERENCE',values:actual.length,mismatches,maxAbsoluteError,absoluteTolerance,relativeTolerance};
}
