/*
REGION: LEEWAY.EDGE_GPU.TENSOR
TAG: LEEWAY.EDGE_GPU.TENSOR.CONTRACT.G2
WHAT: Bounded pure tensor operation contract. WHY: Safe replay requires immutable inputs and explicit semantics.
WHO: Creator-authorized Agent Lee. WHERE: Existing Edge GPU dispatcher capability.
WHEN: Every tensor submission. HOW: Validate before execution, copy data, expose no arbitrary programs.
ROLES: ASSESS EXECUTE VERIFY. LICENSE: MIT
*/
export const TENSOR_OPERATION='MATMUL_BIAS_RELU_V1';
export const MAX_TENSOR_ELEMENTS=4*1024*1024;
export const MAX_TENSOR_MULTIPLIES=64*1024*1024;
export class TensorError extends Error{
 constructor(code,message=code){super(message);this.name='TensorError';this.code=code;}
}
const dimension=(v,label)=>{if(!Number.isSafeInteger(v)||v<1||v>4096)throw new TensorError('TENSOR_INPUT_INVALID',label);return v;};
const array=(v,length,label)=>{
 if(!(v instanceof Float32Array)||v.length!==length||(globalThis.SharedArrayBuffer&&v.buffer instanceof SharedArrayBuffer))throw new TensorError('TENSOR_INPUT_INVALID',label);
 const copy=v.slice();if(!copy.every(Number.isFinite))throw new TensorError('TENSOR_INPUT_INVALID',label);return copy;
};
export function snapshotTensor(input){
 if(!input||input.operation!==TENSOR_OPERATION)throw new TensorError('TENSOR_OPERATION_UNSUPPORTED');
 const m=dimension(input.m,'m'),k=dimension(input.k,'k'),n=dimension(input.n,'n');
 if(Math.max(m*k,k*n,m*n)>MAX_TENSOR_ELEMENTS||m*k*n>MAX_TENSOR_MULTIPLIES)throw new TensorError('TENSOR_INPUT_BUDGET_EXCEEDED');
 const activation=input.activation??'identity';
 if(!['identity','relu'].includes(activation))throw new TensorError('TENSOR_ACTIVATION_UNSUPPORTED');
 return Object.freeze({operation:TENSOR_OPERATION,m,k,n,A:array(input.A,m*k,'A'),B:array(input.B,k*n,'B'),
  bias:input.bias===undefined?new Float32Array(n):array(input.bias,n,'bias'),activation});
}
export function tensorWorkingBytes(t){return (t.m*t.k+t.k*t.n+2*t.m*t.n+t.n)*4+16;}
export function tensorMetadata(t){return Object.freeze({operation:t.operation,shape:[t.m,t.k,t.n],activation:t.activation,
 inputBytes:t.A.byteLength+t.B.byteLength+t.bias.byteLength,outputBytes:t.m*t.n*4,workingBytes:tensorWorkingBytes(t),
 replaySemantics:'PURE_INPUT_SNAPSHOT_NO_EXTERNAL_WRITES',precision:'F32_INPUT_OUTPUT_TOLERANCE_REQUIRED'});}
export function requireNotCancelled(signal){if(signal?.aborted)throw new TensorError('TENSOR_CANCELLED');}
export async function outputDigest(result){
 if(!(result instanceof Float32Array)||!result.every(Number.isFinite))throw new TensorError('TENSOR_RESULT_INVALID');
 const bytes=new Uint8Array(result.buffer,result.byteOffset,result.byteLength);
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
