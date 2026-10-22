/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.FORMULA_SOFTWARE_POLICY_DIAGNOSTIC
TAG: LEEWAY.G32.FRESH_256_WORKLOAD_REAL_FORMULA_PROBE
5WH:
WHAT = Evaluate 16 observed 256x256 LeeWay-only software runs under real canonical Formula.
WHY = Small G26 samples are not enough to assess the intended 256x256 task envelope.
WHO = Creator-authorized engineering, not independent issuer or Veritas signer.
WHERE = LeeWay-Edge-GPU/scripts/run-g32-software-workload-probe.mjs
WHEN = 2026-10-22
HOW = Real worker -> real Formula service -> source-pinned replay -> non-authoritative memory advisory.
LICENSE: MIT
*/
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {measureLeeWaySoftwareWindow,executeObservedFormula}
  from '../core/canonical-formula-software-observation.mjs';
import {assessG32SoftwareWorkloadEnvelope}
  from '../core/software-workload-policy-candidate.mjs';
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--formula-root'||!path.isAbsolute(args[1])){
  process.stderr.write('USAGE: node scripts/run-g32-software-workload-probe.mjs --formula-root ABSOLUTE_FORMULA_CHECKOUT\n');
  process.exitCode=64;
}else{
  try{
    const measured=await measureLeeWaySoftwareWindow({size:256,samples:16});
    const requestId='g32-software-'+randomUUID();
    const formula=await executeObservedFormula({
      formulaRoot:args[1],stateRows:measured.stateRows,
      inputRanges:measured.ranges,requestId
    });
    const hostAvailableBytes=os.freemem();
    const hostReservedBytes=Math.floor(hostAvailableBytes/4);
    const advisory=assessG32SoftwareWorkloadEnvelope({
      requestId,size:256,measurements:measured,formulaResult:formula,
      hostAvailableBytes,hostReservedBytes
    });
    process.stdout.write(JSON.stringify({
      status:'G32_REAL_FORMULA_SOFTWARE_DIAGNOSTIC_COMPLETE',
      requestId,originalWorkerSamples:16,
      targetMatrixSize:256,formulaInputSha256:formula.inputHash,
      formulaResultSha256:formula.resultHash,formulaReceiptName:formula.receiptName,
      formulaDecimalState:formula.decimalState,
      hostAvailableBytes,diagnosticUnapprovedReserveBytes:hostReservedBytes,
      advisory,protectedIssuerVerified:false,
      productionPolicyApproved:false,productionExecutionAttempted:false
    },null,2)+'\n');
    process.exitCode=advisory.status==='G32_WORKLOAD_MEASURED_ENVELOPE_FIT_CANDIDATE'?0:2;
  }catch(error){
    process.stdout.write(JSON.stringify({status:'BLOCKED',reason:error?.code||error?.message,
      productionPolicyApproved:false,productionExecutionAttempted:false},null,2)+'\n');
    process.exitCode=1;
  }
}
