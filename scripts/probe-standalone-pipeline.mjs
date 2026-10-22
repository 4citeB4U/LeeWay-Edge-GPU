/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.PROVIDER_QUALIFICATION
TAG: LEEWAY.EDGE_GPU.G24.REAL_AUTHORITY_READ_ONLY_ENTRY
5WH:
WHAT = Run the canonical LeeWay GPU software provider inventory probe.
WHY = Prevent synthetic contracts from being misreported as live governance.
WHO = Creator-authorized LeeWay engineering; read-only audit role.
WHERE = LeeWay-Edge-GPU/scripts/probe-standalone-pipeline.mjs
WHEN = 2026-10-22
HOW = Exact runtime-root argument; call original Runtime Fabric observer.
LICENSE: MIT
AUTHORITY: Never deploys, signs, registers, writes or executes compute.
*/
import {probeCanonicalSoftwarePipeline} from '../core/canonical-provider-readiness.mjs';
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--runtime-root' || !args[1]) {
  process.stderr.write('USAGE: node scripts/probe-standalone-pipeline.mjs --runtime-root ABSOLUTE_PATH\n');
  process.exitCode=64;
} else {
  try {
    const result=await probeCanonicalSoftwarePipeline({runtimeRoot:args[1]});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    process.exitCode= result.advisoryBlockers.length ? 2 : 3;
    // Even zero advisory blockers only means inventory green, NOT production admission.
  } catch(error) {
    process.stderr.write('G24_READ_ONLY_AUDIT_FAILED '+String(error?.code||error?.message||'UNKNOWN')+'\n');
    process.exitCode=1;
  }
}
