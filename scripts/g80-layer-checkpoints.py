# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.DIAGNOSTIC
# TAG: LEEWAY.G80.TWO_POSITION_LAYER_CHECKPOINTS
# 5WH: WHAT = Capture each of 36 layers for a two-token forward calculation.
# WHY = Prepare precise first-divergence comparisons; never infer equivalence from final token.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g80-layer-checkpoints.py
# WHEN = 2026-10-23
# HOW = Real GGUF embeddings, batched causal attention, per-layer SHA and norms.
# LICENSE: MIT
# AUTHORITY: Diagnostic only; llama.cpp intermediate tensors not yet available.
import os,sys,time,json,hashlib,importlib.util,numpy as np
root=os.path.dirname(__file__)
def get(name,file):
 spec=importlib.util.spec_from_file_location(name,os.path.join(root,file));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
g73=get('g73','g73-first-transformer-block.py');g72=get('g72','g72-qkv-attention.py');g62=get('g62','g62-native-quant-blocks.py')
def run(file):
 begin=time.perf_counter();base,idx=g73.index_gguf(file)
 dims,typ,offset=idx['token_embd.weight']
 if dims!=[2560,151936] or typ!=14:raise ValueError('G80_EMBED_FORMAT_INVALID')
 def emb(t):
  with open(file,'rb') as fh:fh.seek(base+offset+t*2100);raw=fh.read(2100)
  if len(raw)!=2100:raise ValueError('G80_TRUNCATED_EMBED')
  return g62.decode(raw,14)
 x=np.stack([emb(151643),emb(87)])
 checkpoints=[]
 for layer in range(36):
  W=lambda name:g73.weights(file,base,idx,f'blk.{layer}.'+name)
  n=g73.rms(x,W('attn_norm.weight'))
  q=(n@W('attn_q.weight').T).reshape(2,32,128)
  k=(n@W('attn_k.weight').T).reshape(2,8,128)
  v=(n@W('attn_v.weight').T).reshape(2,8,128)
  qn=W('attn_q_norm.weight');kn=W('attn_k_norm.weight')
  q=np.stack([g72.rope(g73.rms(q[i],qn),i) for i in range(2)])
  k=np.stack([g72.rope(g73.rms(k[i],kn),i) for i in range(2)])
  result=np.empty((2,32,128),dtype=np.float32)
  for t in range(2):
   keys=np.repeat(k[:t+1],4,axis=1).transpose(1,0,2)
   values=np.repeat(v[:t+1],4,axis=1).transpose(1,0,2)
   scores=np.einsum('hd,htd->ht',q[t],keys)/np.sqrt(np.float32(128))
   scores-=scores.max(axis=1,keepdims=True)
   p=np.exp(scores);p/=p.sum(axis=1,keepdims=True)
   result[t]=np.einsum('ht,htd->hd',p,values)
  hidden=x+result.reshape(2,4096)@W('attn_output.weight').T
  ff=g73.rms(hidden,W('ffn_norm.weight'))
  gate=ff@W('ffn_gate.weight').T;up=ff@W('ffn_up.weight').T
  x=hidden+(gate/(1+np.exp(-np.clip(gate,-80,80)))*up)@W('ffn_down.weight').T
  if not np.isfinite(x).all():raise ValueError(f'G80_NONFINITE_LAYER_{layer}')
  if os.environ.get('LEEWAY_G82_ARRAY_DIR'):
   for position in range(2):x[position].astype('<f4').tofile(os.path.join(os.environ['LEEWAY_G82_ARRAY_DIR'],f'batched_p{position}_l{layer}.bin'))
  checkpoints.append({'layer':layer,'pos0':hashlib.sha256(x[0].tobytes()).hexdigest(),'pos1':hashlib.sha256(x[1].tobytes()).hexdigest(),'pos1L2':float(np.linalg.norm(x[1].astype(np.float64)))})
 outcome={'status':'G80_LAYER_CHECKPOINTS_CAPTURED','positions':[151643,87],'layers':36,'elapsedSeconds':round(time.perf_counter()-begin,3),'checkpoints':checkpoints,'referenceIntermediateTensorsAvailable':False,'referenceSecondTokenId':970,'leewayIncrementalSecondTokenId':198,'divergenceLocated':False,'productionAccepted':False}
 print(json.dumps(outcome,indent=2))
if __name__=='__main__':run(sys.argv[1])
