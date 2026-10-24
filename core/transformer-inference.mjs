/*
REGION: LEEWAY.EDGE_GPU.INFERENCE
TAG: LEEWAY.EDGE_GPU.TRANSFORMER_INFERENCE.G8
WHAT: LeeWay-owned single-sequence Qwen2/Gemma4 text graph over actual packed GGUF tensors.
WHY: The ML capability must execute model operations instead of forwarding to another inference runtime.
WHO: Creator-authorized Agent Lee. ROLES: EXECUTE VERIFY.
WHERE: Existing GPU core with existing pool/cache/dispatcher admission. No competing runtime or memory authority.
WHEN: Explicit bounded local sessions. HOW: Stream packed weights, page PLE rows, GPU normalization/attention/MLP/logits/selection.
LICENSE: MIT. Architecture math references Qwen2/Gemma4 primary implementations; no external model executor called.
*/
import {ModelOperatorEncoder} from '../dispatch/model-ops.mjs';
import {withDeviceSequence} from '../dispatch/compute.dispatch.js';
import {HybridDispatcher,requireInferenceExecution} from './hybrid.dispatcher.js';
import {readAdmittedModelTensor} from '../sdk/model-resource.mjs';
const finiteInteger=(v,min,max,k)=>{if(!Number.isSafeInteger(v)||v<min||v>max)throw Error('MODEL_METADATA_INVALID:'+k);return v;};
export class LeeWayTransformerSession{
  constructor({device,base,plan,modelResource}){
   this.device=device;this.base=base;this.modelResource=modelResource;this.plan=structuredClone(plan);plan=this.plan;this.arch=plan.metadata['general.architecture'];
  if(!['qwen2','gemma4'].includes(this.arch))throw Error('MODEL_ARCHITECTURE_UNSUPPORTED');
  this.meta=plan.metadata;this.byName=new Map(plan.tensors.map(t=>[t.name,t]));
  const get=(key)=>this.meta[this.arch+'.'+key];
  this.d=finiteInteger(get('embedding_length'),64,8192,'embedding');this.layers=finiteInteger(get('block_count'),1,80,'layers');
  this.heads=finiteInteger(get('attention.head_count'),1,128,'heads');this.kvHeads=finiteInteger(get('attention.head_count_kv'),1,this.heads,'kvHeads');
  this.eps=get('attention.layer_norm_rms_epsilon');if(!(this.eps>0&&this.eps<.1))throw Error('MODEL_NORM_EPS_INVALID');
  this.context=finiteInteger(plan.contextLimit,8,256,'contextLimit');
  this.vocab=this.tensor('token_embd.weight').shape[1];this.ownKv=this.layers-(get('attention.shared_kv_layers')||0);
  this.swa=this.arch==='gemma4'?get('attention.sliding_window_pattern'):Array(this.layers).fill(false);
  if(!Array.isArray(this.swa)||this.swa.length!==this.layers)throw Error('MODEL_ATTENTION_PATTERN_INVALID');
  this.perLayer=get('embedding_length_per_layer_input')||0;
  if(this.arch==='gemma4'&&this.perLayer!==256)throw Error('GEMMA4_PER_LAYER_PROFILE_UNSUPPORTED');
  this.weights=new Map();this.loaded=false;this.state='CREATED';this.tokenRecords=[];this.io={packedWeightBytes:0,pagedEmbeddingBytes:0};
  this.ops=null;this.executionContext=null;
  this.graph=[];
  const required=new Set(['token_embd.weight','output_norm.weight']);if(this.byName.has('output.weight'))required.add('output.weight');
  if(this.perLayer){required.add('per_layer_model_proj.weight');required.add('per_layer_proj_norm.weight');required.add('rope_freqs.weight');}
  for(let i=0;i<this.layers;i++){
   const prefix='blk.'+i+'.';const q=this.tensor(prefix+'attn_q.weight');const hd=q.shape[1]/this.heads;
   finiteInteger(hd,2,512,'headDim');const kvWidth=hd*this.kvHeads;const ff=this.tensor(prefix+'ffn_gate.weight').shape[1];
   finiteInteger(ff,1,32768,'ffWidth');
   const layer={index:i,prefix,hd,kvWidth,ff,shared:i>=this.ownKv,source:i>=this.ownKv?this.ownKv-(this.swa[i]?2:1):i};
   this.graph.push(layer);
   for(const name of ['attn_norm.weight','attn_q.weight','attn_output.weight','ffn_norm.weight','ffn_gate.weight','ffn_up.weight','ffn_down.weight'])required.add(prefix+name);
   if(this.arch==='qwen2')for(const name of ['attn_q.bias','attn_k.bias','attn_v.bias'])if(this.byName.has(prefix+name))required.add(prefix+name);
   if(!layer.shared){required.add(prefix+'attn_k.weight');if(this.byName.has(prefix+'attn_v.weight'))required.add(prefix+'attn_v.weight');if(this.arch==='gemma4')required.add(prefix+'attn_k_norm.weight');}
   if(this.arch==='gemma4')for(const name of ['attn_q_norm.weight','post_attention_norm.weight','post_ffw_norm.weight','inp_gate.weight','proj.weight','post_norm.weight','layer_output_scale.weight'])required.add(prefix+name);
   if(this.byName.has(prefix+'ffn_gate_exps.weight')||this.byName.has(prefix+'ffn_gate_inp.weight'))throw Error('MODEL_MOE_NOT_IMPLEMENTED');
  }
  const shape=(name,expected)=>{const t=this.tensor(name);if(t.shape.length!==expected.length||t.shape.some((v,i)=>v!==expected[i]))throw Error('MODEL_TENSOR_SHAPE_MISMATCH:'+name);};
  shape('token_embd.weight',[this.d,this.vocab]);shape('output_norm.weight',[this.d]);
  if(this.byName.has('output.weight'))shape('output.weight',[this.d,this.vocab]);
  for(const g of this.graph){const p=g.prefix;
   shape(p+'attn_q.weight',[this.d,g.hd*this.heads]);shape(p+'attn_output.weight',[g.hd*this.heads,this.d]);
   shape(p+'ffn_gate.weight',[this.d,g.ff]);shape(p+'ffn_up.weight',[this.d,g.ff]);shape(p+'ffn_down.weight',[g.ff,this.d]);
   shape(p+'attn_norm.weight',[this.d]);shape(p+'ffn_norm.weight',[this.d]);
   if(!g.shared){shape(p+'attn_k.weight',[this.d,g.kvWidth]);if(this.byName.has(p+'attn_v.weight'))shape(p+'attn_v.weight',[this.d,g.kvWidth]);}
  }
  if(this.perLayer){shape('per_layer_token_embd.weight',[this.perLayer*this.layers,this.vocab]);shape('per_layer_model_proj.weight',[this.d,this.perLayer*this.layers]);shape('per_layer_proj_norm.weight',[this.perLayer]);}
  this.required=[...required];let bytes=0;
  for(const name of this.required){const t=this.tensor(name);if(![0,1,2,6,8,12,14,30].includes(t.type)||!t.bytes)throw Error('MODEL_WEIGHT_FORMAT_UNSUPPORTED:'+name);bytes+=t.bytes;}
  this.estimatedResidentBytes=bytes;
  const maxHead=Math.max(...this.graph.map(g=>g.hd*this.heads)),maxKv=Math.max(...this.graph.map(g=>g.kvWidth)),maxFf=Math.max(...this.graph.map(g=>g.ff));
  const kvBytes=this.graph.filter(g=>!g.shared).reduce((sum,g)=>sum+2*g.kvWidth*this.context*4,0);
  const n=this.perLayer*this.layers;
  const activationBytes=(6*this.d+4*maxHead+5*maxKv+3*maxFf+2*this.vocab)*4+8+(this.perLayer?n*2+(5*n+2*this.perLayer+this.d)*4:0);
  this.memoryPlan=Object.freeze({packedWeightBytes:bytes,kvBytes,activationBytes,dummyBytes:4,
   residentFloorBytes:bytes+kvBytes+activationBytes+4,pagedPerTokenBytes:this.perLayer?n*2:0,
   excluded:'Transient uniforms, readback, driver/browser allocations and staging; not an exact physical VRAM claim.'});
 }
 tensor(name){const t=this.byName.get(name);if(!t)throw Error('MODEL_REQUIRED_TENSOR_ABSENT:'+name);return t;}
 async range(name,start,rows){
  const grant=await requireInferenceExecution(this.executionContext,this.plan,'BEFORE_TENSOR_READ:'+name);
  const signals=[AbortSignal.timeout(Math.max(1,Math.min(2147483647,grant.expiresAtMs-Date.now())))];
  if(this.executionContext.signal)signals.push(this.executionContext.signal);
   if(grant.modelSource.kind==='DEVICE_LOCAL_READONLY_GGUF')return readAdmittedModelTensor({grant,resource:this.modelResource,
    tensor:this.tensor(name),name,start,rows,signal:AbortSignal.any(signals)});
  const url=this.base+'tensor?name='+encodeURIComponent(name)+'&start='+start+'&rows='+rows;
  const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.any(signals)});if(!response.ok)throw Error('MODEL_RANGE_READ_FAILED:'+name);
  const data=await response.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==response.headers.get('X-Content-SHA256'))throw Error('MODEL_RANGE_INTEGRITY_FAILED');return data;
 }
 async load(context){
  const grant=await requireInferenceExecution(context,this.plan,'BEFORE_WEIGHT_ALLOCATION');
   if(grant.modelSource.kind==='DEVICE_LOCAL_READONLY_GGUF'){
    this.modelResource??=grant.modelSource.resource;
    if(this.modelResource!==grant.modelSource.resource)throw Error('MODEL_LOCAL_RESOURCE_NOT_ADMITTED');
   }else if(this.modelResource||this.base!==grant.modelSource.rangeBaseUrl)throw Error('MODEL_RANGE_SOURCE_NOT_ADMITTED');
  if(this.loaded)return;
  if(this.memoryPlan.residentFloorBytes>grant.memory.budgetBytes)throw Error('MODEL_LDWMD_BUDGET_INSUFFICIENT');
  this.executionContext=context;
  this.ops=new ModelOperatorEncoder(this.device,{memoryBudgetBytes:grant.memory.budgetBytes,allocationLease:grant.memory});
  this.state='LOADING';const start=performance.now();
  try{
   for(let i=0;i<this.required.length;i++){
    const name=this.required[i],t=this.tensor(name),rows=t.elements/t.shape[0],stride=t.bytes/rows;
    const chunkBudget=Math.min(24*1024*1024,grant.modelSource.maxReadBytes??24*1024*1024);
    if(stride>chunkBudget)throw Error('MODEL_RESOURCE_ROW_EXCEEDS_READ_BUDGET');
    const rowsPerChunk=Math.max(1,Math.min(65535,Math.floor(chunkBudget/stride))),parts=[];
    for(let row=0;row<rows;row+=rowsPerChunk){const count=Math.min(rowsPerChunk,rows-row),data=await this.range(name,row,count);if(data.byteLength!==count*stride)throw Error('MODEL_RANGE_SIZE_MISMATCH');const buffer=this.ops.upload(data);parts.push({buffer,start:row,rows:count});this.io.packedWeightBytes+=data.byteLength;await this.device.queue.onSubmittedWorkDone();}
    this.weights.set(name,{...t,parts});
   }
   const maxHead=Math.max(...this.graph.map(g=>g.hd*this.heads)),maxKv=Math.max(...this.graph.map(g=>g.kvWidth)),maxFf=Math.max(...this.graph.map(g=>g.ff));
   const allocate=n=>this.ops.allocate(n*4);
   this.s={h:allocate(this.d),hNext:allocate(this.d),norm:allocate(this.d),tmp:allocate(this.d),residual:allocate(this.d),projected:allocate(this.d),
    q:allocate(maxHead),qNorm:allocate(maxHead),qRope:allocate(maxHead),k:allocate(maxKv),kNorm:allocate(maxKv),kRope:allocate(maxKv),v:allocate(maxKv),vNorm:allocate(maxKv),attention:allocate(maxHead),
    gate:allocate(maxFf),up:allocate(maxFf),activated:allocate(maxFf),logits:allocate(this.vocab),logitsFinal:allocate(this.vocab),choice:this.ops.allocate(8)};
   if(this.perLayer){const n=this.perLayer*this.layers;Object.assign(this.s,{pleRaw:this.ops.allocate(n*2),pleEmbedding:allocate(n),pleProjection:allocate(n),pleNorm:allocate(n),pleScaled:allocate(n),ple:allocate(n),pleGate:allocate(this.perLayer),pleActivated:allocate(this.perLayer),pleOutput:allocate(this.d)});}
   this.kv=this.graph.filter(g=>!g.shared).map(g=>({key:allocate(g.kvWidth*this.context),value:allocate(g.kvWidth*this.context)}));
   this.loaded=true;this.state='READY';this.loadMs=performance.now()-start;
   }catch(error){this.state='FAILED';await this.close();throw error;}
 }
 weight(name){const w=this.weights.get(name);if(!w)throw Error('MODEL_WEIGHT_NOT_LOADED:'+name);return w;}
 vector(name){const w=this.weight(name);if(w.type!==0||w.parts.length!==1)throw Error('MODEL_NORM_WEIGHT_MUST_BE_F32:'+name);return w.parts[0].buffer;}
 mat(batch,name,input,output){const w=this.weight(name);if(w.shape.length!==2)throw Error('MODEL_MATRIX_SHAPE_INVALID');for(const part of w.parts)this.ops.matvec(batch,part.buffer,w.type,input,output,w.shape[0],part.rows,{outputOffset:part.start});}
 addBias(batch,name,input,output,length){if(this.weights.has(name))this.ops.element(batch,input,this.vector(name),output,length,0);else this.ops.copy(batch,input,output,length*4);}
 async token(id,position,needLogits){
  if(!this.loaded||this.state!=='READY')throw Error('MODEL_SESSION_NOT_READY');finiteInteger(id,0,this.vocab-1,'tokenId');finiteInteger(position,0,this.context-1,'tokenPosition');
  await requireInferenceExecution(this.executionContext,this.plan,'BEFORE_TOKEN_'+position);
  return withDeviceSequence(this.device,async()=>{
   const started=performance.now();const o=this.ops,s=this.s;
   if(this.perLayer){const bytes=await this.range('per_layer_token_embd.weight',id,1);if(bytes.byteLength!==this.perLayer*this.layers*2)throw Error('MODEL_PLE_ROW_SIZE');this.device.queue.writeBuffer(s.pleRaw,0,bytes);this.io.pagedEmbeddingBytes+=bytes.byteLength;}
   const batch=o.begin();let submitted=false;
   try{
    const embedding=this.weight('token_embd.weight'),part=embedding.parts.find(p=>id>=p.start&&id<p.start+p.rows);if(!part)throw Error('MODEL_EMBEDDING_ROW_NOT_RESIDENT');
    o.decode(batch,part.buffer,embedding.type,s.tmp,this.d,(id-part.start)*this.d);
    if(this.arch==='gemma4')o.element(batch,s.tmp,null,s.h,this.d,4,{scale:Math.sqrt(this.d),broadcast:true});else o.copy(batch,s.tmp,s.h,this.d*4);
    if(this.perLayer){
     const n=this.perLayer*this.layers;
     o.decode(batch,s.pleRaw,30,s.pleEmbedding,n);
     this.mat(batch,'per_layer_model_proj.weight',s.h,s.pleProjection);
     o.norm(batch,s.pleProjection,this.vector('per_layer_proj_norm.weight'),s.pleNorm,this.perLayer,{groups:this.layers,epsilon:this.eps,inputScale:1/Math.sqrt(this.d)});
     o.element(batch,s.pleEmbedding,null,s.pleScaled,n,4,{scale:Math.sqrt(this.perLayer),broadcast:true});
     o.element(batch,s.pleNorm,s.pleScaled,s.pleProjection,n,0);
     o.element(batch,s.pleProjection,null,s.ple,n,4,{scale:1/Math.sqrt(2),broadcast:true});
    }
    for(const g of this.graph){
     const p=g.prefix,gemma=this.arch==='gemma4';
     o.norm(batch,s.h,this.vector(p+'attn_norm.weight'),s.norm,this.d,{epsilon:this.eps});
     this.mat(batch,p+'attn_q.weight',s.norm,s.q);
     if(gemma)o.norm(batch,s.q,this.vector(p+'attn_q_norm.weight'),s.qNorm,g.hd,{groups:this.heads,epsilon:this.eps});
     else this.addBias(batch,p+'attn_q.bias',s.q,s.qNorm,g.hd*this.heads);
     const ropeBase=this.meta[this.arch+'.rope.freq_base'+(gemma&&this.swa[g.index]?'_swa':'')];
     const factors=gemma&&!this.swa[g.index]?this.vector('rope_freqs.weight'):null;
     o.rope(batch,s.qNorm,s.qRope,g.hd,this.heads,position,ropeBase,{factors});
     if(!g.shared){
      this.mat(batch,p+'attn_k.weight',s.norm,s.k);
      if(this.weights.has(p+'attn_v.weight'))this.mat(batch,p+'attn_v.weight',s.norm,s.v);else o.copy(batch,s.k,s.v,g.kvWidth*4);
      if(gemma){o.norm(batch,s.k,this.vector(p+'attn_k_norm.weight'),s.kNorm,g.hd,{groups:this.kvHeads,epsilon:this.eps});o.norm(batch,s.v,null,s.vNorm,g.hd,{groups:this.kvHeads,epsilon:this.eps});}
      else{this.addBias(batch,p+'attn_k.bias',s.k,s.kNorm,g.kvWidth);this.addBias(batch,p+'attn_v.bias',s.v,s.vNorm,g.kvWidth);}
      o.rope(batch,s.kNorm,s.kRope,g.hd,this.kvHeads,position,ropeBase,{factors});
      o.storeKV(batch,s.kRope,s.vNorm,this.kv[g.index].key,this.kv[g.index].value,g.kvWidth,position);
     }
     const cache=this.kv[g.source];if(!cache)throw Error('MODEL_SHARED_KV_SOURCE_INVALID');
     const sliding=gemma&&this.swa[g.index]?this.meta['gemma4.attention.sliding_window']:this.context;
     o.attention(batch,s.qRope,cache.key,cache.value,s.attention,{dim:g.hd,heads:this.heads,kvHeads:this.kvHeads,tokens:position+1,start:Math.max(0,position+1-sliding),scale:gemma?1:1/Math.sqrt(g.hd)});
     this.mat(batch,p+'attn_output.weight',s.attention,s.projected);
     if(gemma)o.norm(batch,s.projected,this.vector(p+'post_attention_norm.weight'),s.tmp,this.d,{epsilon:this.eps});else o.copy(batch,s.projected,s.tmp,this.d*4);
     o.element(batch,s.h,s.tmp,s.residual,this.d,0);
     o.norm(batch,s.residual,this.vector(p+'ffn_norm.weight'),s.norm,this.d,{epsilon:this.eps});
     this.mat(batch,p+'ffn_gate.weight',s.norm,s.gate);this.mat(batch,p+'ffn_up.weight',s.norm,s.up);
     o.element(batch,s.gate,s.up,s.activated,g.ff,gemma?3:2);
     this.mat(batch,p+'ffn_down.weight',s.activated,s.projected);
     if(gemma)o.norm(batch,s.projected,this.vector(p+'post_ffw_norm.weight'),s.tmp,this.d,{epsilon:this.eps});else o.copy(batch,s.projected,s.tmp,this.d*4);
     o.element(batch,s.residual,s.tmp,s.hNext,this.d,0);
     if(this.perLayer){
      this.mat(batch,p+'inp_gate.weight',s.hNext,s.pleGate);
      o.element(batch,s.pleGate,s.ple,s.pleActivated,this.perLayer,3,{bOffset:g.index*this.perLayer});
      this.mat(batch,p+'proj.weight',s.pleActivated,s.pleOutput);
      o.norm(batch,s.pleOutput,this.vector(p+'post_norm.weight'),s.tmp,this.d,{epsilon:this.eps});
      o.element(batch,s.hNext,s.tmp,s.projected,this.d,0);
      o.element(batch,s.projected,this.vector(p+'layer_output_scale.weight'),s.h,this.d,1,{broadcast:true});
     }else o.copy(batch,s.hNext,s.h,this.d*4);
    }
    let read;
    if(needLogits){
     o.norm(batch,s.h,this.vector('output_norm.weight'),s.norm,this.d,{epsilon:this.eps});
     this.mat(batch,this.weights.has('output.weight')?'output.weight':'token_embd.weight',s.norm,s.logits);
     const cap=this.meta[this.arch+'.final_logit_softcapping']||0;
     if(cap)o.element(batch,s.logits,null,s.logitsFinal,this.vocab,5,{scale:cap,broadcast:true});
     o.argmax(batch,cap?s.logitsFinal:s.logits,s.choice,this.vocab);submitted=true;read=await o.finish(batch,s.choice,8);
     const token=new Uint32Array(read.buffer)[0],score=new Float32Array(read.buffer)[1];if(token>=this.vocab||!Number.isFinite(score))throw Error('MODEL_INVALID_LOGITS');
     this.tokenRecords.push({position,inputId:id,outputId:token,score,commands:batch.commands,elapsedMs:performance.now()-started});return token;
    }
    submitted=true;await o.finish(batch);return null;
   }catch(error){if(!submitted)await o.abort(batch);this.state='FAILED';throw error;}
  });
 }
 async run(task,context={}){
  if(task.type!=='AI_INFERENCE'||!Array.isArray(task.inputIds))throw Error('MODEL_TASK_INVALID');
  const max=finiteInteger(task.maxNewTokens??24,1,64,'MAX_NEW_TOKENS');
  if(task.inputIds.length<1||task.inputIds.length+max>this.context)throw Error('MODEL_CONTEXT_BUDGET_EXCEEDED');
  await requireInferenceExecution(context,this.plan,'BEFORE_MODEL_EXECUTION');
  if(task.contextLimit!==this.context)throw Error('MODEL_CONTEXT_PLAN_MISMATCH');
  return (async()=>{
   const modelLoadState=this.loaded?'WARM_CACHED':'COLD_LOAD';
   const loadStarted=performance.now();await this.load(context);const modelLoadMs=performance.now()-loadStarted;
   const graphStarted=performance.now();const output=[];let token;
   for(let i=0;i<task.inputIds.length;i++){if(context.signal?.aborted)throw Error('MODEL_CANCELLED');token=await this.token(task.inputIds[i],i,i===task.inputIds.length-1);}
   const prefillMs=performance.now()-graphStarted;
   const stop=new Set(this.meta['tokenizer.ggml.eos_token_ids']||[this.meta['tokenizer.ggml.eos_token_id']]);
   let decodeMs=0,decodeModelSteps=0,decodeVisibleTokens=0,decodeStopTokens=0;
   for(let j=0;j<max;j++){
    if(context.signal?.aborted)throw Error('MODEL_CANCELLED');if(stop.has(token))break;output.push(token);
    if(j+1<max){
     const stepStarted=performance.now();token=await this.token(token,task.inputIds.length+j,true);
     decodeMs+=performance.now()-stepStarted;decodeModelSteps++;
     if(stop.has(token))decodeStopTokens++;else decodeVisibleTokens++;
    }
   }
   const graphAfterLoadMs=performance.now()-graphStarted;
   const modelLoadAndGraphMs=modelLoadMs+graphAfterLoadMs;
   const decodeTokensPerSecond=decodeVisibleTokens>0&&decodeMs>0?decodeVisibleTokens/(decodeMs/1000):null;
   const modelGraphTimings={schema:'leeway.gpu.model-graph-timings.v2',
    scope:'MODEL_GRAPH_AFTER_LOAD_EXCLUDES_AUTHORIZATION_POST_VERITAS_AND_CONTINUUM_COMMIT',
    modelLoadState,modelLoadMs,prefillMs,modelGraphFirstTokenReadyMs:prefillMs,
    clientTimeToFirstTokenMs:null,clientTimeToFirstTokenStatus:'NOT_MEASURED_NON_STREAMING_RESPONSE',
    decodeMs,decodeModelSteps,decodeVisibleTokens,decodeStopTokens,decodeTokensPerSecond,
    graphAfterLoadMs,modelLoadAndGraphMs,
    promptTokens:task.inputIds.length,visibleOutputTokens:output.length,
    tokenTimings:this.tokenRecords.map(({position,commands,elapsedMs})=>({position,commands,elapsedMs}))};
   return {outputIds:output,stopToken:stop.has(token)?token:null,stopReason:stop.has(token)?'MODEL_END_TOKEN':'MAX_NEW_TOKENS',prefillTokens:task.inputIds.length,loadMs:modelLoadMs,totalInferenceMs:graphAfterLoadMs,modelGraphTimings,
    execution:'LEEWAY_QUANTIZED_WGSL_GRAPH',architecture:this.arch,layers:this.layers,contextLimit:this.context,records:this.tokenRecords,resources:this.ops.describe(),io:this.io,
    externalModelEngine:false,cpuNeuralMath:false,formulaRouting:'REQUIRED_HOST_FORMULA_RECEIPT',ldWmdAllocation:'HOST_ADMITTED_LEASE_ONLY',canonicalAcceptance:'PENDING_HOST_POST_GATE',textOnly:true};
  })();
 }
  close(){
   let operatorError;try{this.ops?.close();}catch(error){operatorError=error;}
   this.weights.clear();this.loaded=false;this.executionContext=null;this.state='CLOSED';
   const resourceClose=this.modelResource?.close();
   if(!operatorError)return resourceClose;
   return Promise.resolve(resourceClose).then(()=>{throw operatorError;},error=>{throw new AggregateError([operatorError,error],'MODEL_SESSION_CLEANUP_FAILED');});
  }
}
export function inspectTransformerPlan(plan){
 const session=new LeeWayTransformerSession({device:null,base:null,plan});
 try{return {architecture:session.arch,layers:session.layers,hidden:session.d,contextLimit:session.context,
  perLayerInput:session.perLayer,sharedKvLayers:session.layers-session.ownKv,requiredTensorCount:session.required.length,
  requiredTensors:session.required,memory:session.memoryPlan,scope:'METADATA_PLAN_NOT_OPERATOR_OR_INFERENCE_QUALIFICATION',
  nativeOsAdapterRegistered:false};}finally{session.close();}
}
export async function runModel({device,base,plan,modelResource,inferenceBinding,requestId,sessionId,signal}){
 // No diagnostic always-true controller or implicit CPU/native-server alternative exists here.
 const session=new LeeWayTransformerSession({device,base,plan,modelResource});
 try{
  const dispatcher=new HybridDispatcher({ml:session,inferenceBinding});
  const context={capability:'WEBGPU',signal};
  const result=await dispatcher.dispatch({type:'AI_INFERENCE',requestId,sessionId,modelSha256:plan.modelSha256,
   tokenizerSha256:plan.tokenizerSha256,implementationSha256:plan.implementationSha256,
   contextLimit:plan.contextLimit,inputIds:plan.inputTokens,maxNewTokens:plan.maxNewTokens},context);
  return {...result,selectedDispatcherPath:context.executionPath};
 }finally{await session.close();}
}
