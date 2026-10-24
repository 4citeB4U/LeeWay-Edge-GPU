/*
REGION: LEEWAY.EDGE_GPU.MEMORY_PLANNING
TAG: LEEWAY.EDGE_GPU.TRANSFORMER_BUFFER_PLAN.V1
WHAT: Describe the exact current transformer buffer lifetimes before LDWMD admission.
WHY: The existing synchronous operator encoder must borrow already admitted buffers.
SCOPE: Allocation planning only. No device allocation, model execution or authority is issued.
*/
import {LeeWayTransformerSession} from '../core/transformer-inference.mjs';
import {inferenceHash,isSha256} from '../core/inference-contract.mjs';

const STORAGE=140,UNIFORM=72,READBACK=9;
const FORMATS=new Map([[0,[1,4]],[1,[1,2]],[2,[32,18]],[6,[32,22]],[8,[32,34]],[12,[256,144]],[14,[256,210]],[30,[1,2]]]);
const fail=code=>{throw Error(code);};
const integer=(value,min=1,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const aligned=bytes=>Math.ceil(bytes/4)*4;
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
const total=specs=>specs.reduce((sum,spec)=>{const next=sum+spec.bytes;if(!Number.isSafeInteger(next))fail('BUFFER_PLAN_BYTES_UNSAFE');return next;},0);

/**
 * deviceLimits and maxReadBytes must be the actual execution profile used by
 * runModel. The digest binds that profile; it does not authenticate its source.
 * Specs contain only {bytes,usage}, matching Runtime Fabric's LDWMD adapter.
 */
export async function planTransformerBuffers({plan,maxReadBytes,deviceLimits}={}){
 const snapshot=structuredClone(plan),limits={};
 for(const key of ['maxBufferSize','maxStorageBufferBindingSize','maxComputeWorkgroupsPerDimension']){
  if(!integer(deviceLimits?.[key]))fail('BUFFER_PLAN_DEVICE_LIMITS_REQUIRED');limits[key]=deviceLimits[key];
 }
 if(!integer(maxReadBytes,1,128*1024*1024))fail('BUFFER_PLAN_READ_BUDGET_INVALID');
 for(const key of ['modelSha256','tokenizerSha256','implementationSha256'])if(!isSha256(snapshot?.[key]))fail('BUFFER_PLAN_SOURCE_IDENTITY_REQUIRED');
 if(!Array.isArray(snapshot?.tensors)||!snapshot.tensors.length||snapshot.tensors.length>100000)fail('BUFFER_PLAN_TENSOR_DIRECTORY_INVALID');
 const seen=new Set();
 for(const t of snapshot.tensors){
  if(!t||typeof t.name!=='string'||!t.name||seen.has(t.name)||!Array.isArray(t.shape)||!integer(t.shape.length,1,4)||!t.shape.every(n=>integer(n,1,2**32)))fail('BUFFER_PLAN_TENSOR_DIRECTORY_INVALID');
  seen.add(t.name);const elements=t.shape.reduce((a,b)=>a*b,1),format=FORMATS.get(t.type);
  if(!integer(elements)||t.elements!==elements||!integer(t.bytes)||!integer(t.fileOffset,0)||!Number.isSafeInteger(t.fileOffset+t.bytes))fail('BUFFER_PLAN_TENSOR_LAYOUT_INVALID');
  // Non-text tensors are allowed in a multimodal GGUF. Required text tensors
  // are checked below against the formats this graph actually implements.
  if(format&&(t.shape[0]%format[0]||t.bytes!==elements/format[0]*format[1]))fail('BUFFER_PLAN_TENSOR_LAYOUT_INVALID');
 }
 const session=new LeeWayTransformerSession({device:null,plan:snapshot});
 try{
  const cap=Math.min(limits.maxBufferSize,limits.maxStorageBufferBindingSize),specs=[],chunks=[],parts=new Map();
  const spec=(bytes,usage)=>{
   const size=aligned(bytes);if(!integer(bytes)||!integer(size)||size>cap)fail('BUFFER_PLAN_BUFFER_LIMIT_EXCEEDED');
   return {bytes:size,usage};
  };
  const append=(bytes,usage=STORAGE)=>{if(specs.length>=65536)fail('BUFFER_PLAN_SPEC_LIMIT_EXCEEDED');const value=spec(bytes,usage);specs.push(value);return value;};
  const shape=(name,expected)=>{const t=session.tensor(name);if(t.shape.length!==expected.length||t.shape.some((n,i)=>n!==expected[i]))fail('BUFFER_PLAN_TENSOR_SHAPE_UNSUPPORTED');};
  if(session.heads%session.kvHeads||!integer(session.vocab,1,1048576)||!integer(session.ownKv,1,session.layers)||
   session.swa.some(value=>typeof value!=='boolean')||session.graph.some(g=>!integer(g.source,0,session.ownKv-1)))fail('BUFFER_PLAN_GRAPH_UNSUPPORTED');
  const vectorNames=new Set(['output_norm.weight']);
  if(session.perLayer){vectorNames.add('per_layer_proj_norm.weight');vectorNames.add('rope_freqs.weight');}
  for(const g of session.graph){
   const p=g.prefix;vectorNames.add(p+'attn_norm.weight');vectorNames.add(p+'ffn_norm.weight');
   const ropeBase=session.meta[session.arch+'.rope.freq_base'+(session.arch==='gemma4'&&session.swa[g.index]?'_swa':'')];
   if(!Number.isFinite(ropeBase)||ropeBase<=0||g.hd%2)fail('BUFFER_PLAN_ROPE_PROFILE_UNSUPPORTED');
   for(const key of ['attn_q.bias','attn_k.bias','attn_v.bias'])if(session.byName.has(p+key)){shape(p+key,[key==='attn_q.bias'?g.hd*session.heads:g.kvWidth]);vectorNames.add(p+key);}
   if(session.arch==='gemma4'){
    shape(p+'attn_q_norm.weight',[g.hd]);vectorNames.add(p+'attn_q_norm.weight');
    if(!g.shared){shape(p+'attn_k_norm.weight',[g.hd]);vectorNames.add(p+'attn_k_norm.weight');}
    for(const key of ['post_attention_norm.weight','post_ffw_norm.weight','post_norm.weight']){shape(p+key,[session.d]);vectorNames.add(p+key);}
    shape(p+'layer_output_scale.weight',[1]);vectorNames.add(p+'layer_output_scale.weight');
    shape(p+'inp_gate.weight',[session.d,session.perLayer]);shape(p+'proj.weight',[session.perLayer,session.d]);
   }
  }
  for(const name of session.required){
   const t=session.tensor(name),format=FORMATS.get(t.type);
   if(!format||t.bytes!==t.elements/format[0]*format[1]||t.shape[0]%format[0])fail('BUFFER_PLAN_WEIGHT_FORMAT_UNSUPPORTED');
   const rows=t.elements/t.shape[0],stride=t.bytes/rows,chunkBudget=Math.min(24*1024*1024,maxReadBytes);
   if(!integer(rows)||!integer(stride)||stride>chunkBudget)fail('BUFFER_PLAN_ROW_EXCEEDS_READ_BUDGET');
   const rowsPerChunk=Math.max(1,Math.min(65535,Math.floor(chunkBudget/stride))),count=Math.ceil(rows/rowsPerChunk);
   if(count+specs.length>65536)fail('BUFFER_PLAN_SPEC_LIMIT_EXCEEDED');
   if(vectorNames.has(name)&&(t.type!==0||count!==1))fail('BUFFER_PLAN_VECTOR_PROFILE_UNSUPPORTED');
   parts.set(name,count);
   for(let rowStart=0;rowStart<rows;rowStart+=rowsPerChunk){
    const rowCount=Math.min(rowsPerChunk,rows-rowStart);if(rowCount>limits.maxComputeWorkgroupsPerDimension&&t.shape.length===2)fail('BUFFER_PLAN_WORKGROUP_LIMIT_EXCEEDED');
    const entry=append(rowCount*stride);chunks.push({tensor:name,rowStart,rowCount,offset:t.fileOffset+rowStart*stride,...entry});
   }
  }
  const weightsEnd=specs.length;append(4);
  const maxHead=Math.max(...session.graph.map(g=>g.hd*session.heads)),maxKv=Math.max(...session.graph.map(g=>g.kvWidth)),maxFf=Math.max(...session.graph.map(g=>g.ff)),n=session.perLayer*session.layers;
  if(Math.max(session.heads,session.kvHeads,session.layers,Math.ceil(Math.max(session.d,maxHead,maxKv,maxFf,session.vocab,n)/128))>limits.maxComputeWorkgroupsPerDimension)fail('BUFFER_PLAN_WORKGROUP_LIMIT_EXCEEDED');
  for(const [count,bytes]of [[6,session.d*4],[4,maxHead*4],[5,maxKv*4],[3,maxFf*4],[2,session.vocab*4],[1,8]])for(let i=0;i<count;i++)append(bytes);
  if(session.perLayer){append(n*2);for(let i=0;i<5;i++)append(n*4);append(session.perLayer*4);append(session.perLayer*4);append(session.d*4);}
  const activationsEnd=specs.length;
  for(const g of session.graph.filter(g=>!g.shared)){append(g.kvWidth*session.context*4);append(g.kvWidth*session.context*4);}
  const persistentEnd=specs.length,persistentBytes=total(specs);

  // Every parameter() allocation remains live until finish(). Current uniform
  // layouts are 16 or 32 bytes; copies allocate none. The last prompt token and
  // each decode step include the output head and one eight-byte readback.
  function tokenPool(logits){
   let uniform16=0,uniform32=0;
   const op=bytes=>{if(bytes===16)uniform16++;else uniform32++;};
   const mat=name=>{const count=parts.get(name);if(!integer(count))fail('BUFFER_PLAN_GRAPH_UNSUPPORTED');uniform16+=count;};
   op(16);if(session.arch==='gemma4')op(32);
   if(session.perLayer){op(16);mat('per_layer_model_proj.weight');for(let i=0;i<4;i++)op(32);}
   for(const g of session.graph){const p=g.prefix,gemma=session.arch==='gemma4';
    op(32);mat(p+'attn_q.weight');if(gemma||parts.has(p+'attn_q.bias'))op(32);op(32);
    if(!g.shared){mat(p+'attn_k.weight');if(parts.has(p+'attn_v.weight'))mat(p+'attn_v.weight');
     if(gemma){op(32);op(32);}else{if(parts.has(p+'attn_k.bias'))op(32);if(parts.has(p+'attn_v.bias'))op(32);}
     op(32);op(16);
    }
    op(32);mat(p+'attn_output.weight');if(gemma)op(32);op(32);op(32);
    mat(p+'ffn_gate.weight');mat(p+'ffn_up.weight');op(32);mat(p+'ffn_down.weight');if(gemma)op(32);op(32);
    if(session.perLayer){mat(p+'inp_gate.weight');op(32);mat(p+'proj.weight');op(32);op(32);op(32);}
   }
   if(logits){op(32);mat(parts.has('output.weight')?'output.weight':'token_embd.weight');if(session.meta[session.arch+'.final_logit_softcapping'])op(32);op(16);}
   return {uniform16,uniform32,uniformBytes:uniform16*16+uniform32*32,readbackBytes:logits?8:0};
  }
  const prefill=tokenPool(false),decode=tokenPool(true);
  const uniform16=Math.max(prefill.uniform16,decode.uniform16),uniform32=Math.max(prefill.uniform32,decode.uniform32);
  for(let i=0;i<uniform16;i++)append(16,UNIFORM);for(let i=0;i<uniform32;i++)append(32,UNIFORM);append(8,READBACK);
  const budgetBytes=total(specs);if(budgetBytes>4*1024**3)fail('BUFFER_PLAN_CURRENT_MEMORY_PROFILE_EXCEEDED');
  const body={schema:'leeway.gpu.transformer-buffer-plan.v1',modelSha256:snapshot.modelSha256,tokenizerSha256:snapshot.tokenizerSha256,
   implementationSha256:snapshot.implementationSha256,modelPlanSha256:await inferenceHash(snapshot),contextLimit:session.context,
   maxReadBytes,deviceLimits:limits,architecture:session.arch,specs,weightChunks:chunks,
   persistent:{buffers:persistentEnd,weightBuffers:weightsEnd,activationBuffers:activationsEnd-weightsEnd-1,kvBuffers:persistentEnd-activationsEnd,bytes:persistentBytes},
   temporary:{uniform16,uniform32,readbackBuffers:1,prefill,decode},budgetBytes,
   authority:'NOT_GRANTED_BY_BUFFER_PLAN',scope:'REQUEST_BUFFER_API_ALLOCATION_PLAN_NOT_PHYSICAL_VRAM_OR_MODEL_CORRECTNESS_PROOF'};
  return freeze({...body,bufferPlanSha256:await inferenceHash(body)});
 }finally{await session.close();}
}
