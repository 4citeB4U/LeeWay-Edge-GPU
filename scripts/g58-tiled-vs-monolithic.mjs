/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.BENCHMARK
TAG: LEEWAY.G58.MONOLITHIC_VS_TILED_G22
5WH:
WHAT = Compare one G22 tensor worker execution against tiled G22 execution with identical inputs.
WHY = Quantify worker startup and tiling overhead without replacing original arithmetic.
WHO = Creator-directed LeeWay diagnostic engineering.
WHERE = scripts/g58-tiled-vs-monolithic.mjs
WHEN = 2026-10-22
HOW = Same 640x16x320 workload, repeated actual G22 calls and scalar reference.
LICENSE: MIT
AUTHORITY: Diagnostic only; not Formula, LDWMD or canonical production admission.
*/
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {cpuTensorNode} from '../fallback/node-cpu.engine.mjs';
import {TENSOR_OPERATION} from '../dispatch/tensor-contract.mjs';
const m=640,k=16,n=320,A=Float32Array.from({length:m*k},(_,i)=>((i*7)%31-15)/16),B=Float32Array.from({length:k*n},(_,i)=>((i*13)%37-18)/32);
const request=(start,rows)=>({operation:TENSOR_OPERATION,m:rows,k,n,A:A.slice(start*k,(start+rows)*k),B,bias:new Float32Array(n),activation:'identity'});
const digest=o=>createHash('sha256').update(Buffer.from(o.buffer,o.byteOffset,o.byteLength)).digest('hex');
async function execute(tileRows){const out=new Float32Array(m*n);let tiles=0;const s=performance.now();for(let row=0;row<m;row+=tileRows){const rows=Math.min(tileRows,m-row);const part=await cpuTensorNode(request(row,rows),{denyExternalProviders:true});if(!(part instanceof Float32Array)||part.length!==rows*n)throw Error('INVALID_G22_RETURN');out.set(part,row*n);tiles++}return {output:out,elapsedMs:performance.now()-s,tiles}}
const oracle=new Float32Array(m*n);for(let i=0;i<m;i++)for(let j=0;j<n;j++){let sum=0;for(let z=0;z<k;z++)sum+=A[i*k+z]*B[z*n+j];oracle[i*n+j]=Math.fround(sum)}
const results={};for(const [name,rows] of [['single',640],['tiled32',32],['tiled128',128]]){const runs=[];for(let t=0;t<3;t++){const r=await execute(rows);let mismatches=0;for(let i=0;i<oracle.length;i++)if(r.output[i]!==oracle[i])mismatches++;if(mismatches)throw Error('G58_NUMERICAL_MISMATCH_'+name+'_'+mismatches);runs.push({elapsedMs:+r.elapsedMs.toFixed(3),tiles:r.tiles,digest:digest(r.output)})}results[name]={medianMs:+runs.map(r=>r.elapsedMs).sort((a,b)=>a-b)[1].toFixed(3),runs,exactOracleMatches:true}}
console.log(JSON.stringify({status:'G58_PASS',dimensions:[m,k,n],outputElements:m*n,results,ldwmdBound:false,formulaBound:false,productionAccepted:false},null,2));
