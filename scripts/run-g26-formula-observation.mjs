/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.G26.DIAGNOSTIC_ENTRY
TAG: LEEWAY.G26.FORMULA_LIVE_REPLAY_CLI
5WH:
WHAT = Execute and verify actual original Formula against real LeeWay CPU observations.
WHY = Prove Formula participates in the standalone software compute research path.
WHO = Creator-authorized LeeWay engineering; diagnostic only, no issuer or Ledger writes.
WHERE = LeeWay-Edge-GPU/scripts/run-g26-formula-observation.mjs
WHEN = 2026-10-22
HOW = Require source-root flag, measure 16 real samples, issue one canonical Formula receipt.
LICENSE: MIT
*/
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {measureLeeWaySoftwareWindow,executeObservedFormula} from '../core/canonical-formula-software-observation.mjs';
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--formula-root'||!path.isAbsolute(args[1])){
  process.stderr.write('USAGE: node scripts/run-g26-formula-observation.mjs --formula-root ABSOLUTE_PINNED_FORMULA_CHECKOUT\n');
  process.exitCode=64;
}else{
  try{
    const observed=await measureLeeWaySoftwareWindow({size:2,samples:16});
    const proof=await executeObservedFormula({formulaRoot:args[1],
      stateRows:observed.stateRows,inputRanges:observed.ranges,
      requestId:'g26-software-'+randomUUID()});
    process.stdout.write(JSON.stringify({schema:'leeway.g26.canonical-formula-software-observation.v1',
      sampleCount:observed.samples,samplingEngine:observed.source,dimensions:observed.model,
      ...proof},null,2)+'\n');
    process.exitCode=0;
  }catch(error){
    process.stdout.write(JSON.stringify({status:'BLOCKED',reason:error.code||error.message,
      productionAccepted:false,softwareGpuWorkloadPolicyQualified:false,
      learningLedgerAdmitted:false},null,2)+'\n');
    process.exitCode=1;
  }
}
