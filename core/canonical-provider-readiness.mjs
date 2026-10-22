/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.CANONICAL_PROVIDER_ADMISSION
TAG: LEEWAY.EDGE_GPU.G24.READ_ONLY_RUNTIME_FABRIC_PROBE
5WH:
WHAT = Observe real canonical upstream provider readiness for LeeWay software compute.
WHY = Local test callbacks and healthy individual services cannot certify a whole pipeline.
WHO = Creator-authorized LeeWay engineering; observer, NOT a grant issuer or signer.
WHERE = LeeWay-Edge-GPU/core/canonical-provider-readiness.mjs
WHEN = 2026-10-22
HOW = Import original Runtime Fabric readiness code and inspect exact loopback services.
LICENSE: MIT
AUTHORITY: Read-only, deliberately cannot authorize or execute production tasks.
*/
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const OK = 'PASS';
const HEX = /^[a-f0-9]{64}$/;
const RUNTIME_PROBE = 'scripts/c3-live-admission-readiness.mjs';
const FULL_PIPELINE = Object.freeze([
  'RUNTIME_FABRIC_SOFTWARE_GRANT','FORMULA_SOFTWARE_WORKLOAD_DECISION',
  'VERITAS_SOFTWARE_PRE','LDWMD_HOST_RAM_LEASE',
  'LEEWAY_SOFTWARE_ENGINE','INDEPENDENT_OUTPUT_READBACK','CONTINUUM_DURABLE_RESULT',
  'VERITAS_SOFTWARE_POST','RECEIPT_LEDGER_CHAIN','LEARNING_LEDGER_EXACT_ADMISSION'
]);
function failure(status, code, ok) { if (!ok) status.push(code); }
function one(value) { return value && typeof value === 'object' && !Array.isArray(value); }

/**
 * Pure evaluator for observations gathered from the original LeeWay authorities.
 * Never returns "production ready"; no numerical health check is an authorization.
 */
export function assessCanonicalSoftwareReadiness(data={}) {
  const blockers=[];
  const formula=data.formula||{};
  const kernel=data.kernel||{};
  const gpu=data.gpu||{};
  const c3=data.c3||{};
  const receipt=data.receipt||{};
  failure(blockers,'FORMULA_GOLDEN_HEALTH_NOT_VERIFIED',
    formula.httpStatus===200 && formula.body?.status==='LEEWAY_FORMULA_V1_PASS' &&
    formula.body?.goldenVectorPass===true);
  failure(blockers,'RUNTIME_KERNEL_UNHEALTHY', kernel.httpStatus===200);
  failure(blockers,'RECEIPT_CHAIN_NOT_HEALTHY',
    receipt.httpStatus===200 && receipt.body?.status==='LEEWAY_RECEIPT_LEDGER_PASS' &&
    receipt.body?.verification?.valid===true);
  failure(blockers,'LEEWAY_GPU_SERVICE_ID_UNBOUND',
    gpu.httpStatus===200 && gpu.body?.serviceId==='leeway.gpu.service');
  failure(blockers,'SOFTWARE_BACKEND_NOT_EXPOSED_AS_QUALIFIED_PROVIDER',
    gpu.body?.softwareProviderQualified===true &&
    gpu.body?.softwareCapability==='leeway.gpu.software.compute');
  failure(blockers,'REAL_RUNTIME_ISSUER_NOT_ADMITTED',
    gpu.body?.authorization==='SOFTWARE_GPU_ISSUER_QUALIFIED');
  failure(blockers,'REAL_FORMULA_SOFTWARE_POLICY_NOT_ADMITTED',
    gpu.body?.formula==='SOFTWARE_WORKLOAD_POLICY_QUALIFIED');
  failure(blockers,'LDWMD_HOST_RAM_ADMISSION_NOT_QUALIFIED',
    gpu.body?.ldwmd==='HOST_RAM_LEASE_VERIFIED');
  failure(blockers,'OWNER_CONTINUUM_BINDING_NOT_QUALIFIED',
    gpu.body?.continuum==='SOFTWARE_DURABLE_READBACK_VERIFIED');
  failure(blockers,'CANONICAL_VERITAS_SOFTWARE_PROOF_NOT_QUALIFIED',
    gpu.body?.veritas==='SOFTWARE_PRE_POST_AUTHENTICATED');
  failure(blockers,'C3_POST_RECEIPT_PROVIDERS_UNQUALIFIED',
    c3.status==='VERIFIED_POST_RECEIPT_ADMISSION_READY' &&
    c3.independentIssuerVerified===true && c3.veritasAdmissionVerified===true &&
    c3.learningLedgerReadbackVerified===true);
  // A physical-GPU C3 success cannot be silently promoted to software-GPU admission.
  failure(blockers,'FRESH_SOFTWARE_ONLY_SIGNED_CHAIN_MISSING',
    data.softwareChain?.status==='INDEPENDENTLY_CERTIFIED_SOFTWARE_GPU_EXECUTION' &&
    data.softwareChain?.requestScoped===true &&
    data.softwareChain?.hostCpuOnly===true &&
    data.softwareChain?.hardwareGpuInvocationCount===0 &&
    data.softwareChain?.veritasSignedAndIndependentlyVerified===true &&
    data.softwareChain?.durableLedgerReadback===true &&
    HEX.test(data.softwareChain?.sourceManifestSha256||''));
  return Object.freeze({
    status:'BLOCKED', // Intentionally read-only: only real Runtime Fabric can admit.
    scope:'LEEWAY_SOFTWARE_GPU_G24_REAL_AUTHORITY_INVENTORY',
    advisoryBlockers:blockers,
    observedStageCount:FULL_PIPELINE.length,
    requiredStages:FULL_PIPELINE,
    independentProductionCertificate:false,
    productionAdmissionAuthorized:false,
    productionExecutionAttempted:false,
    mutationPerformed:false,
    observations:{
      formulaHttpStatus:formula.httpStatus??null,
      runtimeKernelHttpStatus:kernel.httpStatus??null,
      receiptHttpStatus:receipt.httpStatus??null,
      gpuServiceHttpStatus:gpu.httpStatus??null,
      gpuServiceMode:gpu.body?.effectiveMode??null,
      c3ReadinessStatus:c3.status??'UNOBSERVED',
      c3FailureCodes:Array.isArray(c3.failures)?c3.failures:[]
    }
  });
}
async function getJson(url, fetcher, ms=3000) {
  try {
    const response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(ms)});
    const text=await response.text();
    if (text.length>131072) return {httpStatus:response.status,body:null,error:'RESPONSE_OVERSIZE'};
    return {httpStatus:response.status,body:JSON.parse(text)};
  } catch(error) { return {httpStatus:null,body:null,error:error?.name==='TimeoutError'?'TIMEOUT':'UNAVAILABLE'}; }
}
/**
 * Exact loopback endpoints. One dynamic import of original Runtime Fabric
 * observer with a real SHA256 file pin; no shadow evaluator or registry writer.
 */
export async function probeCanonicalSoftwarePipeline({runtimeRoot,fetcher=fetch}={}) {
  if (typeof runtimeRoot!=='string' || !path.isAbsolute(runtimeRoot))
    throw Error('G24_CANONICAL_RUNTIME_ROOT_REQUIRED');
  const observerPath=path.join(runtimeRoot,RUNTIME_PROBE);
  const registryPath=path.join(runtimeRoot,'provider.registry.json');
  const observerBytes=fs.readFileSync(observerPath);
  const registryBytes=fs.readFileSync(registryPath);
  const observerSha256=sha256(observerBytes), registrySha256=sha256(registryBytes);
  const observer=await import(pathToFileURL(observerPath).href);
  if(typeof observer.observeC3AdmissionReadiness!=='function')
    throw Error('G24_RUNTIME_FABRIC_OBSERVER_EXPORT_MISSING');
  const [c3,formula,kernel,receipt,gpu]=await Promise.all([
    observer.observeC3AdmissionReadiness({registryPath}),
    getJson('http://127.0.0.1:4001/runtime/formula/v1/health',fetcher),
    getJson('http://127.0.0.1:4002/health',fetcher),
    getJson('http://127.0.0.1:4104/health',fetcher),
    getJson('http://127.0.0.1:4178/v1/status',fetcher)
  ]);
  const assessment=assessCanonicalSoftwareReadiness({c3,formula,kernel,receipt,gpu});
  return Object.freeze({
    ...assessment,
    originalAuthoritySources:{runtimeRoot,originalC3ObserverPath:observerPath,
      originalC3ObserverSha256:observerSha256,originalRegistryPath:registryPath,
      originalRegistrySha256:registrySha256},
    observedAt:new Date().toISOString()
  });
}
