/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FORMULA_OBSERVATION
TAG: LEEWAY.EDGE_GPU.G26.CANONICAL_FORMULA_LIVE_REPLAY
5WH:
WHAT = Compare real Formula service execution with pinned canonical offline replay.
WHY = A golden-vector test alone does not connect Formula to software GPU workload.
WHO = Creator-authorized LeeWay engineering, without production policy/issuer authority.
WHERE = LeeWay-Edge-GPU/core/canonical-formula-software-observation.mjs
WHEN = 2026-10-22
HOW = Hash-verify original engine/adapter, send measured 16x6 runtime rows, validate service receipt/readback.
LICENSE: MIT
ASSURANCE: Diagnostic Formula execution; does not certify execution policy, Veritas, LDWMD or production.
*/
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {cpuMatMulNode} from '../fallback/node-cpu.engine.mjs';

const HASH = /^[a-f0-9]{64}$/;
const VALID_ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,119}$/;
const ENGINE_PIN = '6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e';
const ADAPTER_PIN = '3264d0a97a76246b31c5ca759b5993188cbae10422eb153ac395e3fb5e2470e0';
const DEPENDENCY_PINS = Object.freeze({
  'canonical-input.mjs':'4087fc14a9f1f44eb46d9d6417156176794e2acc72ee9bf481f21a5d0abe5236',
  'rational.mjs':'5d36ff407256ddc2858b2e6747ea1091b99a8d787b7b840d912a6c9968c35264',
  'base64-codec.mjs':'3d66c4a42a29733901564c8502ddf23b2398ca94860f80a9bc1611816794276d'
});
const SUBPATH = path.join('runtime','canonical','leeway-formula','v1');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const requireValue=(ok,code)=>{if(!ok)throw Object.assign(new Error(code),{code});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ranges = Object.freeze([[0,1],[0,5000000000],[0,1],[0,1],[0,1e10],[0,30000]]);
const fetchJson=async(fetcher,url,options)=> {
  const r=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(12000),...options});
  requireValue(r?.ok===true,'G26_FORMULA_HTTP_'+String(r?.status||'UNAVAILABLE'));
  return r.json();
};
const safeReceiptName=receiptPath=>{
  requireValue(typeof receiptPath==='string' &&
    (path.isAbsolute(receiptPath) || path.win32.isAbsolute(receiptPath)),
    'G26_FORMULA_RECEIPT_PATH_INVALID');
  return path.win32.basename(receiptPath);
};
export const G26_FORMULA_RANGES=ranges;

/** 16 fresh measured G22 CPU-only samples. All states represent observed values. */
export async function measureLeeWaySoftwareWindow({size=2, samples=16}={}) {
  requireValue(Number.isInteger(size)&&size>=1&&size<=256&&samples===16,
    'G26_OBSERVATION_DIMENSION_INVALID');
  const A=new Float32Array(size*size), B=new Float32Array(size*size);
  for(let i=0;i<A.length;i++){A[i]=((i*11)%13)-6;B[i]=((i*7)%9)-4;}
  const oracle=new Float32Array(size*size);
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){
    let sum=0;for(let k=0;k<size;k++)sum+=A[row*size+k]*B[k*size+col];
    oracle[row*size+col]=sum;
  }
  const rows=[];
  for(let i=0;i<samples;i++){
    const started=performance.now();
    const output=await cpuMatMulNode(A,B,size,{denyExternalProviders:true,timeoutMs:10000});
    const elapsedMs=performance.now()-started;
    const correct=output.length===oracle.length&&output.every((n,j)=>n===oracle[j]);
    requireValue(correct,'G26_SOFTWARE_SAMPLE_MATH_MISMATCH');
    const rss=process.memoryUsage().rss, total=os.totalmem();
    rows.push([
      1, Number((2*size*size*size)/(elapsedMs/1000)),
      Math.min(os.freemem()/total,1),
      Math.min(rss/total,1),
      A.byteLength+B.byteLength+output.byteLength,
      elapsedMs
    ]);
  }
  return Object.freeze({
    stateRows:rows,ranges:ranges.map(x=>[...x]),
    samples,source:'ACTUAL_LEEWAY_SOFTWARE_CPU_WORKER',
    noPhysicalGpuProvider:true,
    model:'Q=correctness;V=measured operation rate;H=free memory fraction;R=process RSS ratio;S=matrix I/O bytes;L=elapsed milliseconds',
    interpretation:'OBSERVED_STATE_ONLY_NOT_EXECUTION_AUTHORIZATION'
  });
}

/**
 * The same exact, independently pinned source is reused for a replay. This
 * does not prove the Formula service's deployed bytes are identical to GitHub.
 */
export async function replayCanonicalFormula({formulaRoot, stateRows, inputRanges}={}) {
  requireValue(typeof formulaRoot==='string'&&path.isAbsolute(formulaRoot),
    'G26_FORMULA_REFERENCE_ROOT_REQUIRED');
  const dir=path.join(formulaRoot,SUBPATH);
  const enginePath=path.join(dir,'leeway-formula-v1.mjs');
  const adapterPath=path.join(dir,'adapters','runtime-state-v1.mjs');
  const engineHash=sha(fs.readFileSync(enginePath)),adapterHash=sha(fs.readFileSync(adapterPath));
  requireValue(engineHash===ENGINE_PIN&&adapterHash===ADAPTER_PIN&&
    Object.entries(DEPENDENCY_PINS).every(([name,expected])=>
      sha(fs.readFileSync(path.join(dir,name)))===expected),
    'G26_FORMULA_SOURCE_PIN_MISMATCH');
  const engine=await import(pathToFileURL(enginePath).href);
  const adapter=await import(pathToFileURL(adapterPath).href);
  requireValue(engine.verifyGolden().pass===true,'G26_FORMULA_GOLDEN_INVALID');
  requireValue(Array.isArray(stateRows)&&stateRows.length===16&&
    stateRows.every(row=>Array.isArray(row)&&row.length===6&&row.every(Number.isFinite)),
    'G26_FORMULA_OBSERVATIONS_INVALID');
  const encoded=adapter.runtimeStateV1.toMatrix({stateRows,ranges:inputRanges});
  const replay=engine.evaluate(encoded.matrix);
  requireValue(replay.formulaId==='LEEWAY-FORMULA-v1.0'&&HASH.test(replay.resultHash),
    'G26_FORMULA_REPLAY_INVALID');
  return {source:{engineHash,adapterHash},encoded,replay};
}

/** An actual canonical /evaluate receipt is generated; no other LeeWay ledger is mutated. */
export async function executeObservedFormula({
  formulaRoot,stateRows,inputRanges=G26_FORMULA_RANGES,requestId='g26-'+randomUUID(),
  formulaBaseUrl='http://127.0.0.1:4001/runtime/formula/v1',fetcher=fetch
}={}){
  requireValue(VALID_ID.test(requestId),'G26_REQUEST_ID_INVALID');
  const reference=await replayCanonicalFormula({formulaRoot,stateRows,inputRanges});
  const health=await fetchJson(fetcher,formulaBaseUrl+'/health');
  requireValue(health.status==='LEEWAY_FORMULA_V1_PASS'&&
    health.kernelIntegrity==='VERIFIED_AT_STARTUP'&&
    health.goldenVectorPass===true,'G26_FORMULA_SERVICE_UNQUALIFIED');
  const req={adapterId:'runtime-state-v1',caller:requestId,traceId:requestId,
    input:{stateRows,ranges:inputRanges}};
  const response=await fetchJson(fetcher,formulaBaseUrl+'/evaluate',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(req)
  });
  requireValue(response.formulaId==='LEEWAY-FORMULA-v1.0'&&
    response.adapterId==='runtime-state-v1'&&
    response.inputHash===reference.replay.inputHash&&
    response.resultHash===reference.replay.resultHash&&
    same(response.decimalState,reference.replay.decimalState)&&
    same(response.base64State,reference.replay.base64State)&&
    response.requestedTraceId===requestId&&
    typeof response.hostTraceId==='string'&&response.hostTraceId.length>0,
    'G26_FORMULA_RESULT_OR_PROVENANCE_MISMATCH');
  const receiptName=safeReceiptName(response.receiptPath);
  const last=await fetchJson(fetcher,formulaBaseUrl+'/last');
  requireValue(last?.status==='completed'&&last.formulaId===response.formulaId&&
    last.adapterId===response.adapterId&&last.caller===requestId&&
    last.traceId===response.hostTraceId&&last.inputHash===response.inputHash&&
    last.resultHash===response.resultHash&&last.receiptPath===response.receiptPath&&
    same(last.decimalState,reference.replay.decimalState)&&
    same(last.base64State,reference.replay.base64State)&&
    same(last.inputRows,reference.encoded.matrix),
    'G26_FORMULA_LAST_READBACK_MISMATCH');
  const listing=await fetchJson(fetcher,formulaBaseUrl+'/receipts');
  requireValue(Array.isArray(listing.receipts)&&listing.receipts.includes(receiptName),
    'G26_FORMULA_RECEIPT_NOT_LISTED');
  return Object.freeze({
    status:'CANONICAL_FORMULA_EXECUTION_REPLAY_VERIFIED_POLICY_UNQUALIFIED',
    requestId,formulaId:response.formulaId,adapterId:response.adapterId,
    inputHash:response.inputHash,resultHash:response.resultHash,
    decimalState:response.decimalState,base64State:response.base64State,
    originalEngineHash:reference.source.engineHash,
    originalAdapterHash:reference.source.adapterHash,
    receiptName,liveReceiptReadbackSha256:sha(Buffer.from(JSON.stringify(last))),
    sourceReferenceVerified:true,serviceResultMatchesPinnedReference:true,
    softwareGpuWorkloadPolicyQualified:false,
    runtimeIssuerVerified:false,veritasSigned:false,
    ldwmdLeaseIssued:false,learningLedgerAdmitted:false,
    productionAccepted:false,externalGpuProviderUsed:false
  });
}
