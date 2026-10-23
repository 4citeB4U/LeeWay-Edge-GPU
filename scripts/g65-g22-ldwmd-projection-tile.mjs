/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
TAG: LEEWAY.G65.REAL_ATTENTION_TILE_G22_LDWMD
5WH:
WHAT = Run genuine Qwen3 quantized attention matrix tile through original G22 and G30 LDWMD.
WHY = Connect model weight data to LeeWay compute with independently verified numerical evidence.
WHO = Creator-directed LeeWay diagnostic engineering.
WHERE = scripts/g65-g22-ldwmd-projection-tile.mjs
WHEN = 2026-10-22
HOW = Source-pin original LDWMD bridge, load prepared real GGUF tensor block, validate output.
LICENSE: MIT
AUTHORITY: Diagnostic only; no complete attention or production admission.
*/
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {cpuMatMulNode} from '../fallback/node-cpu.engine.mjs';
const root=process.env.LEEWAY_LDWMD_SOURCE_ROOT,dir=process.argv[2];
if(!root||!path.isAbsolute(root)||!dir||!path.isAbsolute(dir))throw Error('G65_ROOT_REQUIRED');
const file=path.join(root,'automation-runtime/src/vtensor/ldwmd-leeway-cpu-binding.mjs');
const expectedPin='d45fc2283bdc76ec0006482ae69b7505ae4dd1410ea99d330b85e0cc69c42b3c';
const hash=x=>createHash('sha256').update(x).digest('hex');
if(hash(fs.readFileSync(file))!==expectedPin)throw Error('G65_BRIDGE_PIN_MISMATCH');
const {runG30LdwmdOriginalWorker}=await import(pathToFileURL(file).href);
const read=(name,len)=>{const data=fs.readFileSync(path.join(dir,name));if(data.byteLength!==len*4)throw Error('G65_TILE_SIZE_INVALID');return new Float32Array(data.buffer,data.byteOffset,len).slice()};
const size=256,A=read('A.bin',size*size),B=read('B.bin',size*size),oracle=read('expected.bin',size);
const result=await runG30LdwmdOriginalWorker({requestId:'g65-real-qwen3-projection-tile',sourceSha256:'1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c',size,A,B,originalWorker:cpuMatMulNode});
let maxError=0,mismatches=0;
for(let r=0;r<size;r++){const v=result.output[r*size];const e=oracle[r];maxError=Math.max(maxError,Math.abs(v-e));if(Math.abs(v-e)>1e-5+1e-5*Math.abs(e))mismatches++;}
const outcome={status:mismatches?'G65_FAIL':'G65_REAL_QWEN3_TILE_G22_LDWMD_PASS',tileShape:[size,size],outputValuesVerified:size,maxAbsoluteError:maxError,mismatches,allocatedHostBytes:result.allocatedHostBytes,releaseZeroized:result.releaseZeroized,activeHostBytesAfter:result.activeHostBytesAfter,fullProjectionExecuted:false,fullModelInferenceExecuted:false,productionAccepted:false};
console.log(JSON.stringify(outcome,null,2));if(mismatches)process.exitCode=1;
