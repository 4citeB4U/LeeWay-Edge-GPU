/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.MODEL_HUB.INFERENCE
TAG: LEEWAY.G68.REAL_WEIGHT_MATVEC
5WH: WHAT = Benchmark real Qwen3 quantized-weight matrix-vector tiles.
WHY = Eliminate zero-filled square matrix multiplication in G67.
WHO = Creator-directed LeeWay diagnostic engineering.
WHERE = scripts/g68-native-matvec.mjs
WHEN = 2026-10-22
HOW = Native JS ordered dot-products over same real G66 tiles, independent readback.
LICENSE: MIT
AUTHORITY: Diagnostic kernel; NOT original G22, LDWMD or production admission.
*/
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {performance} from 'node:perf_hooks';
const dir=process.argv[2];if(!dir||!path.isAbsolute(dir))throw Error('G68_DATA_ROOT_REQUIRED');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
if(manifest.tiles.length!==40||manifest.shape.join(',')!=='2560,1024')throw Error('G68_MANIFEST_INVALID');
const load=(p,n)=>{const bytes=fs.readFileSync(path.join(dir,p));if(bytes.length!==n*4)throw Error('G68_BINARY_INVALID');const v=new Float32Array(bytes.buffer,bytes.byteOffset,n).slice();if(!v.every(Number.isFinite))throw Error('G68_NONFINITE');return v};
const output=new Float64Array(1024);let ops=0;const start=performance.now();
for(const t of manifest.tiles){
 const A=load(t.stem+'.A.bin',65536),B=load(t.stem+'.B.bin',65536),x=new Float32Array(256);
 for(let k=0;k<256;k++)x[k]=B[k*256];
 for(let r=0;r<256;r++){let sum=0;for(let k=0;k<256;k++)sum+=A[r*256+k]*x[k];output[t.outBase+r]+=Math.fround(sum);ops+=256}
 A.fill(0);B.fill(0);x.fill(0);
}
const result=Float32Array.from(output),expected=load('expected.bin',1024);let mismatch=0,maxError=0;
for(let i=0;i<1024;i++){const error=Math.abs(result[i]-expected[i]);maxError=Math.max(maxError,error);if(error>1e-4+1e-4*Math.abs(expected[i]))mismatch++}
const sha=createHash('sha256').update(Buffer.from(result.buffer)).digest('hex');
console.log(JSON.stringify({status:mismatch?'G68_FAIL':'G68_PASS',tiles:40,outputValues:1024,scalarMultiplies:ops,mismatches:mismatch,maxError,outputSha256:sha,elapsedMs:+(performance.now()-start).toFixed(3),g22OriginalExecuted:false,ldwmdBound:false,productionAccepted:false},null,2));
if(mismatch)process.exitCode=1;
