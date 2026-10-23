/*
REGION: LEEWAY.EDGE_GPU.DISPATCH
TAG: LEEWAY.EDGE_GPU.HYBRID_DISPATCH.G9
WHAT: Existing backend routing plus bounded tensor recovery.
WHY: Recover supported pure calculations without hiding denials, invalid data or incorrect results.
WHO: Creator-authorized Agent Lee. WHERE: Existing dispatcher, subordinate to Runtime Fabric.
WHEN: Explicit submissions. HOW: Snapshot inputs, strict admission, typed recovery, independent reference.
ROLES: ASSESS EXECUTE VERIFY. LICENSE: MIT
*/
import {executeGPU} from '../control/gpu.controller.bridge.js';
import {snapshotTensor,tensorMetadata,TensorError,requireNotCancelled,outputDigest} from '../dispatch/tensor-contract.mjs';
import {InferenceContractError,snapshotInferenceRequest,inferenceHash,isSha256,requireRuntimeInferenceBinding,validateInferenceGrant,validateInferenceResult,validateInferenceFormulaReplay,inferenceGrantSubject} from './inference-contract.mjs';
const inferenceExecutions=new WeakMap();
function verifyGrantedIdentity(state){
 if(state.grantedSubject!==inferenceGrantSubject(state.grant))throw new InferenceContractError('INFERENCE_GRANTED_PROVENANCE_CHANGED');
 if(state.memoryOwner!==state.grant.memory||state.acquireBuffer!==state.grant.memory.acquireBuffer||state.releaseBuffer!==state.grant.memory.releaseBuffer)throw new InferenceContractError('INFERENCE_GRANTED_PROVIDER_CHANGED');
  if(state.sourceOwner!==state.grant.modelSource||state.resource!==state.grant.modelSource.resource||
    state.read!==state.grant.modelSource.resource?.read||state.close!==state.grant.modelSource.resource?.close||
    state.verifyRead!==state.grant.modelSource.verifyRead)throw new InferenceContractError('INFERENCE_GRANTED_MODEL_PROVIDER_CHANGED');
}
export async function requireInferenceExecution(context,plan,phase='EXECUTE'){
 const state=inferenceExecutions.get(context);
 if(!state?.active)throw new InferenceContractError('INFERENCE_EXECUTION_CONTEXT_UNBOUND');
 if(context.signal?.aborted)throw new InferenceContractError('INFERENCE_CANCELLED');
 validateInferenceGrant(state.grant,state.request,state.requestHash);verifyGrantedIdentity(state);
 if(plan?.modelSha256!==state.request.modelSha256||plan?.tokenizerSha256!==state.request.tokenizerSha256||plan?.implementationSha256!==state.request.implementationSha256)throw new InferenceContractError('INFERENCE_MODEL_PLAN_MISMATCH');
 if(await state.binding.revalidate(state.grant,{requestHash:state.requestHash,phase})!==true)throw new InferenceContractError('INFERENCE_LEASE_REVOKED');
 validateInferenceGrant(state.grant,state.request,state.requestHash);verifyGrantedIdentity(state);
 if(context.signal?.aborted||!state.active)throw new InferenceContractError('INFERENCE_CANCELLED');
 return state.grant;
}
const recoverable=new Set(['GPU_UNAVAILABLE','GPU_DEVICE_LOST','GPU_ALLOCATION_FAILED','GPU_BUDGET_EXCEEDED']);
export class HybridDispatcher{
 #inferenceBinding;#activeInference=false;#consumedInferenceRequests=new Set();
 constructor({webgpu,webgl,ml,cpu,inferenceBinding}={}){
  this.webgpu=webgpu;this.webgl=webgl;this.ml=ml;this.cpu=cpu;this.#inferenceBinding=inferenceBinding;
 }
 async dispatch(task,ctx){
  if(task?.type==='AI_INFERENCE')return this.dispatchInference(task,ctx);
  if(task?.type==='TENSOR')return this.dispatchTensor(task,ctx);
  const path=this._selectPath(task,ctx);ctx.executionPath=path;
  switch(path){case 'WEBGPU':return this.webgpu.run(task,ctx);case 'WEBGL':return this.webgl.run(task,ctx);case 'ML':return this.ml.run(task,ctx);default:return this.cpu.run(task,ctx);}
 }
 async dispatchInference(task,ctx={}){
  const request=snapshotInferenceRequest(task);
  if(ctx.capability!=='WEBGPU')throw new InferenceContractError('INFERENCE_NON_LEEWAY_NEURAL_ROUTE_FORBIDDEN');
  if(ctx.signal?.aborted)throw new InferenceContractError('INFERENCE_CANCELLED');
  const binding=requireRuntimeInferenceBinding(this.#inferenceBinding);
  if(!this.ml||typeof this.ml.run!=='function')throw new InferenceContractError('INFERENCE_MODEL_PROVIDER_UNBOUND');
  if(this.#activeInference)throw new InferenceContractError('INFERENCE_REQUEST_ALREADY_ACTIVE');
  if(this.#consumedInferenceRequests.has(request.requestId))throw new InferenceContractError('INFERENCE_REQUEST_REPLAYED');
  if(this.#consumedInferenceRequests.size>=1024)throw new InferenceContractError('INFERENCE_LOCAL_REPLAY_WINDOW_FULL');
  this.#activeInference=true;let grant,executionContext,state,output,failure,modelStarted=false,commitStarted=false;
  try{
   const requestHash=await inferenceHash(request);
   grant=await binding.authorize(request,{requestHash,signal:ctx.signal});
   validateInferenceGrant(grant,request,requestHash);
   state={active:false,binding,request,requestHash,grant,grantedSubject:inferenceGrantSubject(grant),
     memoryOwner:grant.memory,acquireBuffer:grant.memory.acquireBuffer,releaseBuffer:grant.memory.releaseBuffer,
     sourceOwner:grant.modelSource,resource:grant.modelSource.resource,read:grant.modelSource.resource?.read,
     close:grant.modelSource.resource?.close,verifyRead:grant.modelSource.verifyRead};
   const replay=await binding.verifyFormulaDecision(grant,{request,requestHash});
   validateInferenceGrant(grant,request,requestHash);verifyGrantedIdentity(state);
   state.formulaReplaySha256=await validateInferenceFormulaReplay(replay,grant,request,requestHash);
   verifyGrantedIdentity(state);
   executionContext=Object.freeze({signal:ctx.signal,capability:'WEBGPU'});
   state.active=true;inferenceExecutions.set(executionContext,state);
   await requireInferenceExecution(executionContext,request,'BEFORE_MODEL_LOAD');
   this.#consumedInferenceRequests.add(request.requestId);
   modelStarted=true;const result=validateInferenceResult(await this.ml.run(request,executionContext),request);
   // Copy only data; no inference callback or provider object may be returned as output.
   const preserved=structuredClone(result);const resultHash=await inferenceHash(preserved);
   await requireInferenceExecution(executionContext,request,'BEFORE_POST_VERITAS');
   const post=await binding.verify(grant,{requestHash,resultHash,result:structuredClone(preserved)});
   if(post?.requestHash!==requestHash||post?.resultHash!==resultHash||post?.verified!==true||!isSha256(post.receiptSha256))throw new InferenceContractError('INFERENCE_POST_VERITAS_FAILED');
   await requireInferenceExecution(executionContext,request,'BEFORE_CONTINUUM_COMMIT');
   commitStarted=true;const commit=await binding.commit(grant,{requestHash,resultHash,result:structuredClone(preserved),postReceiptSha256:post.receiptSha256});
   if(commit?.requestHash!==requestHash||commit?.resultHash!==resultHash||commit?.sessionId!==request.sessionId||commit?.readbackVerified!==true||!isSha256(commit.receiptSha256))throw new InferenceContractError('INFERENCE_CONTINUUM_COMMIT_UNVERIFIED');
    const auditKeys=['commitAttestationSha256','receiptLedgerReceiptSha256','learningLedgerReceiptSha256'];
    const audit={};
    if(auditKeys.some(key=>commit[key]!==undefined)){
     if(auditKeys.some(key=>!isSha256(commit[key])))throw new InferenceContractError('INFERENCE_FINAL_AUDIT_EVIDENCE_INCOMPLETE');
     for(const key of auditKeys)audit[key]=commit[key];
    }
   await requireInferenceExecution(executionContext,request,'BEFORE_RESPONSE');
   output={...preserved,executionBinding:{requestId:request.requestId,sessionId:request.sessionId,requestHash,
    modelSha256:request.modelSha256,tokenizerSha256:request.tokenizerSha256,implementationSha256:request.implementationSha256,
    resultHash,leaseId:grant.leaseId,formulaReceiptSha256:grant.formula.receiptSha256,
     formulaReplaySha256:state.formulaReplaySha256,ldWmdReceiptSha256:grant.memory.admissionReceiptSha256,continuumReceiptSha256:commit.receiptSha256,postReceiptSha256:post.receiptSha256,...audit},
    claimBoundary:'Only an independently qualified Runtime Fabric binding can establish canonical acceptance.'};
   ctx.executionPath='ML';
  }catch(error){failure=error;}
  finally{
   if(state)state.active=false;
   if(executionContext)inferenceExecutions.delete(executionContext);
   if(modelStarted&&typeof this.ml.close==='function'){try{await this.ml.close();}catch(error){failure??=new InferenceContractError('INFERENCE_RESOURCE_CLEANUP_FAILED');}}
   if(failure&&commitStarted&&grant){
    try{const undo=await binding.rollback(grant,{requestHash:state.requestHash});if(undo?.requestHash!==state.requestHash||undo.rolledBack!==true||!isSha256(undo.receiptSha256))throw Error('UNVERIFIED_ROLLBACK');}
    catch(error){failure=new InferenceContractError('INFERENCE_CONTINUUM_ROLLBACK_UNVERIFIED');}
   }
   if(grant){try{await binding.release(grant,{success:!failure});}catch(error){failure??=new InferenceContractError('INFERENCE_LEASE_RELEASE_FAILED');}}
   this.#activeInference=false;
  }
  if(failure)throw failure;return output;
 }
 async dispatchTensor(task,ctx={}){
  const input=snapshotTensor(task.input);requireNotCancelled(ctx.signal);
  if(typeof ctx.verify!=='function')throw new TensorError('TENSOR_REFERENCE_REQUIRED');
  if(!['WEBGPU','CPU','UNAVAILABLE'].includes(ctx.capability))throw new TensorError('TENSOR_CAPABILITY_INVALID');
  const preferred=ctx.capability==='CPU'?'CPU':'WEBGPU';const attempts=[];let backend=preferred,recoveredFrom=null;
  const metadata=tensorMetadata(input);
  const attempt=async route=>{
   requireNotCancelled(ctx.signal);
   const start=performance.now();const engine=route==='WEBGPU'?this.webgpu:this.cpu;
   try{
    if(!engine||typeof engine.run!=='function'||(route==='WEBGPU'&&ctx.capability==='UNAVAILABLE'))throw new TensorError(route==='WEBGPU'?'GPU_UNAVAILABLE':'CPU_UNAVAILABLE');
    const result=await engine.run({type:'TENSOR',input:snapshotTensor(input)},{signal:ctx.signal});
    requireNotCancelled(ctx.signal);
    attempts.push({backend:route,state:'EXECUTED',hostMs:performance.now()-start});return result;
   }catch(error){attempts.push({backend:route,state:'FAILED',code:error.code||'UNCLASSIFIED_ERROR',hostMs:performance.now()-start});throw error;}
  };
  const admitted=(route,run)=>executeGPU({TAG:'LEEWAY.COMPUTE.TENSOR.EXEC',metadata:{...metadata,backend:route},run:async()=>{requireNotCancelled(ctx.signal);return run();}},ctx.controller);
  const raw=await admitted(preferred,async()=>{
   try{return await attempt(preferred);}
   catch(error){
    requireNotCancelled(ctx.signal);
    if(preferred!=='WEBGPU'||ctx.allowCpuFallback!==true||!(error instanceof TensorError)||!recoverable.has(error.code))throw error;
    recoveredFrom=error.code;backend='CPU';
    return await admitted('CPU',()=>attempt('CPU'));
   }
  });
  requireNotCancelled(ctx.signal);
  if(!(raw instanceof Float32Array)||raw.length!==input.m*input.n||!raw.every(Number.isFinite))throw new TensorError('TENSOR_RESULT_INVALID');
  // Own the returned bytes; no backend may mutate the committed result later.
  const result=raw.slice();
  const verification=await ctx.verify(result.slice(),snapshotTensor(input));
  requireNotCancelled(ctx.signal);
  if(verification?.valid!==true||typeof verification.method!=='string'||!verification.method)throw new TensorError('TENSOR_REFERENCE_MISMATCH');
  const digest=await outputDigest(result);requireNotCancelled(ctx.signal);
  ctx.executionPath=backend;ctx.attempts=attempts.map(x=>({...x}));
  return {result,backend,recoveredFrom,attempts,verification,sha256:digest,metadata,
   routingAuthority:'EXPLICIT_POLICY_NOT_FORMULA',formulaExecution:'NOT_EXECUTED_BY_DISPATCHER',
   evidenceScope:'LOCAL_REFERENCE_CHECK_NOT_CANONICAL_VERITAS',osDriverInstalled:false};
 }
 _selectPath(task,ctx){
  if(task.type==='AI_INFERENCE'&&ctx.capability==='WEBGPU')return 'ML';
  if(task.type==='COMPUTE'){if(ctx.capability==='WEBGPU')return 'WEBGPU';if(ctx.capability==='WEBGL')return 'WEBGL';}
  if(task.type==='RENDER')return ctx.capability==='WEBGPU'?'WEBGPU':'WEBGL';
  return 'CPU';
 }
}
