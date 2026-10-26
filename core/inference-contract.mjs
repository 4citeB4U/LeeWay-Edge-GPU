/*
REGION: LEEWAY.EDGE_GPU.INFERENCE
TAG: LEEWAY.EDGE_GPU.INFERENCE_CONTRACT.G9
WHAT: Request and host-binding validation for the existing exclusive LeeWay inference path.
WHY: Neither an arbitrary approval callback nor a native model server qualifies ecosystem execution.
WHO: Creator-authorized Agent Lee. ROLES: ASSESS VERIFY.
WHERE: Existing GPU capability; Runtime Fabric still supplies and authenticates the binding.
WHEN: Before model allocation and before returned output is released.
HOW: Immutable identities, correlated receipts, bounded token/byte budgets; deny missing dependencies.
LICENSE: MIT. This is a consumer contract, not a new Formula, registry, security root or model harness.
*/
export const FORMULA_ENGINE_SHA256='6502791bba909d7481db3a204f3cbf67b1dc06a4b76a73c797d709408341d63e';
export class InferenceContractError extends Error{
 constructor(code){super(code);this.name='InferenceContractError';this.code=code;}
}
const fail=code=>{throw new InferenceContractError(code);};
export const isSha256=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const identity=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,159}$/.test(value);
export async function inferenceHash(value){const bytes=new TextEncoder().encode(JSON.stringify(value));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
export function snapshotInferenceRequest(task){
 if(task?.type!=='AI_INFERENCE')fail('INFERENCE_REQUEST_TYPE_INVALID');
 if(!identity(task.requestId)||!identity(task.sessionId))fail('INFERENCE_REQUEST_IDENTITY_REQUIRED');
 if(!isSha256(task.modelSha256)||!isSha256(task.tokenizerSha256)||!isSha256(task.implementationSha256))fail('INFERENCE_SOURCE_IDENTITY_REQUIRED');
 if(!Number.isSafeInteger(task.contextLimit)||task.contextLimit<8||task.contextLimit>256)fail('INFERENCE_CONTEXT_PROFILE_UNSUPPORTED');
 if(!Number.isSafeInteger(task.maxNewTokens)||task.maxNewTokens<1||task.maxNewTokens>64)fail('INFERENCE_TOKEN_LIMIT_INVALID');
 if(!Array.isArray(task.inputIds)||task.inputIds.length<1||task.inputIds.length+task.maxNewTokens>task.contextLimit||!task.inputIds.every(v=>Number.isSafeInteger(v)&&v>=0&&v<1048576))fail('INFERENCE_INPUT_TOKENS_INVALID');
 if(task.allowCpuFallback===true||task.allowRemote===true||task.externalModelServer===true)fail('INFERENCE_ALTERNATE_EXECUTION_FORBIDDEN');
 return Object.freeze({type:'AI_INFERENCE',requestId:task.requestId,sessionId:task.sessionId,modelSha256:task.modelSha256,
  tokenizerSha256:task.tokenizerSha256,implementationSha256:task.implementationSha256,contextLimit:task.contextLimit,
  maxNewTokens:task.maxNewTokens,inputIds:Object.freeze(task.inputIds.slice()),execution:'LEEWAY_WGSL_TRANSFORMER'});
}
export function requireRuntimeInferenceBinding(binding){
 if(!binding||binding.owner!=='LEEWAY_RUNTIME_FABRIC')fail('INFERENCE_RUNTIME_BINDING_UNBOUND');
 for(const name of ['authorize','verifyFormulaDecision','revalidate','verify','commit','rollback','release'])if(typeof binding[name]!=='function')fail('INFERENCE_BINDING_METHOD_MISSING:'+name);
 return binding;
}
export function validateInferenceGrant(grant,request,requestHash){
 if(!grant||grant.requestHash!==requestHash||grant.requestId!==request.requestId||grant.sessionId!==request.sessionId||grant.modelSha256!==request.modelSha256||grant.tokenizerSha256!==request.tokenizerSha256||grant.implementationSha256!==request.implementationSha256)fail('INFERENCE_GRANT_SUBJECT_MISMATCH');
 if(grant.execution!=='LEEWAY_WGSL_TRANSFORMER'||grant.cpuNeuralFallback!==false||grant.remoteInference!==false||grant.externalModelServer!==false)fail('INFERENCE_GRANT_EXECUTION_FORBIDDEN');
 if(grant.contextLimit!==request.contextLimit||grant.maxNewTokens!==request.maxNewTokens)fail('INFERENCE_GRANT_BUDGET_MISMATCH');
 if(!Number.isSafeInteger(grant.expiresAtMs)||grant.expiresAtMs<=Date.now())fail('INFERENCE_GRANT_EXPIRED');
 if(!identity(grant.leaseId))fail('INFERENCE_LEASE_ID_REQUIRED');
 const source=grant.modelSource;
 if(source?.kind!=='LOCAL_READONLY_GGUF'||source.modelSha256!==request.modelSha256||!isSha256(source.readReceiptSha256))fail('INFERENCE_LOCAL_MODEL_SOURCE_UNBOUND');
 let location;try{location=new URL(source.rangeBaseUrl);}catch{fail('INFERENCE_LOCAL_MODEL_SOURCE_UNBOUND');}
 if(!['http:','https:'].includes(location.protocol)||!['127.0.0.1','localhost','[::1]'].includes(location.hostname)||location.username||location.password||location.search||location.hash||!location.pathname.endsWith('/'))fail('INFERENCE_REMOTE_WEIGHT_SOURCE_FORBIDDEN');
 const f=grant.formula;
 if(f?.formulaId!=='LEEWAY-FORMULA-v1.0'||f.engineSha256!==FORMULA_ENGINE_SHA256||!identity(f.adapterId)||!identity(f.mappingId)||!isSha256(f.mappingSha256)||!isSha256(f.inputHash)||!isSha256(f.resultHash)||!isSha256(f.receiptSha256)||!isSha256(f.observationsSha256)||!isSha256(f.envelopeSha256))fail('INFERENCE_FORMULA_BINDING_UNQUALIFIED');
 if(grant.preVeritas?.requestHash!==requestHash||!isSha256(grant.preVeritas?.receiptSha256))fail('INFERENCE_PRE_VERITAS_UNBOUND');
 const memory=grant.memory;
 if(memory?.owner!=='LEEWAY_DEVICE_WORKING_MEMORY_DATABASE'||!identity(memory.generation)||!isSha256(memory.admissionReceiptSha256)||!Number.isSafeInteger(memory.budgetBytes)||memory.budgetBytes<1024||memory.budgetBytes>4*1024**3||typeof memory.acquireBuffer!=='function'||typeof memory.releaseBuffer!=='function')fail('INFERENCE_LDWMD_BINDING_UNBOUND');
 const state=grant.continuum;
 if(!identity(state?.providerRef)||!identity(state?.cellId)||!isSha256(state?.readReceiptSha256)||state.sessionId!==request.sessionId||state.modelSha256!==request.modelSha256||state.tokenizerSha256!==request.tokenizerSha256)fail('INFERENCE_CONTINUUM_BINDING_UNBOUND');
 return grant;
}
export function validateInferenceResult(result,request){
 if(result?.execution!=='LEEWAY_QUANTIZED_WGSL_GRAPH'||result.externalModelEngine!==false||result.cpuNeuralMath!==false)fail('INFERENCE_RESULT_BACKEND_NOT_EXCLUSIVE');
 if(!Array.isArray(result.outputIds)||result.outputIds.length>request.maxNewTokens||!result.outputIds.every(v=>Number.isSafeInteger(v)&&v>=0&&v<1048576))fail('INFERENCE_RESULT_TOKENS_INVALID');
 return result;
}

/** Raw mathematical replay is mandatory evidence, never a replacement for host admission policy. */
export async function validateInferenceFormulaReplay(proof,grant,request,requestHash){
 const f=grant.formula;
 if(proof?.schema!=='leeway.formula.request-replay-proof.v1'||proof.mathematicalReplayVerified!==true||proof.authorization!=='NOT_GRANTED_BY_REPLAY'||
  proof.requestHash!==requestHash||proof.requestId!==request.requestId||proof.sessionId!==request.sessionId||proof.modelSha256!==request.modelSha256||
  proof.tokenizerSha256!==request.tokenizerSha256||proof.implementationSha256!==request.implementationSha256||
  proof.formulaId!==f.formulaId||proof.engineSha256!==FORMULA_ENGINE_SHA256||proof.adapterId!==f.adapterId||proof.mappingId!==f.mappingId||
  proof.mappingSha256!==f.mappingSha256||proof.observationsSha256!==f.observationsSha256||proof.envelopeSha256!==f.envelopeSha256||
  proof.inputHash!==f.inputHash||proof.resultHash!==f.resultHash||proof.sourceHashes?.['leeway-formula-v1.mjs']!==FORMULA_ENGINE_SHA256||!isSha256(proof.proofSha256))fail('INFERENCE_FORMULA_REPLAY_FAILED');
 const {proofSha256,...body}=proof;
 if(await inferenceHash(body)!==proofSha256)fail('INFERENCE_FORMULA_REPLAY_DIGEST_MISMATCH');
 return proofSha256;
}
/** Snapshot only immutable admission evidence; resource callback identity is checked separately. */
export function inferenceGrantSubject(grant){
 return JSON.stringify({requestId:grant.requestId,sessionId:grant.sessionId,requestHash:grant.requestHash,
  modelSha256:grant.modelSha256,tokenizerSha256:grant.tokenizerSha256,implementationSha256:grant.implementationSha256,
  execution:grant.execution,cpuNeuralFallback:grant.cpuNeuralFallback,remoteInference:grant.remoteInference,externalModelServer:grant.externalModelServer,
  contextLimit:grant.contextLimit,maxNewTokens:grant.maxNewTokens,expiresAtMs:grant.expiresAtMs,leaseId:grant.leaseId,
  formula:grant.formula,modelSource:grant.modelSource,preVeritas:grant.preVeritas,continuum:grant.continuum,
  memory:{owner:grant.memory.owner,generation:grant.memory.generation,budgetBytes:grant.memory.budgetBytes,admissionReceiptSha256:grant.memory.admissionReceiptSha256}});
}
