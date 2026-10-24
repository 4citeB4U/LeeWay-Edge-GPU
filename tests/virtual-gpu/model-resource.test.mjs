/* Portable storage/admission tests. Synthetic grants are not GPU or production qualification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDeviceLocalModelResource,createBlobModelResource,modelBytesSha256,readAdmittedModelTensor} from '../../sdk/model-resource.mjs';
import {validateInferenceGrant,snapshotInferenceRequest,inferenceHash,FORMULA_ENGINE_SHA256} from '../../core/inference-contract.mjs';
import {HybridDispatcher} from '../../core/hybrid.dispatcher.js';
import {LeeWayTransformerSession} from '../../core/transformer-inference.mjs';

const H='1'.repeat(64),J='2'.repeat(64),K='3'.repeat(64);
const denied=(run,code)=>assert.rejects(run,error=>error.code===code||error.message===code);
const tensor={name:'weight',shape:[4,4],elements:16,bytes:64,fileOffset:16};
function resourceFixture({read,verifyRead,close,maxReadBytes=64}={}){
 const bytes=Uint8Array.from({length:128},(_,i)=>i);let reads=0,verifications=0,closes=0;
 const resource=createDeviceLocalModelResource({resourceId:'device-model',byteLength:bytes.length,maxReadBytes,
  read:async request=>{reads++;return read?read(request):bytes.slice(request.offset,request.offset+request.byteLength);},
  close:async()=>{closes++;await close?.();}});
 const grant={requestHash:H,modelSha256:J,modelSource:{kind:'DEVICE_LOCAL_READONLY_GGUF',requestHash:H,modelSha256:J,
  readReceiptSha256:K,resourceId:resource.resourceId,byteLength:resource.byteLength,maxReadBytes:resource.maxReadBytes,resource,
  async verifyRead(proof,options){verifications++;if(verifyRead)return verifyRead(proof,options);
   const expected=await modelBytesSha256(bytes.slice(proof.offset,proof.offset+proof.byteLength));
   return {...proof,verified:proof.sha256===expected,receiptSha256:H};}}};
 return {bytes,resource,grant,stats:()=>({reads,verifications,closes})};
}
const readTensor=(fixture,extra={})=>readAdmittedModelTensor({grant:fixture.grant,resource:fixture.resource,tensor,name:tensor.name,start:1,rows:2,...extra});

test('device resource copies bounded ranges without paths or network discovery',async()=>{
 const original=new Uint8Array([1,2,3,4]);const resource=createDeviceLocalModelResource({resourceId:'handle',byteLength:4,maxReadBytes:4,read:()=>original});
 const result=await resource.read({offset:0,byteLength:4});original[0]=99;assert.deepEqual([...result],[1,2,3,4]);await resource.close();
});
test('Blob storage reads are bounded and portable',async()=>{
 const resource=createBlobModelResource(new Blob([new Uint8Array([1,2,3,4,5])]),{resourceId:'blob',maxReadBytes:3});
 assert.deepEqual([...await resource.read({offset:1,byteLength:3})],[2,3,4]);
 await denied(()=>resource.read({offset:0,byteLength:4}),'MODEL_RESOURCE_RANGE_INVALID');await resource.close();
});
test('invalid ranges never reach the host adapter',async()=>{
 const f=resourceFixture();for(const range of [{offset:-1,byteLength:1},{offset:0,byteLength:0},{offset:0,byteLength:65},{offset:120,byteLength:16},{offset:Number.MAX_SAFE_INTEGER,byteLength:1}])await denied(()=>f.resource.read(range),'MODEL_RESOURCE_RANGE_INVALID');
 assert.equal(f.stats().reads,0);await f.resource.close();
});
test('truncated host reads are rejected',async()=>{
 const f=resourceFixture({read:()=>new Uint8Array(1)});await denied(()=>f.resource.read({offset:0,byteLength:2}),'MODEL_RESOURCE_READ_SIZE_MISMATCH');await f.resource.close();
});
test('cancellation interrupts a host adapter even when it ignores the signal',async()=>{
 const controller=new AbortController(),f=resourceFixture({read:()=>new Promise(()=>{})});const pending=f.resource.read({offset:0,byteLength:2,signal:controller.signal});controller.abort();
 await denied(()=>pending,'MODEL_RESOURCE_CANCELLED');await f.resource.close();
});
test('close cancels pending reads, closes once and prevents later reads',async()=>{
 const f=resourceFixture({read:()=>new Promise(()=>{})});const pending=f.resource.read({offset:0,byteLength:2});await f.resource.close();await f.resource.close();
 await denied(()=>pending,'MODEL_RESOURCE_CANCELLED');await denied(()=>f.resource.read({offset:0,byteLength:2}),'MODEL_RESOURCE_CLOSED');assert.equal(f.stats().closes,1);
});
test('tensor range is locally hashed and independently admitted before return',async()=>{
 const f=resourceFixture();const result=await readTensor(f);assert.deepEqual([...new Uint8Array(result)],[...f.bytes.slice(32,64)]);assert.deepEqual(f.stats(),{reads:1,verifications:1,closes:0});await f.resource.close();
});
test('corrupt bytes cannot be authorized by a reader supplied hash',async()=>{
 const f=resourceFixture({read:()=>new Uint8Array(32)});await denied(()=>readTensor(f),'MODEL_RESOURCE_READ_UNVERIFIED');await f.resource.close();
});
test('verifier receipt must correlate every range and request field',async()=>{
 for(const changed of [{requestHash:J},{modelSha256:H},{resourceId:'other'},{offset:0},{byteLength:64},{sha256:K},{rowCount:3},{sourceReceiptSha256:H},{receiptSha256:'invalid'}]){
  const f=resourceFixture({verifyRead:proof=>({...proof,verified:true,receiptSha256:H,...changed})});await denied(()=>readTensor(f),'MODEL_RESOURCE_READ_UNVERIFIED');await f.resource.close();
 }
});
test('local resource requires Runtime-owned verification, not a digest callback from the reader',async()=>{
 const f=resourceFixture();delete f.grant.modelSource.verifyRead;await denied(()=>readTensor(f),'MODEL_LOCAL_RESOURCE_NOT_ADMITTED');assert.equal(f.stats().reads,0);await f.resource.close();
});
test('a matching caller resource descriptor cannot replace the admitted capability object',async()=>{
 const f=resourceFixture(),other=resourceFixture();await denied(()=>readTensor(f,{resource:other.resource}),'MODEL_LOCAL_RESOURCE_NOT_ADMITTED');assert.equal(f.stats().reads,0);await f.resource.close();await other.resource.close();
});
test('unsafe tensor layout and oversized read fail before host I/O',async()=>{
 const f=resourceFixture();await denied(()=>readTensor(f,{tensor:{...tensor,fileOffset:Number.MAX_SAFE_INTEGER}}),'MODEL_RESOURCE_TENSOR_LAYOUT_INVALID');
 await denied(()=>readTensor(f,{rows:5}),'MODEL_RESOURCE_TENSOR_RANGE_INVALID');assert.equal(f.stats().reads,0);await f.resource.close();
 const small=resourceFixture({maxReadBytes:16});await denied(()=>readTensor(small),'MODEL_RESOURCE_RANGE_INVALID');assert.equal(small.stats().reads,0);await small.resource.close();
});
test('cancelled verification never releases bytes',async()=>{
 let start;const started=new Promise(resolve=>start=resolve),controller=new AbortController();
 const f=resourceFixture({verifyRead:()=>{start();return new Promise(()=>{});}});const pending=readTensor(f,{signal:controller.signal});await started;controller.abort();await denied(()=>pending,'MODEL_RESOURCE_CANCELLED');await f.resource.close();
});
test('provider swap during read is rejected',async()=>{
 const f=resourceFixture({verifyRead:proof=>{f.grant.modelSource.verifyRead=()=>null;return {...proof,verified:true,receiptSha256:H};}});await denied(()=>readTensor(f),'MODEL_RESOURCE_PROVIDER_CHANGED');await f.resource.close();
});

function request(){return snapshotInferenceRequest({type:'AI_INFERENCE',requestId:'fixture-request',sessionId:'fixture-session',modelSha256:J,tokenizerSha256:H,implementationSha256:K,contextLimit:8,maxNewTokens:1,inputIds:[1]});}
test('a transient host close failure can retry while reads remain permanently closed',async()=>{
 let attempts=0;const resource=createDeviceLocalModelResource({resourceId:'retry-close',byteLength:4,maxReadBytes:4,
  read:()=>new Uint8Array(4),close:()=>{if(++attempts===1)throw Error('TEMPORARY_CLOSE_FAILURE');}});
 await assert.rejects(resource.close(),/TEMPORARY_CLOSE_FAILURE/);
 await denied(()=>resource.read({offset:0,byteLength:4}),'MODEL_RESOURCE_CLOSED');
 await resource.close();await resource.close();assert.equal(attempts,2);
});
test('operator cleanup failure still attempts model resource cleanup',async()=>{
 const session=new LeeWayTransformerSession({device:null,plan:transformerPlan()});let closed=0;
 session.ops={close(){throw Error('OPERATOR_CLOSE_FAILURE');}};session.modelResource={async close(){closed++;}};
 await assert.rejects(session.close(),/OPERATOR_CLOSE_FAILURE/);assert.equal(closed,1);
});
function fullGrant(f,r,requestHash){return {...r,requestHash,leaseId:'fixture-lease',expiresAtMs:Date.now()+10000,
 execution:'LEEWAY_WGSL_TRANSFORMER',cpuNeuralFallback:false,remoteInference:false,externalModelServer:false,
 modelSource:{...f.grant.modelSource,requestHash},
 formula:{formulaId:'LEEWAY-FORMULA-v1.0',engineSha256:FORMULA_ENGINE_SHA256,adapterId:'fixture',mappingId:'SYNTHETIC_NOT_QUALIFIED',mappingSha256:H,inputHash:H,resultHash:J,receiptSha256:K,observationsSha256:H,envelopeSha256:J},
 preVeritas:{requestHash,receiptSha256:H},memory:{owner:'LEEWAY_DEVICE_WORKING_MEMORY_DATABASE',generation:'fixture',budgetBytes:1024,admissionReceiptSha256:H,acquireBuffer(){throw Error('NO_GPU_IN_STORAGE_TEST');},releaseBuffer(){}},
 continuum:{providerRef:'fixture',cellId:'fixture',readReceiptSha256:H,sessionId:r.sessionId,modelSha256:r.modelSha256,tokenizerSha256:r.tokenizerSha256}};}
test('grant validation accepts request-bound device resources and pins provider callbacks',async()=>{
 const f=resourceFixture(),r=request(),hash=await inferenceHash(r),g=fullGrant(f,r,hash);assert.equal(validateInferenceGrant(g,r,hash),g);
 g.modelSource.verifyRead=()=>null;assert.throws(()=>validateInferenceGrant(g,r,hash),/INFERENCE_MODEL_SOURCE_PROVIDER_CHANGED/);await f.resource.close();
});
test('local resource admission rejects wrong request, missing verifier and ambiguous URL',async()=>{
 for(const change of [g=>g.modelSource.requestHash=K,g=>delete g.modelSource.verifyRead,g=>g.modelSource.rangeBaseUrl='http://127.0.0.1/']){
  const f=resourceFixture(),r=request(),hash=await inferenceHash(r),g=fullGrant(f,r,hash);change(g);assert.throws(()=>validateInferenceGrant(g,r,hash),/INFERENCE_LOCAL_MODEL_RESOURCE_UNBOUND/);await f.resource.close();
 }
});
function transformerPlan(){
 const tensors=[];let fileOffset=0;const add=(name,shape)=>{const elements=shape.reduce((a,b)=>a*b,1),bytes=elements*4;tensors.push({name,shape,elements,bytes,fileOffset,type:0});fileOffset+=bytes;};
 add('token_embd.weight',[64,2]);add('output_norm.weight',[64]);for(const name of ['attn_norm.weight','ffn_norm.weight'])add('blk.0.'+name,[64]);
 for(const name of ['attn_q.weight','attn_k.weight','attn_v.weight','attn_output.weight','ffn_gate.weight','ffn_up.weight','ffn_down.weight'])add('blk.0.'+name,[64,64]);
 return {metadata:{'general.architecture':'qwen2','qwen2.embedding_length':64,'qwen2.block_count':1,'qwen2.attention.head_count':1,'qwen2.attention.head_count_kv':1,'qwen2.attention.layer_norm_rms_epsilon':1e-6},tensors,contextLimit:8,modelSha256:J,tokenizerSha256:H,implementationSha256:K};
}
test('real dispatcher and transformer range consume device storage without fetch or GPU allocation',async()=>{
 const bytes=new Uint8Array(128*1024),resource=createBlobModelResource(new Blob([bytes]),{resourceId:'graph-model',maxReadBytes:1024});
 const f=resourceFixture(),r=request();f.resource=resource;f.grant.modelSource={...f.grant.modelSource,resource,resourceId:resource.resourceId,byteLength:resource.byteLength,maxReadBytes:resource.maxReadBytes,
  verifyRead:async proof=>({...proof,verified:proof.sha256===await modelBytesSha256(bytes.slice(proof.offset,proof.offset+proof.byteLength)),receiptSha256:H})};
 const session=new LeeWayTransformerSession({device:null,plan:transformerPlan(),modelResource:resource});let read,closed=false;
 const binding={owner:'LEEWAY_RUNTIME_FABRIC',authorize:async(req,{requestHash})=>fullGrant(f,req,requestHash),revalidate:async()=>true,
  async verifyFormulaDecision(grant,{requestHash}){const x=grant.formula,p={schema:'leeway.formula.request-replay-proof.v1',requestId:r.requestId,sessionId:r.sessionId,requestHash,modelSha256:J,tokenizerSha256:H,implementationSha256:K,
   formulaId:x.formulaId,engineSha256:x.engineSha256,adapterId:x.adapterId,mappingId:x.mappingId,mappingSha256:x.mappingSha256,observationsSha256:x.observationsSha256,envelopeSha256:x.envelopeSha256,inputHash:x.inputHash,resultHash:x.resultHash,
   mathematicalReplayVerified:true,authorization:'NOT_GRANTED_BY_REPLAY',sourceHashes:{'leeway-formula-v1.mjs':FORMULA_ENGINE_SHA256}};return {...p,proofSha256:await inferenceHash(p)};},
  verify:async(_g,{requestHash,resultHash})=>({requestHash,resultHash,verified:true,receiptSha256:H}),
  commit:async(_g,{requestHash,resultHash})=>({requestHash,resultHash,sessionId:r.sessionId,readbackVerified:true,receiptSha256:H}),
  rollback:async()=>{throw Error('UNEXPECTED_ROLLBACK');},release:async()=>{assert(closed);}};
 const ml={async run(_r,context){session.executionContext=context;read=await session.range('token_embd.weight',0,1);return {execution:'LEEWAY_QUANTIZED_WGSL_GRAPH',externalModelEngine:false,cpuNeuralMath:false,outputIds:[],fixtureOnly:true};},async close(){await session.close();closed=true;}};
 try{const result=await new HybridDispatcher({ml,inferenceBinding:binding}).dispatch(r,{capability:'WEBGPU'});assert(result.fixtureOnly);assert.equal(read.byteLength,256);await denied(()=>resource.read({offset:0,byteLength:1}),'MODEL_RESOURCE_CLOSED');}
 finally{await session.close();await resource.close();}
});
