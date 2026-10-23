/*
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.EXCLUSIVE_INFERENCE_REGRESSION.G8
WHAT: Consumer-contract regression tests on the real dispatcher and model preflight.
WHY: Unbound, stale or mismatched governance must never start neural execution or leak a lease.
WHO: Creator-authorized Agent Lee. ROLES: VERIFY.
WHERE: Existing GPU modules. WHEN: node --test; model metadata comes from the supplied inspected inventory.
HOW: Explicitly SYNTHETIC binding stubs exercise failure/control paths; no model, GPU or canonical approval is simulated as evidence.
LICENSE: MIT. Passing these tests is NOT positive inference/C3/Formula/physical-memory qualification.
*/
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {HybridDispatcher,requireInferenceExecution} from '../../core/hybrid.dispatcher.js';
import {snapshotInferenceRequest,inferenceHash,FORMULA_ENGINE_SHA256} from '../../core/inference-contract.mjs';
import {inspectTransformerPlan,LeeWayTransformerSession,runModel} from '../../core/transformer-inference.mjs';
const H='1'.repeat(64),J='2'.repeat(64),K='3'.repeat(64);
const task=()=>({type:'AI_INFERENCE',requestId:'test-request',sessionId:'test-session',modelSha256:H,tokenizerSha256:J,implementationSha256:K,contextLimit:128,maxNewTokens:2,inputIds:[1,2]});
function fixture(changeGrant=()=>{},options={}){
 let calls=0,closed=0,release=0,commits=0,savedContext;const order=[];
 const binding={owner:'LEEWAY_RUNTIME_FABRIC',
  async authorize(request,{requestHash}){
   order.push('authorize');const grant={...request,requestHash,leaseId:'test-lease',expiresAtMs:Date.now()+10000,
    execution:'LEEWAY_WGSL_TRANSFORMER',cpuNeuralFallback:false,remoteInference:false,externalModelServer:false,
    modelSource:{kind:'LOCAL_READONLY_GGUF',modelSha256:request.modelSha256,readReceiptSha256:H,rangeBaseUrl:'http://127.0.0.1:1/test-only/'},
    formula:{formulaId:'LEEWAY-FORMULA-v1.0',engineSha256:FORMULA_ENGINE_SHA256,adapterId:'test-only',mappingId:'SYNTHETIC_NOT_ADMITTED',mappingSha256:H,inputHash:H,resultHash:J,receiptSha256:K,observationsSha256:H,envelopeSha256:J},
    preVeritas:{requestHash,receiptSha256:H},
    memory:{owner:'LEEWAY_DEVICE_WORKING_MEMORY_DATABASE',generation:'test-only',budgetBytes:1024,admissionReceiptSha256:H,
     acquireBuffer(){throw Error('THIS_FIXTURE_MUST_NEVER_ALLOCATE');},releaseBuffer(){}},
    continuum:{providerRef:'test-only',cellId:'test-only',readReceiptSha256:J,sessionId:request.sessionId,modelSha256:request.modelSha256,tokenizerSha256:request.tokenizerSha256}};
   changeGrant(grant);return grant;
  },
  async verifyFormulaDecision(grant,{request,requestHash}){
   const proof={schema:'leeway.formula.request-replay-proof.v1',requestId:request.requestId,requestHash,sessionId:request.sessionId,
    modelSha256:request.modelSha256,tokenizerSha256:request.tokenizerSha256,implementationSha256:request.implementationSha256,
    mappingId:grant.formula.mappingId,mappingSha256:grant.formula.mappingSha256,observationsSha256:grant.formula.observationsSha256,envelopeSha256:grant.formula.envelopeSha256,
    formulaId:grant.formula.formulaId,engineSha256:FORMULA_ENGINE_SHA256,adapterId:grant.formula.adapterId,
    inputHash:grant.formula.inputHash,resultHash:grant.formula.resultHash,mathematicalReplayVerified:true,authorization:'NOT_GRANTED_BY_REPLAY',
    sourceHashes:{'leeway-formula-v1.mjs':FORMULA_ENGINE_SHA256},fixtureOnly:'SYNTHETIC_HOST_PROOF_NOT_CANONICAL_EXECUTION'};
   return {...proof,proofSha256:await inferenceHash(proof)};
  },
  async revalidate(){return true;},
  async verify(_grant,{requestHash,resultHash}){order.push('verify');return {verified:true,requestHash,resultHash,receiptSha256:H};},
  async commit(grant,{requestHash,resultHash}){commits++;order.push('commit');return {sessionId:grant.sessionId,readbackVerified:true,requestHash,resultHash,receiptSha256:J};},
  async rollback(_grant,{requestHash}){order.push('rollback');return {requestHash,rolledBack:true,receiptSha256:H};},
  async release(){release++;order.push('release');}
 };
 const ml={async run(_request,context){calls++;savedContext=context;order.push('run');return {execution:'LEEWAY_QUANTIZED_WGSL_GRAPH',externalModelEngine:false,cpuNeuralMath:false,outputIds:[],fixtureOnly:true};},close(){closed++;order.push('close');}};
 Object.assign(binding,options);
 const dispatcher=new HybridDispatcher({ml,cpu:{run(){throw Error('CPU_MUST_NEVER_RUN');}},inferenceBinding:binding});
 return {binding,ml,dispatcher,stats:()=>({calls,closed,release,commits,order}),context:()=>savedContext};
}
const denied=(fn,code)=>assert.rejects(fn,e=>e.code===code||e.message===code);
test('unbound real dispatcher does not call a model',async()=>{let calls=0;const d=new HybridDispatcher({ml:{run(){calls++;}}});await denied(()=>d.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_RUNTIME_BINDING_UNBOUND');assert.equal(calls,0);});
test('caller approval cannot replace the owner binding',async()=>{const d=new HybridDispatcher({ml:{run(){throw Error('MUST_NOT_RUN');}}});await denied(()=>d.dispatch(task(),{capability:'WEBGPU',controller:{approve:()=>true}}),'INFERENCE_RUNTIME_BINDING_UNBOUND');});
test('CPU inference route is forbidden',async()=>{const f=fixture();await denied(()=>f.dispatcher.dispatch(task(),{capability:'CPU'}),'INFERENCE_NON_LEEWAY_NEURAL_ROUTE_FORBIDDEN');assert.equal(f.stats().calls,0);});
test('remote request is forbidden',async()=>{const f=fixture();await denied(()=>f.dispatcher.dispatch({...task(),allowRemote:true},{capability:'WEBGPU'}),'INFERENCE_ALTERNATE_EXECUTION_FORBIDDEN');assert.equal(f.stats().calls,0);});
test('CPU fallback request is forbidden',async()=>{const f=fixture();await denied(()=>f.dispatcher.dispatch({...task(),allowCpuFallback:true},{capability:'WEBGPU'}),'INFERENCE_ALTERNATE_EXECUTION_FORBIDDEN');assert.equal(f.stats().calls,0);});
test('external model-server shortcut is forbidden',async()=>{const f=fixture();await denied(()=>f.dispatcher.dispatch({...task(),externalModelServer:true},{capability:'WEBGPU'}),'INFERENCE_ALTERNATE_EXECUTION_FORBIDDEN');});
test('request requires model and tokenizer hashes',()=>{assert.throws(()=>snapshotInferenceRequest({...task(),tokenizerSha256:null}),/SOURCE_IDENTITY_REQUIRED/);});
test('request snapshots token arrays',()=>{const t=task(),s=snapshotInferenceRequest(t);t.inputIds[0]=99;assert.equal(s.inputIds[0],1);assert(Object.isFrozen(s.inputIds));});
test('context overflow is rejected before model call',async()=>{const f=fixture();await denied(()=>f.dispatcher.dispatch({...task(),maxNewTokens:64,inputIds:Array(100).fill(1)},{capability:'WEBGPU'}),'INFERENCE_INPUT_TOKENS_INVALID');assert.equal(f.stats().calls,0);});
for(const [name,change,code]of [
 ['wrong request',g=>{g.requestId='other';},'INFERENCE_GRANT_SUBJECT_MISMATCH'],
 ['wrong model',g=>{g.modelSha256=K;},'INFERENCE_GRANT_SUBJECT_MISMATCH'],
 ['wrong tokenizer',g=>{g.tokenizerSha256=K;},'INFERENCE_GRANT_SUBJECT_MISMATCH'],
 ['wrong implementation',g=>{g.implementationSha256=H;},'INFERENCE_GRANT_SUBJECT_MISMATCH'],
 ['expired grant',g=>{g.expiresAtMs=Date.now()-1;},'INFERENCE_GRANT_EXPIRED'],
 ['native backend grant',g=>{g.execution='OLLAMA';},'INFERENCE_GRANT_EXECUTION_FORBIDDEN'],
 ['remote tensor source',g=>{g.modelSource.rangeBaseUrl='https://example.com/weights/';},'INFERENCE_REMOTE_WEIGHT_SOURCE_FORBIDDEN'],
 ['unbound model data',g=>{g.modelSource=null;},'INFERENCE_LOCAL_MODEL_SOURCE_UNBOUND'],
 ['missing Formula',g=>{g.formula=null;},'INFERENCE_FORMULA_BINDING_UNQUALIFIED'],
 ['wrong Formula source',g=>{g.formula.engineSha256=H;},'INFERENCE_FORMULA_BINDING_UNQUALIFIED'],
 ['unqualified mapping',g=>{g.formula.mappingSha256=null;},'INFERENCE_FORMULA_BINDING_UNQUALIFIED'],
 ['missing LDWMD',g=>{g.memory=null;},'INFERENCE_LDWMD_BINDING_UNBOUND'],
 ['invalid LDWMD budget',g=>{g.memory.budgetBytes=Infinity;},'INFERENCE_LDWMD_BINDING_UNBOUND'],
 ['missing Continuum',g=>{g.continuum=null;},'INFERENCE_CONTINUUM_BINDING_UNBOUND'],
 ['different Continuum session',g=>{g.continuum.sessionId='other';},'INFERENCE_CONTINUUM_BINDING_UNBOUND'],
 ['missing pre-Veritas',g=>{g.preVeritas=null;},'INFERENCE_PRE_VERITAS_UNBOUND']
])test(name+' starts zero model calls',async()=>{const f=fixture(change);await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),code);assert.equal(f.stats().calls,0);assert.equal(f.stats().release,1);});
test('revoked lease starts no model',async()=>{const f=fixture(()=>{},{revalidate:async()=>false});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_LEASE_REVOKED');assert.equal(f.stats().calls,0);});
test('cancelled before admission calls no model',async()=>{const f=fixture(),a=new AbortController();a.abort();await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU',signal:a.signal}),'INFERENCE_CANCELLED');assert.equal(f.stats().calls,0);});
test('post-check failure withholds fixture output and releases lease',async()=>{const f=fixture(()=>{},{verify:async()=>({verified:false})});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_POST_VERITAS_FAILED');assert.equal(f.stats().commits,0);assert.equal(f.stats().closed,1);assert.equal(f.stats().release,1);});
test('unverified durable readback withholds fixture output',async()=>{const f=fixture(()=>{},{commit:async()=>({readbackVerified:false})});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_CONTINUUM_COMMIT_UNVERIFIED');assert.equal(f.stats().release,1);});
test('resource failure never invokes CPU fallback',async()=>{const f=fixture();f.ml.run=async()=>{throw Error('GPU_DEVICE_LOST');};await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'GPU_DEVICE_LOST');assert.equal(f.stats().release,1);});
test('fixture lifecycle closes resources before parent lease release',async()=>{const f=fixture();const r=await f.dispatcher.dispatch(task(),{capability:'WEBGPU'});assert(r.fixtureOnly);assert.deepEqual(f.stats().order,['authorize','run','verify','commit','close','release']);});
test('returned execution evidence carries immutable request/model/session identity',async()=>{const f=fixture();const t=task();const expected=snapshotInferenceRequest(t);const expectedHash=await inferenceHash(expected);const r=await f.dispatcher.dispatch(t,{capability:'WEBGPU'});assert.deepEqual(r.executionBinding,{...r.executionBinding,requestId:expected.requestId,sessionId:expected.sessionId,requestHash:expectedHash,modelSha256:expected.modelSha256,tokenizerSha256:expected.tokenizerSha256,implementationSha256:expected.implementationSha256});assert.equal(r.executionBinding.resultHash,await inferenceHash(Object.fromEntries(Object.entries(r).filter(([k])=>k!=='executionBinding'&&k!=='claimBoundary'))));});
test('completed context cannot be reused',async()=>{const f=fixture();await f.dispatcher.dispatch(task(),{capability:'WEBGPU'});await denied(()=>requireInferenceExecution(f.context(),task()),'INFERENCE_EXECUTION_CONTEXT_UNBOUND');});
test('request replay rejected',async()=>{const f=fixture();await f.dispatcher.dispatch(task(),{capability:'WEBGPU'});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_REQUEST_REPLAYED');assert.equal(f.stats().calls,1);});
test('unbound direct transformer context is rejected',async()=>{await denied(()=>requireInferenceExecution({controller:{approve:()=>true}},task()),'INFERENCE_EXECUTION_CONTEXT_UNBOUND');});
const invPath=process.env.LEEWAY_G8_MODEL_INVENTORY;
if(invPath){
 const inv=JSON.parse(fs.readFileSync(invPath,'utf8'));const make=label=>{const m=inv.models.find(x=>x.label===label);assert(m);return {metadata:m.metadata,tensors:m.tensors,modelSha256:m.sha256,tokenizerSha256:J,implementationSha256:K,contextLimit:128,inputTokens:[1,2],maxNewTokens:2};};
 test('real Qwen metadata preflights without GPU allocation',()=>{const p=inspectTransformerPlan(make('qwen2.5:0.5b'));assert.equal(p.layers,24);assert.equal(p.memory.packedWeightBytes,391859712);assert.equal(p.nativeOsAdapterRegistered,false);});
 test('real Gemma metadata uses existing per-layer input key and computes paged row size',()=>{const p=inspectTransformerPlan(make('gemma4:e4b'));assert.equal(p.layers,42);assert.equal(p.perLayerInput,256);assert.equal(p.sharedKvLayers,18);assert.equal(p.memory.pagedPerTokenBytes,21504);assert(p.memory.residentFloorBytes<4*1024**3);});
 test('model construction is allocation-free',()=>{let calls=0;const s=new LeeWayTransformerSession({device:{createBuffer(){calls++;throw Error('NO_ALLOCATION_IN_PREFLIGHT');}},base:null,plan:make('qwen2.5:0.5b')});s.close();assert.equal(calls,0);});
 test('direct unbound load cannot allocate even with valid metadata',async()=>{let calls=0;const s=new LeeWayTransformerSession({device:{createBuffer(){calls++;}},base:null,plan:make('qwen2.5:0.5b')});try{await denied(()=>s.load({controller:{approve:()=>true}}),'INFERENCE_EXECUTION_CONTEXT_UNBOUND');assert.equal(calls,0);}finally{s.close();}});
 test('direct runModel cannot recreate the diagnostic bypass',async()=>{let calls=0;await denied(()=>runModel({device:{createBuffer(){calls++;}},base:null,plan:make('qwen2.5:0.5b'),requestId:'test',sessionId:'test'}),'INFERENCE_RUNTIME_BINDING_UNBOUND');assert.equal(calls,0);});
 test('unsupported tensor shape stops before allocation',()=>{const p=structuredClone(make('qwen2.5:0.5b'));p.tensors.find(t=>t.name==='blk.0.ffn_up.weight').shape[0]++;assert.throws(()=>inspectTransformerPlan(p),/TENSOR_SHAPE_MISMATCH/);});
 test('unknown model architecture is never guessed',()=>{const p=structuredClone(make('qwen2.5:0.5b'));p.metadata['general.architecture']='UNSUPPORTED';assert.throws(()=>inspectTransformerPlan(p),/MODEL_ARCHITECTURE_UNSUPPORTED/);});
}

test('failed durable commit rolls back while the Runtime Fabric lease is still held',async()=>{const f=fixture(()=>{},{commit:async()=>{throw Error('COMMIT_FAILED');}});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'COMMIT_FAILED');const order=f.stats().order;assert(order.indexOf('rollback')>=0);assert(order.indexOf('release')>=0);assert(order.indexOf('rollback')<order.indexOf('release'));assert.equal(f.stats().release,1);});
test('unverified rollback cannot become a success',async()=>{const f=fixture(()=>{},{commit:async()=>{throw Error('COMMIT_FAILED');},rollback:async()=>({rolledBack:false})});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_CONTINUUM_ROLLBACK_UNVERIFIED');});
// G9 additions reproduce the missing independent Formula-evidence gate.
test('missing independent Formula verifier starts zero model calls',async()=>{const f=fixture();delete f.binding.verifyFormulaDecision;await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_BINDING_METHOD_MISSING:verifyFormulaDecision');assert.equal(f.stats().calls,0);});
test('failed Formula replay starts zero model calls',async()=>{const f=fixture(()=>{},{verifyFormulaDecision:async()=>({mathematicalReplayVerified:false})});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_FORMULA_REPLAY_FAILED');assert.equal(f.stats().calls,0);assert.equal(f.stats().release,1);});
test('Formula verifier exception cannot start a model',async()=>{const f=fixture(()=>{},{verifyFormulaDecision:async()=>{throw Error('REPLAY_SOURCE_FAILED');}});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'REPLAY_SOURCE_FAILED');assert.equal(f.stats().calls,0);});
for(const [field,value]of [['requestHash',K],['modelSha256',K],['mappingSha256',J],['observationsSha256',J],['resultHash',H]]){
 test('independently returned proof must bind '+field,async()=>{const f=fixture();const original=f.binding.verifyFormulaDecision;f.binding.verifyFormulaDecision=async(...args)=>{const p=await original(...args);p[field]=value;const {proofSha256,...body}=p;p.proofSha256=await inferenceHash(body);return p;};await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_FORMULA_REPLAY_FAILED');assert.equal(f.stats().calls,0);});
}
test('valid-looking Formula proof cannot carry a random digest',async()=>{const f=fixture();const original=f.binding.verifyFormulaDecision;f.binding.verifyFormulaDecision=async(...args)=>({...await original(...args),proofSha256:H});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_FORMULA_REPLAY_DIGEST_MISMATCH');assert.equal(f.stats().calls,0);});
test('revalidation cannot silently enlarge the granted memory budget',async()=>{const f=fixture(()=>{},{revalidate:async g=>{g.memory.budgetBytes*=2;return true;}});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_GRANTED_PROVENANCE_CHANGED');assert.equal(f.stats().calls,0);});
test('revalidation cannot replace the admitted buffer provider',async()=>{const f=fixture(()=>{},{revalidate:async g=>{g.memory.acquireBuffer=()=>null;return true;}});await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_GRANTED_PROVIDER_CHANGED');assert.equal(f.stats().calls,0);});

test('revalidation cannot replace the admitted model source with a matching descriptor',async()=>{
 const f=fixture(()=>{},{revalidate:async g=>{g.modelSource={...g.modelSource};return true;}});
 await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_GRANTED_MODEL_PROVIDER_CHANGED');
 assert.equal(f.stats().calls,0);assert.equal(f.stats().release,1);
});

test('partial final ledger evidence is rejected and rolls back',async()=>{
 const f=fixture(()=>{},{commit:async(g,{requestHash,resultHash})=>({sessionId:g.sessionId,readbackVerified:true,
  requestHash,resultHash,receiptSha256:H,commitAttestationSha256:J})});
 await denied(()=>f.dispatcher.dispatch(task(),{capability:'WEBGPU'}),'INFERENCE_FINAL_AUDIT_EVIDENCE_INCOMPLETE');
 assert(f.stats().order.includes('rollback'));assert.equal(f.stats().release,1);
});

test('complete final commit and ledger hashes are retained for the application interface',async()=>{
 const f=fixture(()=>{},{commit:async(g,{requestHash,resultHash})=>({sessionId:g.sessionId,readbackVerified:true,
  requestHash,resultHash,receiptSha256:H,commitAttestationSha256:J,receiptLedgerReceiptSha256:K,learningLedgerReceiptSha256:H})});
 const result=await f.dispatcher.dispatch(task(),{capability:'WEBGPU'});
 assert.equal(result.executionBinding.commitAttestationSha256,J);
 assert.equal(result.executionBinding.receiptLedgerReceiptSha256,K);
 assert.equal(result.executionBinding.learningLedgerReceiptSha256,H);
});
