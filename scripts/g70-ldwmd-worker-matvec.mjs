/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
TAG: LEEWAY.G70.MATVEC_LDWMD
5WH: WHAT = Real Qwen3 key projection using worker-isolated matvec and original LDWMD leases.
WHY = Maintain bounded actual A/x/output buffers without square-matrix waste.
WHO = Creator-directed diagnostic engineering.
WHERE = scripts/g70-ldwmd-worker-matvec.mjs
WHEN = 2026-10-22
HOW = Original G29 host adapter and database with audited allocations, releases, hashes.
LICENSE: MIT
AUTHORITY: Diagnostic, not production issuer, not complete transformer inference.
*/
import fs from 'node:fs';import path from 'node:path';import {Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';import {createHash,randomUUID} from 'node:crypto';import {pathToFileURL} from 'node:url';
const root=process.env.LEEWAY_LDWMD_SOURCE_ROOT,dir=process.argv[2];
if(!root||!path.isAbsolute(root)||!dir||!path.isAbsolute(dir))throw Error('G70_ROOT_INVALID');
const folder=path.join(root,'automation-runtime/src/vtensor');
const {createLDWMDHostRAMAdapter}=await import(pathToFileURL(path.join(folder,'ldwmd-host-ram-adapter.mjs')).href);
const {LeeWayDeviceWorkingMemoryDatabase:Database}=await import(pathToFileURL(path.join(folder,'vram-database.mjs')).href);
const h=x=>createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
if(manifest.tiles.length!==40||manifest.shape.join(',')!=='2560,1024')throw Error('G70_MANIFEST_INVALID');
const load=(name,n)=>{const raw=fs.readFileSync(path.join(dir,name));if(raw.length!==n*4)throw Error('G70_INPUT_SIZE');return new Float32Array(raw.buffer,raw.byteOffset,n).slice()};
const worker=new Worker(new URL('../fallback/g69-matvec-worker.mjs',import.meta.url));
let pending=null;worker.on('message',msg=>{const p=pending;pending=null;if(!p)return;msg.error?p.reject(Error(msg.error)):p.resolve(msg.output)});
worker.on('error',e=>{if(pending){pending.reject(e);pending=null}});
worker.on('exit',code=>{if(pending){pending.reject(Error('G70_WORKER_EXIT_'+code));pending=null}});
const run=(A,x)=>new Promise((resolve,reject)=>{if(pending)return reject(Error('G70_BUSY'));pending={resolve,reject};worker.postMessage({A,x,size:256})});
const total=new Float64Array(1024);
const deviceId='leeway-software-host-ram',deviceGeneration='g70-diagnostic';
const Abytes=65536*4,xbytes=256*4,ybytes=256*4,capacity=Abytes+xbytes+ybytes;
let released=0,tiles=0,problem=null;
const start=performance.now();
try{
 for(const tile of manifest.tiles){
  const host=createLDWMDHostRAMAdapter({deviceId,capacityBytes:capacity,allocationLimitBytes:Abytes});
  const db=new Database({deviceId,deviceGeneration,totalVramBytes:capacity,hardwareAdapter:host,headroomPolicy:{minimumBytes:0}});
  const specs=[['A',Abytes,[256,256]],['X',xbytes,[256]],['Y',ybytes,[256]]];
  const names=specs.map(([kind])=>kind+'-'+randomUUID()),held=[];
  for(let i=0;i<3;i++){
   const [kind,bytes,shape]=specs[i],id=names[i];
   db.register({tensorId:id,contentHash:'1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c',blockHash:h(id),shape,dtype:'f32',logicalBytes:bytes,physicalBytes:bytes,deviceId,deviceGeneration,memoryClass:'APPLICATION_WORKING_SET',residencyState:'UNBOUND',trustState:'G70_LAB_UNQUALIFIED',pinState:false,executing:false,dmaActive:false,authorityLock:false,dependencyLock:false});
  }
  let issue=null;
  try{
   for(const id of names){const lease=await db.admit(id);if(lease.state!=='ADMITTED')throw Error('G70_ADMISSION_FAILED');held.push(id)}
   const view=(id,len)=>{const b=host.getBuffer({handle:db.get(id).allocationHandle,tensorId:id,deviceId});return new Float32Array(b.buffer,b.byteOffset,len)};
   const A=view(names[0],65536),x=view(names[1],256),y=view(names[2],256);
   A.set(load(tile.stem+'.A.bin',65536));const B=load(tile.stem+'.B.bin',65536);
   for(let k=0;k<256;k++)x[k]=B[k*256];B.fill(0);
   const output=await run(A,x);
   if(!(output instanceof Float32Array)||output.length!==256||!output.every(Number.isFinite))throw Error('G70_WORKER_OUTPUT_INVALID');
   y.set(output);
   for(let r=0;r<256;r++)total[tile.outBase+r]+=y[r];
   output.fill(0);
  }catch(e){issue=e}
  for(const id of held.reverse()){const ev=await db.evict(id,{reason:'G70_DONE'});if(!ev.evidence?.freed||!ev.evidence?.hostBufferZeroized)throw Error('G70_ZEROIZE_UNVERIFIED');released++}
  if(db.activePhysicalBytes!==0||host.activeHostBytes!==0||host.ownedLeaseCount!==0)throw Error('G70_LEASE_RECONCILIATION_FAILED');
  if(issue)throw issue;
  tiles++;
 }
}catch(e){problem=e}
finally{await worker.terminate()}
if(problem)throw problem;
const actual=Float32Array.from(total),expected=load('expected.bin',1024);let mismatches=0,maxError=0;
for(let i=0;i<1024;i++){let e=Math.abs(actual[i]-expected[i]);maxError=Math.max(maxError,e);if(e>1e-4+1e-4*Math.abs(expected[i]))mismatches++}
console.log(JSON.stringify({status:mismatches?'G70_FAIL':'G70_LDWMD_MATVEC_PASS',tiles,memoryLeasesZeroized:released,perTileAllocatedBytes:capacity,outputSha256:h(Buffer.from(actual.buffer)),mismatches,maxError,elapsedMs:+(performance.now()-start).toFixed(3),productionAccepted:false,fullInference:false},null,2));if(mismatches)process.exitCode=1;
