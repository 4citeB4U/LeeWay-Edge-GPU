import test from 'node:test';
import assert from 'node:assert/strict';
import {cpuMatMulNode} from '../../fallback/node-cpu.engine.mjs';

// Deliberately retains the old per-element ascending-k scalar reduction.
function scalar(A,B,n){
 const out=new Float32Array(n*n);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  let sum=0;for(let k=0;k<n;k++)sum+=A[i*n+k]*B[k*n+j];
  out[i*n+j]=sum;
 }
 return out;
}
function inputs(n){
 let state=0x8a41e221;
 const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;};
 const a=new Float32Array(n*n),b=new Float32Array(n*n);
 for(let i=0;i<a.length;i++){
  a[i]=((next()%2001)-1000)/37;
  b[i]=((next()%2001)-1000)/113;
 }
 return [a,b];
}
for(const n of [1,3,31,32,33,65])test(`blocked square preserves exact ordered Float32 output at size ${n}`,async()=>{
 const [a,b]=inputs(n),expected=scalar(a,b,n);
 const actual=await cpuMatMulNode(a,b,n,{denyExternalProviders:true});
 assert.deepEqual(Buffer.from(actual.buffer),Buffer.from(expected.buffer));
});
test('cancellation-sensitive reduction retains low-order term until final Float32 store',async()=>{
 const a=new Float32Array([16777216,1,-16777216,0,0,0,0,0,0]);
 const b=new Float32Array([1,0,0,1,0,0,1,0,0]);
 const out=await cpuMatMulNode(a,b,3);
 assert.equal(out[0],1);
 assert.deepEqual([...out],[...scalar(a,b,3)]);
});
test('zeros and signed values preserve ordered scalar result',async()=>{
 const a=new Float32Array([0,-0,2,-3,0,0,0,-1,2]);
 const b=new Float32Array([-0,1,2,3,-4,0,0,0,0]);
 assert.deepEqual([...await cpuMatMulNode(a,b,3)],[...scalar(a,b,3)]);
});
test('non-finite Float32 output fails instead of reporting successful computation',async()=>{
 await assert.rejects(()=>cpuMatMulNode(new Float32Array([1e30]),new Float32Array([1e30]),1),
  e=>e.code==='CPU_EXECUTION_FAILED'&&e.message==='CPU_MATRIX_RESULT_NONFINITE');
});
