/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FORMULA_DOMAIN_SEMANTICS
TAG: LEEWAY.G32.MEASURED_SOFTWARE_WORKLOAD_ENVELOPE
5WH:
WHAT = Interpret measured G26 Formula input in a bounded software-compute resource envelope.
WHY = Formula's numerical state alone cannot authorize a 256x256 workload.
WHO = Creator-authorized LeeWay engineering; independent policy authority not yet enrolled.
WHERE = LeeWay-Edge-GPU/core/software-workload-policy-candidate.mjs
WHEN = 2026-10-22
HOW = Verify 16x6 measurements and original Formula receipt, account for LDWMD buffers and G22 copies.
LICENSE: MIT
ASSURANCE: Non-authoritative policy candidate; cannot issue scheduling or execution grants.
*/
const reject=reason=>Object.freeze({status:'BLOCKED',reason,
  ownerPolicyApproved:false,productionAdmissionAuthorized:false});
const correctHash=h=>typeof h==='string'&&/^[a-f0-9]{64}$/.test(h);
const median=values=>{const s=[...values].sort((a,b)=>a-b),k=s.length/2;return (s[k-1]+s[k])/2};
const engine='6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e';
const adapter='3264d0a97a76246b31c5ca759b5993188cbae10422eb153ac395e3fb5e2470e0';
export function assessG32SoftwareWorkloadEnvelope({
  requestId,size,measurements,formulaResult,hostAvailableBytes,hostReservedBytes=0
}={}){
  if(!Number.isInteger(size)||size<1||size>512||typeof requestId!=='string'||requestId.length<8)
    return reject('G32_REQUEST_OR_SIZE_INVALID');
  const rows=measurements?.stateRows;
  if(measurements?.source!=='ACTUAL_LEEWAY_SOFTWARE_CPU_WORKER'||
    measurements?.noPhysicalGpuProvider!==true||!Array.isArray(rows)||rows.length!==16||
    rows.some(r=>!Array.isArray(r)||r.length!==6||r.some(x=>!Number.isFinite(x))||
      r[0]!==1||r[1]<=0||r[2]<0||r[2]>1||r[3]<0||r[3]>1||r[4]<=0||r[5]<=0))
    return reject('G32_MEASURED_G26_STATES_NOT_VERIFIED');
  if(formulaResult?.status!=='CANONICAL_FORMULA_EXECUTION_REPLAY_VERIFIED_POLICY_UNQUALIFIED'||
    formulaResult.requestId!==requestId||
    formulaResult.originalEngineHash!==engine||formulaResult.originalAdapterHash!==adapter||
    !correctHash(formulaResult.inputHash)||!correctHash(formulaResult.resultHash)||
    formulaResult.serviceResultMatchesPinnedReference!==true||
    formulaResult.sourceReferenceVerified!==true||
    formulaResult.externalGpuProviderUsed!==false)
    return reject('G32_CANONICAL_FORMULA_TRACE_NOT_VERIFIED');
  if(!Number.isSafeInteger(hostAvailableBytes)||hostAvailableBytes<=0||
    !Number.isSafeInteger(hostReservedBytes)||hostReservedBytes<0)
    return reject('G32_HOST_CAPACITY_UNVERIFIED');
  const perMatrixBytes=size*size*4;
  // Original G30 LDWMD A/B/C + original G22 copied A/B and temporary output.
  const actualLeaseBytes=3*perMatrixBytes;
  const knownWorkerCopyBytes=3*perMatrixBytes;
  const minimumAccountedBytes=actualLeaseBytes+knownWorkerCopyBytes;
  const usableBytes=Math.max(0,hostAvailableBytes-hostReservedBytes);
  const observedLatencyMs=median(rows.map(x=>x[5]));
  const observedRate=median(rows.map(x=>x[1]));
  const budgetFit=usableBytes>=minimumAccountedBytes;
  return Object.freeze({
    status:budgetFit?'G32_WORKLOAD_MEASURED_ENVELOPE_FIT_CANDIDATE':'G32_INSUFFICIENT_HOST_RAM',
    requestId,size,dimensionSemantics:['correctness','observedOpsPerSecond',
      'hostFreeMemoryFraction','processResidentMemoryFraction',
      'measuredInputOutputBytes','latencyMs'],
    formulaInputHash:formulaResult.inputHash,
    formulaResultHash:formulaResult.resultHash,
    observedMedianLatencyMs:observedLatencyMs,observedMedianRate:observedRate,
    ldwmdLeaseBytes:actualLeaseBytes,originalG22CopyBytes:knownWorkerCopyBytes,
    minimumAccountedBytes,availableAfterReserveBytes:usableBytes,
    budgetFit,workerRuntimeScratchBeyondTheseBuffersUnquantified:true,
    runtimeIssuerVerified:false,ownerPolicyApproved:false,
    independentVeritasPolicySignatureVerified:false,
    productionAdmissionAuthorized:false,externalGpuProviderUsed:false
  });
}
