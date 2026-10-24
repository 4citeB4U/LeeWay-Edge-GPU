// Allocation-trace tests only. Fake devices do not execute WGSL or neural math.
import test from 'node:test';import assert from 'node:assert/strict';
import {planTransformerBuffers} from '../../sdk/transformer-buffer-plan.mjs';
import {syntheticModelPlan} from '../fixtures/portable-model-plan.mjs';
import {createBlobModelResource,modelBytesSha256} from '../../sdk/model-resource.mjs';
import {LeeWayTransformerSession} from '../../core/transformer-inference.mjs';
import {HybridDispatcher} from '../../core/hybrid.dispatcher.js';
import {FORMULA_ENGINE_SHA256,inferenceHash,snapshotInferenceRequest} from '../../core/inference-contract.mjs';
const H='1'.repeat(64),J='2'.repeat(64),K='3'.repeat(64);
const limits={maxBufferSize:1024*1024,maxStorageBufferBindingSize:1024*1024,maxComputeWorkgroupsPerDimension:65535};
const options=plan=>({plan,maxReadBytes:4096,deviceLimits:limits});
const qwenPlan=()=>{const plan=syntheticModelPlan();plan.metadata['qwen2.rope.freq_base']=10000;return plan;};
function quantizedQwenPlan(){
 const plan=qwenPlan(),tensors=[];let fileOffset=0;
 const formats={0:[1,4],6:[32,22],8:[32,34],12:[256,144],14:[256,210]};
 const add=(name,shape,type=0)=>{const elements=shape.reduce((a,b)=>a*b,1),[block,width]=formats[type],bytes=elements/block*width;fileOffset=Math.ceil(fileOffset/32)*32;tensors.push({name,shape,type,elements,bytes,fileOffset});fileOffset+=bytes;};
 add('token_embd.weight',[256,98],8);add('output_norm.weight',[256]);
 for(const name of ['attn_norm.weight','ffn_norm.weight'])add('blk.0.'+name,[256]);
 add('blk.0.attn_q.weight',[256,256],6);add('blk.0.attn_output.weight',[256,256],6);
 add('blk.0.attn_k.weight',[256,64],12);add('blk.0.attn_v.weight',[256,64],8);
 for(const name of ['ffn_gate.weight','ffn_up.weight'])add('blk.0.'+name,[256,512],12);add('blk.0.ffn_down.weight',[512,256],14);
 add('blk.0.attn_q.bias',[256]);add('blk.0.attn_k.bias',[64]);add('blk.0.attn_v.bias',[64]);
 return {...plan,tensors,metadata:{...plan.metadata,'qwen2.embedding_length':256,'qwen2.attention.head_count':4}};
}
function gemmaPlan(){
 const source=syntheticModelPlan(),tensors=[];let fileOffset=0;
 const add=(name,shape,type=0)=>{const elements=shape.reduce((a,b)=>a*b,1),bytes=elements*(type===30?2:4);tensors.push({name,shape,elements,bytes,fileOffset,type});fileOffset+=bytes;};
 add('token_embd.weight',[64,98]);add('output_norm.weight',[64]);
 add('per_layer_token_embd.weight',[512,98],30);add('per_layer_model_proj.weight',[64,512]);add('per_layer_proj_norm.weight',[256]);add('rope_freqs.weight',[64]);
 for(let i=0;i<2;i++){const p='blk.'+i+'.';for(const name of ['attn_norm.weight','ffn_norm.weight','attn_q_norm.weight','post_attention_norm.weight','post_ffw_norm.weight','post_norm.weight'])add(p+name,[64]);
  for(const name of ['attn_q.weight','attn_output.weight','ffn_gate.weight','ffn_up.weight','ffn_down.weight'])add(p+name,[64,64]);
  if(i===0){add(p+'attn_k.weight',[64,64]);add(p+'attn_v.weight',[64,64]);add(p+'attn_k_norm.weight',[64]);}
  add(p+'inp_gate.weight',[64,256]);add(p+'proj.weight',[256,64]);add(p+'layer_output_scale.weight',[1]);
 }
 return {...source,tensors,metadata:{'general.architecture':'gemma4','gemma4.embedding_length':64,'gemma4.block_count':2,'gemma4.attention.head_count':1,'gemma4.attention.head_count_kv':1,
  'gemma4.attention.layer_norm_rms_epsilon':1e-6,'gemma4.embedding_length_per_layer_input':256,'gemma4.attention.shared_kv_layers':1,'gemma4.attention.sliding_window_pattern':[false,false],
  'gemma4.rope.freq_base':10000,'gemma4.final_logit_softcapping':30}};
}
const histogram=specs=>{const result={};for(const spec of specs){const key=spec.bytes+':'+spec.usage;result[key]=(result[key]||0)+1;}return Object.fromEntries(Object.entries(result).sort());};
function fakeDevice(){
 const live=new Map(),high=new Map();let liveBytes=0,peakBytes=0,allocations=0;
 const device={limits,lost:new Promise(()=>{}),pushErrorScope(){},async popErrorScope(){return null;},
  queue:{writeBuffer(){},submit(){},async onSubmittedWorkDone(){}},
  createBuffer({size,usage}){allocations++;const key=size+':'+usage;live.set(key,(live.get(key)||0)+1);high.set(key,Math.max(high.get(key)||0,live.get(key)));liveBytes+=size;peakBytes=Math.max(peakBytes,liveBytes);let destroyed=false;
   return {size,usage,async mapAsync(){},getMappedRange(){return new ArrayBuffer(size);},unmap(){},destroy(){if(!destroyed){destroyed=true;live.set(key,live.get(key)-1);liveBytes-=size;}}};},
  createShaderModule(){return {};},createComputePipeline(){return {getBindGroupLayout(){return {};}};},createBindGroup(){return {};},
  createCommandEncoder(){return {beginComputePass(){return {setPipeline(){},setBindGroup(){},dispatchWorkgroups(){},end(){}};},copyBufferToBuffer(){},finish(){return {};}};}};
 return {device,stats:()=>({peakBytes,liveBytes,allocations,high:Object.fromEntries([...high].sort())})};
}
function fixtureBinding(resource,device){
 return {owner:'LEEWAY_RUNTIME_FABRIC',
  async authorize(request,{requestHash}){return {...request,requestHash,leaseId:'trace-fixture',expiresAtMs:Date.now()+60000,execution:'LEEWAY_WGSL_TRANSFORMER',cpuNeuralFallback:false,remoteInference:false,externalModelServer:false,
   modelSource:{kind:'DEVICE_LOCAL_READONLY_GGUF',requestHash,modelSha256:request.modelSha256,readReceiptSha256:H,resourceId:resource.resourceId,resource,byteLength:resource.byteLength,maxReadBytes:resource.maxReadBytes,
    async verifyRead(proof){return {...proof,verified:proof.sha256===await modelBytesSha256(new Uint8Array(proof.byteLength)),receiptSha256:H};}},
   formula:{formulaId:'LEEWAY-FORMULA-v1.0',engineSha256:FORMULA_ENGINE_SHA256,adapterId:'trace-fixture',mappingId:'SYNTHETIC_NOT_QUALIFIED',mappingSha256:H,inputHash:H,resultHash:J,receiptSha256:K,observationsSha256:H,envelopeSha256:J},
   preVeritas:{requestHash,receiptSha256:H},memory:{owner:'LEEWAY_DEVICE_WORKING_MEMORY_DATABASE',generation:'trace-fixture',budgetBytes:1024*1024,admissionReceiptSha256:H,
    acquireBuffer({device:requestedDevice,bytes,usage}){assert.equal(requestedDevice,device);return device.createBuffer({size:bytes,usage});},releaseBuffer(buffer){buffer.destroy();}},
   continuum:{providerRef:'trace-fixture',cellId:'trace-fixture',readReceiptSha256:H,sessionId:request.sessionId,modelSha256:request.modelSha256,tokenizerSha256:request.tokenizerSha256}};},
  async verifyFormulaDecision(grant,{request,requestHash}){const f=grant.formula,proof={schema:'leeway.formula.request-replay-proof.v1',requestId:request.requestId,sessionId:request.sessionId,requestHash,
   modelSha256:request.modelSha256,tokenizerSha256:request.tokenizerSha256,implementationSha256:request.implementationSha256,formulaId:f.formulaId,engineSha256:f.engineSha256,adapterId:f.adapterId,mappingId:f.mappingId,
   mappingSha256:f.mappingSha256,observationsSha256:f.observationsSha256,envelopeSha256:f.envelopeSha256,inputHash:f.inputHash,resultHash:f.resultHash,mathematicalReplayVerified:true,authorization:'NOT_GRANTED_BY_REPLAY',sourceHashes:{'leeway-formula-v1.mjs':FORMULA_ENGINE_SHA256}};
   return {...proof,proofSha256:await inferenceHash(proof)};},async revalidate(){return true;},
  async verify(_grant,{requestHash,resultHash}){return {requestHash,resultHash,verified:true,receiptSha256:H};},
  async commit(grant,{requestHash,resultHash}){return {requestHash,resultHash,sessionId:grant.sessionId,readbackVerified:true,receiptSha256:H};},
  async rollback(_grant,{requestHash}){return {requestHash,rolledBack:true,receiptSha256:H};},async release(){}};
}

for(const [name,make]of [['Qwen2',qwenPlan],['quantized Qwen2 with Q/K/V bias',quantizedQwenPlan],['Gemma4 with shared KV and PLE',gemmaPlan]]){
 test(name+' planner matches actual encoder allocation lifetimes on a diagnostic fake device',async t=>{
  const previousUsage=globalThis.GPUBufferUsage,previousMode=globalThis.GPUMapMode;
  globalThis.GPUBufferUsage={MAP_READ:1,COPY_SRC:4,COPY_DST:8,UNIFORM:64,STORAGE:128};globalThis.GPUMapMode={READ:1};
  t.after(()=>{if(previousUsage===undefined)delete globalThis.GPUBufferUsage;else globalThis.GPUBufferUsage=previousUsage;if(previousMode===undefined)delete globalThis.GPUMapMode;else globalThis.GPUMapMode=previousMode;});
  const plan=make(),allocation=await planTransformerBuffers(options(plan)),fake=fakeDevice();
  const fileBytes=Math.max(...plan.tensors.map(t=>t.fileOffset+t.bytes));
  const resource=createBlobModelResource(new Blob([new Uint8Array(fileBytes)]),{resourceId:'trace-only-model',maxReadBytes:4096});
  const session=new LeeWayTransformerSession({device:fake.device,plan});
  const dispatcher=new HybridDispatcher({inferenceBinding:fixtureBinding(resource,fake.device),ml:{async run(request,context){const output=await session.run(request,context);return {...output,fixtureOnly:'ALLOCATION_TRACE_NO_NEURAL_MATH'};},close:()=>session.close()}});
  try{
   const result=await dispatcher.dispatch(snapshotInferenceRequest({type:'AI_INFERENCE',requestId:'trace-request',sessionId:'trace-session',...Object.fromEntries(['modelSha256','tokenizerSha256','implementationSha256','contextLimit'].map(k=>[k,plan[k]])),inputIds:[1,2],maxNewTokens:2}),{capability:'WEBGPU'});
   assert.equal(result.fixtureOnly,'ALLOCATION_TRACE_NO_NEURAL_MATH');assert.deepEqual(fake.stats().high,histogram(allocation.specs));
   assert.equal(fake.stats().peakBytes,allocation.budgetBytes);assert.equal(fake.stats().liveBytes,0);
   assert.equal(allocation.temporary.decode.uniform16+allocation.temporary.decode.uniform32,result.records[0].commands);
  }finally{await session.close();await resource.close();}
 });
}
test('planner digest binds model source, context, read budget and device limits',async()=>{
 const plan=qwenPlan(),first=await planTransformerBuffers(options(plan));
 assert(Object.isFrozen(first));assert(first.specs.every(s=>s.bytes%4===0&&Object.keys(s).sort().join(',')==='bytes,usage'));
 const {bufferPlanSha256,...body}=first;assert.equal(bufferPlanSha256,await inferenceHash(body));assert.equal(first.authority,'NOT_GRANTED_BY_BUFFER_PLAN');
 assert.equal((await planTransformerBuffers(options(plan))).bufferPlanSha256,first.bufferPlanSha256);
 for(const change of [o=>o.plan.contextLimit=64,o=>o.maxReadBytes=8192,o=>o.deviceLimits.maxBufferSize=2*1024*1024,o=>o.plan.modelSha256=K]){
  const changed=structuredClone(options(plan));change(changed);assert.notEqual((await planTransformerBuffers(changed)).bufferPlanSha256,first.bufferPlanSha256);
 }
});
test('unsupported or unsafe tensor descriptors fail before allocation',async()=>{
 for(const change of [p=>p.tensors.push({...p.tensors[0]}),p=>p.tensors[0].elements++,p=>p.tensors[0].bytes--,p=>p.tensors[0].shape[0]=Number.MAX_SAFE_INTEGER,p=>p.tensors[0].fileOffset=Number.MAX_SAFE_INTEGER,p=>p.modelSha256=null,p=>p.metadata['general.architecture']='unsupported']){
  const plan=qwenPlan();change(plan);await assert.rejects(planTransformerBuffers(options(plan)));
 }
 const type=qwenPlan();type.tensors.find(t=>t.name==='blk.0.attn_q.weight').type=3;await assert.rejects(planTransformerBuffers(options(type)),/WEIGHT_FORMAT_UNSUPPORTED|MODEL_WEIGHT_FORMAT_UNSUPPORTED/);
 const rope=qwenPlan();delete rope.metadata['qwen2.rope.freq_base'];await assert.rejects(planTransformerBuffers(options(rope)),/ROPE_PROFILE_UNSUPPORTED/);
});
test('planner rejects read budgets, device allocation limits and dispatch limits the graph cannot honor',async()=>{
 const plan=qwenPlan();await assert.rejects(planTransformerBuffers({...options(plan),maxReadBytes:255}),/ROW_EXCEEDS_READ_BUDGET/);
 await assert.rejects(planTransformerBuffers({...options(plan),maxReadBytes:0}),/READ_BUDGET_INVALID/);
 await assert.rejects(planTransformerBuffers({...options(plan),deviceLimits:{...limits,maxBufferSize:1024}}),/BUFFER_LIMIT_EXCEEDED/);
 await assert.rejects(planTransformerBuffers({...options(plan),deviceLimits:{...limits,maxComputeWorkgroupsPerDimension:1}}),/WORKGROUP_LIMIT_EXCEEDED/);
 await assert.rejects(planTransformerBuffers({...options(plan),deviceLimits:{}}),/DEVICE_LIMITS_REQUIRED/);
});
