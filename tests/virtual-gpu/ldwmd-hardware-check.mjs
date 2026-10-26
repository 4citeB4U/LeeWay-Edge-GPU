/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.LDWMD_HARDWARE_PROBE.G2
WHAT: Exercise the real external LDWMD class with bounded WebGPU allocation/readback/free callbacks.
WHY: Separate accounting mocks from actual API resources without installing a memory provider or driver.
WHO: Creator-authorized Agent Lee. WHERE: Isolated qualification browser and candidate Runtime Fabric source.
WHEN: Explicit --ldwmd-root and passed regression evidence only.
HOW: Fixed 16 KiB synthetic buffers, independent SHA-256 comparison, protected eviction, cleanup.
ROLES: VERIFY. LICENSE: MIT
*/
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';
export async function runLdWmdHardwareCheck({cdp,sourceRoot,regressionFile}){
 const root=path.resolve(sourceRoot),relative='automation-runtime/src/vtensor/vram-database.mjs';
 const checked=JSON.parse(fs.readFileSync(regressionFile,'utf8').replace(/^\uFEFF/,''));
 assert.equal(checked.outcome,'PASS_ACCOUNTING_STATE_TESTS');assert.equal(checked.passed,checked.total);
 const source=path.join(root,relative);const digest=crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
 assert.equal(digest,checked.sourceHashes[relative]);
 assert.equal(execFileSync('git',['-C',root,'remote','get-url','origin'],{encoding:'utf8'}).trim(),'https://github.com/4citeB4U/Leeway-Runtime-Fabric.git');
 const {LeeWayDeviceWorkingMemoryDatabase:Database}=await import(pathToFileURL(source).href);
 const evaluate=async expression=>{
  const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},15000);
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||'MEMORY_PROBE_BROWSER_ERROR');return r.result.value;
 };
 const tests=[];const check=(name,detail)=>tests.push({name,status:'PASS',detail});
 let allocations=0,frees=0;
 const byteLength=16384;const data=Uint32Array.from({length:byteLength/4},(_,i)=>(i*17+0x1234)>>>0);
 const expected=crypto.createHash('sha256').update(new Uint8Array(data.buffer)).digest('hex');
 try{
  const adapter=await evaluate(`(async()=>{
   const a=await navigator.gpu.requestAdapter();if(!a)throw Error('MEMORY_PROBE_NO_ADAPTER');const device=await a.requestDevice();
   window.__leeMemoryProbe={device,leases:new Map(),sequence:0};
   return {vendor:a.info?.vendor,architecture:a.info?.architecture,isFallbackAdapter:a.info?.isFallbackAdapter??null};
  })()`);
  const hardware={physicalVerificationState:'GPU_API_READBACK_NOT_PHYSICAL_VRAM_ATTRIBUTION',
   async allocate(request){
    assert.equal(request.byteLength,byteLength);allocations++;
    const result=await evaluate(`(async()=>{
     const p=window.__leeMemoryProbe,d=p.device;const size=16384;
     const buffer=d.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC});
     const staging=d.createBuffer({size,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
     try{
      d.queue.writeBuffer(buffer,0,Uint32Array.from({length:size/4},(_,i)=>(i*17+0x1234)>>>0));
      const e=d.createCommandEncoder();e.copyBufferToBuffer(buffer,0,staging,0,size);d.queue.submit([e.finish()]);
      await staging.mapAsync(GPUMapMode.READ);const bytes=new Uint8Array(staging.getMappedRange()).slice();staging.unmap();
      const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
      const handle='probe-'+(++p.sequence);p.leases.set(handle,buffer);return {handle,sha256,bytes:size};
     }catch(error){buffer.destroy();throw error;}finally{staging.destroy();}
    })()`);
    assert.equal(result.sha256,expected);return {handle:result.handle,evidence:{state:'GPU_API_READBACK_MATCH',sha256:result.sha256,bytes:byteLength}};
   },
   async free({handle}){
    assert.match(handle,/^probe-\d+$/);frees++;
    return evaluate(`(async()=>{const p=window.__leeMemoryProbe;const b=p.leases.get(${JSON.stringify(handle)});if(!b)return {freed:false,state:'UNKNOWN_HANDLE'};await p.device.queue.onSubmittedWorkDone();b.destroy();p.leases.delete(${JSON.stringify(handle)});return {freed:true,state:'GPU_API_BUFFER_DESTROYED'};})()`);
   }
  };
  const db=new Database({deviceId:'LOCAL_DIAGNOSTIC_GPU',deviceGeneration:'TEST_SESSION',totalVramBytes:32768,hardwareAdapter:hardware,headroomPolicy:{minimumBytes:0}});
  const record=id=>({tensorId:id,contentHash:expected,blockHash:expected,shape:[byteLength/4],dtype:'u32',logicalBytes:byteLength,physicalBytes:byteLength,deviceId:'LOCAL_DIAGNOSTIC_GPU',deviceGeneration:'TEST_SESSION',memoryClass:'SYNTHETIC_TEST_DATA',residencyState:'UNBOUND',trustState:'TEST_FIXTURE',pinState:false});
  for(const id of ['a','b','c'])db.register(record(id));
  await db.admit('a');assert.equal(db.activePhysicalBytes,byteLength);check('LDWMD_REAL_GPU_ALLOCATION_READBACK',{bytes:byteLength,sha256:expected});
  await db.admit('a');assert.equal(allocations,1);check('LDWMD_IDEMPOTENT_HARDWARE_ADMISSION',{allocations});
  await db.admit('b');db.get('b').executing=true;
  await assert.rejects(()=>db.evict('b'),/EVICTION_INELIGIBLE/);check('LDWMD_EXECUTING_GPU_LEASE_PROTECTED',{frees});
  await db.admit('c');assert.equal(db.get('a').residencyState,'EVICTED');assert.equal(db.activePhysicalBytes,32768);assert.equal(frees,1);
  check('LDWMD_REAL_GPU_EVICTION_BEFORE_NEW_ADMISSION',{allocations,frees,budgetBytes:32768,budgetClass:'TEST_APPLICATION_BUDGET_NOT_PHYSICAL_VRAM_TOTAL'});
  db.get('b').executing=false;await db.evict('b');await db.evict('c');assert.equal(db.activePhysicalBytes,0);
  const remaining=await evaluate('window.__leeMemoryProbe.leases.size');assert.equal(remaining,0);check('LDWMD_ALL_TEST_GPU_ALLOCATIONS_RELEASED',{allocations,frees,remaining});
  const receipt=db.receipt();assert.equal(receipt.physicalVerificationState,'GPU_API_READBACK_NOT_PHYSICAL_VRAM_ATTRIBUTION');
  return {outcome:'PASS_BOUNDED_LDWMD_GPU_API_INTEGRATION',tests,passed:tests.length,total:tests.length,adapter,
   sourceSha256:digest,sourceBaseline:checked.baselineCommit,allocationBytes:byteLength,allocations,frees,
   memoryBudgetClass:'32_KIB_DIAGNOSTIC_CAP_NOT_DEVICE_TOTAL',physicalVramAttribution:'UNVERIFIED',
   scope:'LOCAL_DIAGNOSTIC_CALLBACKS_NOT_PRODUCTION_LDWMD_BINDING',formulaExecution:'NOT_EXECUTED',learningLedger:'NOT_UPDATED',receipt};
 }finally{
  await evaluate(`(()=>{const p=window.__leeMemoryProbe;if(p){for(const b of p.leases.values())b.destroy();p.leases.clear();p.device.destroy();delete window.__leeMemoryProbe;}return true;})()`).catch(()=>{});
 }
}
