/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.CANONICAL_SOFTWARE_G36
TAG: LEEWAY.EDGE_GPU.G36.ONE_REQUEST_FORMULA_LDWMD_CPU_DIAGNOSTIC
5WH:
WHAT = Execute Formula and original LeeWay software worker through real LDWMD under one request.
WHY = G26/G32 Formula and G30 host leases were verified in separate diagnostic requests.
WHO = Creator-authorized LeeWay engineering; original production issuers not enrolled.
WHERE = LeeWay-Edge-GPU/scripts/run-g36-live-formula-ldwmd-compute.mjs
WHEN = 2026-10-22
HOW = Strict SHA pinned existing modules, sixteen 256 observations, live Formula receipt and source replay, actual host RAM leases with numeric check.
LICENSE: MIT
ASSURANCE: Partial live original-chain diagnostic only; no protected Veritas PRE/POST or ledger writes.
*/
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {measureLeeWaySoftwareWindow,executeObservedFormula}
  from '../core/canonical-formula-software-observation.mjs';
import {assessG32SoftwareWorkloadEnvelope}
  from '../core/software-workload-policy-candidate.mjs';
import {cpuMatMulNode} from '../fallback/node-cpu.engine.mjs';

const SHA=/^[a-f0-9]{64}$/;
const originalWorkerSha='1979c85797187038517e839dcd6778aeb17bc10d4acc71ef967f044bfad1721c';
const originalEngineSha='e8804f6f708261d2e1d5a0b1e35f1d36f63570cb908a1e305da949d90378d81c';
const originalG30BridgeSha='d45fc2283bdc76ec0006482ae69b7505ae4dd1410ea99d330b85e0cc69c42b3c';
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const assure=(ok,error)=>{if(!ok)throw Error(error)};
const result=async({formulaRoot,ldwmdRoot,requestId='g36-'+randomUUID(),size=256}={})=>{
  assure(typeof requestId==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(requestId),'G36_BAD_REQUEST_ID');
  assure(size===256,'G36_ACCEPTANCE_MATRIX_MUST_BE_256');
  assure(typeof formulaRoot==='string'&&path.isAbsolute(formulaRoot)&&
    typeof ldwmdRoot==='string'&&path.isAbsolute(ldwmdRoot),'G36_PINNED_SOURCE_PATHS_REQUIRED');
  const ownRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const originalWorkerPath=path.join(ownRoot,'fallback','cpu.worker.js');
  const originalEnginePath=path.join(ownRoot,'fallback','node-cpu.engine.mjs');
  const bridgePath=path.join(ldwmdRoot,'automation-runtime','src','vtensor','ldwmd-leeway-cpu-binding.mjs');
  assure(hash(originalWorkerPath)===originalWorkerSha&&hash(originalEnginePath)===originalEngineSha,
    'G36_ORIGINAL_G22_BYTES_DIFFER');
  assure(hash(bridgePath)===originalG30BridgeSha,'G36_ORIGINAL_G30_LDWMD_BRIDGE_CHANGED');
  const {runG30LdwmdOriginalWorker}=await import(pathToFileURL(bridgePath).href);
  assure(typeof runG30LdwmdOriginalWorker==='function','G36_G30_LDWMD_EXPORT_MISSING');
  const observed=await measureLeeWaySoftwareWindow({size,samples:16});
  const formula=await executeObservedFormula({
    formulaRoot,requestId,stateRows:observed.stateRows,inputRanges:observed.ranges
  });
  const available=os.freemem();
  const policy=assessG32SoftwareWorkloadEnvelope({
    requestId,size,measurements:observed,formulaResult:formula,
    hostAvailableBytes:available,hostReservedBytes:Math.ceil(available/4)
  });
  assure(policy.status==='G32_WORKLOAD_MEASURED_ENVELOPE_FIT_CANDIDATE'&&
    policy.minimumAccountedBytes===1572864,'G36_ADVISORY_RESOURCE_FIT_NOT_VERIFIED');
  const A=Float32Array.from({length:size*size},(_,i)=>i%size===Math.floor(i/size)?1:0);
  const B=Float32Array.from({length:size*size},(_,i)=>((i*13)%29)-14);
  const ld=await runG30LdwmdOriginalWorker({
    requestId,sourceSha256:originalWorkerSha,size,A,B,originalWorker:cpuMatMulNode
  });
  assure(ld.status==='G30_ORIGINAL_G22_ON_LDWMD_HOST_INPUT_OUTPUT_BUFFERS'&&
    ld.requestId===requestId&&ld.releaseZeroized===true&&ld.activeHostBytesAfter===0,
    'G36_SAME_REQUEST_LDWMD_RUN_FAILED');
  assure(ld.output.length===B.length&&ld.output.every((v,i)=>v===B[i]),'G36_NUMERICAL_ORACLE_FAILED');
  assure(SHA.test(ld.outputSha256),'G36_OUTPUT_SHA_MISSING');
  return {
    schema:'leeway.g36.live-formula-original-worker-ldwmd.v1',
    status:'PARTIAL_REAL_ORIGINAL_CHAIN_FORMULA_LDWMD_G22_PASS',
    requestId,sourcePins:{
      originalWorkerSha256:originalWorkerSha,originalEngineSha256:originalEngineSha,
      originalLDWMDG30BridgeSha256:originalG30BridgeSha,
      originalFormulaEngineSha256:formula.originalEngineHash,
      originalFormulaAdapterSha256:formula.originalAdapterHash},
    observedFormulaSampleCount:observed.samples,
    measuredMatrixSize:size,
    formulaInputSha256:formula.inputHash,formulaResultSha256:formula.resultHash,
    formulaReceiptName:formula.receiptName,formulaResult:formula.decimalState,
    formulaReceiptReadbackVerified:true,originalFormulaReplayVerified:true,
    g32MemoryEnvelope:policy.status,
    ldwmdLeaseBytes:ld.allocatedHostBytes,
    originalG22OutputSha256:ld.outputSha256,
    originalG22OutputMatchesIndependentReference:true,
    originalWorkerMemoryCopiesRemain:true,
    originalWorkerOutputTemporaryAllocationRemains:true,
    hostRAMZeroizedReleased:true,
    realSoftwareComputeExecuted:true,
    externalGPUProviderUsed:false,
    protectedIssuerAuthenticated:false,formulaWorkloadPolicyApproved:false,
    veritasPREIndependentlySigned:false,veritasPOSTIndependentlySigned:false,
    continuumDurableReadbackVerified:false,receiptLedgerAppended:false,
    learningLedgerAdmitted:false,osGPUAdapterInstalled:false,
    productionAccepted:false
  };
};
export {result as runG36LiveOriginalSoftwarePartialChain};

const a=process.argv.slice(2);
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(a.length!==4||a[0]!=='--formula-root'||a[2]!=='--ldwmd-root'){
   process.stderr.write('USAGE: node scripts/run-g36-live-formula-ldwmd-compute.mjs --formula-root ABSOLUTE --ldwmd-root ABSOLUTE\n');
   process.exitCode=64;
 }else{
   try{console.log(JSON.stringify(await result({formulaRoot:a[1],ldwmdRoot:a[3]}),null,2));}
   catch(e){console.log(JSON.stringify({status:'BLOCKED',reason:e.message,productionAccepted:false},null,2));process.exitCode=1;}
 }
}
