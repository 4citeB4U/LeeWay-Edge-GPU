/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.TILED_TENSOR
TAG: LEEWAY.G57.ORIGINAL_G22_REAL_TILED_TENSOR
5WH:
WHAT = Execute exact 640x320 tensor projection using original G22 worker in bounded output tiles.
WHY = Verify actual numerical partition execution, not only G55 memory planning.
WHO = Creator-directed LeeWay engineering, diagnostic role.
WHERE = LeeWay-Edge-GPU/scripts/g57-original-tiled-tensor.mjs
WHEN = 2026-10-22
HOW = Fixed MATMUL_BIAS_RELU_V1 contract and independently checked float32 outputs.
LICENSE: MIT
AUTHORITY: Diagnostic only; no LDWMD, Formula, protected signer or canonical receipt.
*/
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {cpuTensorNode} from '../fallback/node-cpu.engine.mjs';
import {TENSOR_OPERATION} from '../dispatch/tensor-contract.mjs';
const m=640,n=320,k=16,tileRows=32;
const A=Float32Array.from({length:m*k},(_,i)=>((i*7)%31-15)/16);
const B=Float32Array.from({length:k*n},(_,i)=>((i*13)%37-18)/32);
const output=new Float32Array(m*n);
let maxWorkingBytes=0,tiles=0;
const start=performance.now();
for(let row=0;row<m;row+=tileRows){
 const rows=Math.min(tileRows,m-row);
 const input={operation:TENSOR_OPERATION,m:rows,k,n,A:A.slice(row*k,(row+rows)*k),B,bias:new Float32Array(n),activation:'identity'};
 const response=await cpuTensorNode(input,{denyExternalProviders:true,timeoutMs:30000});
 const out=response?.output??response?.result??response;
 if(!(out instanceof Float32Array)||out.length!==rows*n)throw Error('G57_WORKER_RESULT_SHAPE_INVALID:'+JSON.stringify(Object.keys(response||{})));
 output.set(out,row*n);
 maxWorkingBytes=Math.max(maxWorkingBytes,(rows*k+k*n+2*rows*n+n)*4+16);
 tiles++;
}
const elapsed=performance.now()-start;
let mismatches=0,maxError=0;
for(let i=0;i<m;i++)for(let j=0;j<n;j++){
 let sum=0;for(let z=0;z<k;z++)sum+=A[i*k+z]*B[z*n+j];
 const expected=Math.fround(sum),actual=output[i*n+j];
 if(actual!==expected){mismatches++;maxError=Math.max(maxError,Math.abs(expected-actual));}
}
const outputSha256=createHash('sha256').update(Buffer.from(output.buffer)).digest('hex');
console.log(JSON.stringify({schema:'leeway.g57.original-tiled-tensor.v1',status:mismatches?'FAIL':'PASS',execution:'ORIGINAL_G22_CPU_TENSOR_WORKER',shape:[m,k,n],outputElements:output.length,tiles,tileRows,maximumContractWorkingMiB:+(maxWorkingBytes/1048576).toFixed(4),outputMiB:+(output.byteLength/1048576).toFixed(4),elapsedMs:+elapsed.toFixed(3),mismatches,maxError,outputSha256,ldwmdBound:false,formulaBound:false,productionAccepted:false},null,2));
if(mismatches)process.exitCode=1;
