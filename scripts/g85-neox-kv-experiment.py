# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.KV
# TAG: LEEWAY.G85.NEOX_KV_EXPERIMENT
# 5WH: WHAT = Execute two real token embeddings sequentially with reusable KV cache.
# WHY = Extend G77 single-token result to causal multi-position inference.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g85-neox-kv-experiment.py
# WHEN = 2026-10-22
# HOW = Real GGUF weights, cached per-layer K/V, Qwen3 RoPE and greedy final logits.
# LICENSE: MIT; AUTHORITY: CPU NumPy diagnostic, not G70 production.
import os,sys,json,time,hashlib,importlib.util,numpy as np
def module(name,file):
 s=importlib.util.spec_from_file_location(name,os.path.join(os.path.dirname(__file__),file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
g73=module('g73','g73-first-transformer-block.py')
g72=module('g72','g72-qkv-attention.py')
g62=module('g62','g62-native-quant-blocks.py')
g84=module('g84','g84-rope-convention.py')
def run(filename,tokens=(151643,87)):
 base,directory=g73.index_gguf(filename)
 shape,typ,offset=directory['token_embd.weight']
 if shape!=[2560,151936] or typ!=14:raise ValueError('G78_EMBED_SCHEMA')
 rowbytes=2560//256*210
 def embedding(token):
  if not 0<=token<shape[1]:raise ValueError('G78_TOKEN_BOUNDS')
  with open(filename,'rb') as f:f.seek(base+offset+token*rowbytes);raw=f.read(rowbytes)
  if len(raw)!=rowbytes:raise ValueError('G78_EMBED_TRUNCATED')
  return g62.decode(raw,14).reshape(1,2560)
 caches=[([],[]) for _ in range(36)];start=time.perf_counter();reports=[]
 for pos,token in enumerate(tokens):
  x=embedding(token)
  for layer in range(36):
   W=lambda name:g73.weights(filename,base,directory,f'blk.{layer}.'+name)
   normalized=g73.rms(x,W('attn_norm.weight'))
   q=(normalized@W('attn_q.weight').T).reshape(32,128)
   k=(normalized@W('attn_k.weight').T).reshape(8,128)
   v=(normalized@W('attn_v.weight').T).reshape(8,128)
   q=g84.neox(g73.rms(q,W('attn_q_norm.weight')),pos)
   k=g84.neox(g73.rms(k,W('attn_k_norm.weight')),pos)
   ks,vs=caches[layer];ks.append(k.copy());vs.append(v.copy())
   keys=np.repeat(np.stack(ks),4,axis=1).transpose(1,0,2)
   values=np.repeat(np.stack(vs),4,axis=1).transpose(1,0,2)
   scores=np.einsum('hd,htd->ht',q,keys)/np.sqrt(np.float32(128))
   scores-=np.max(scores,axis=1,keepdims=True)
   probs=np.exp(scores);probs/=probs.sum(axis=1,keepdims=True)
   context=np.einsum('ht,htd->hd',probs,values).reshape(1,4096)
   hidden=x+context@W('attn_output.weight').T
   h=g73.rms(hidden,W('ffn_norm.weight'))
   gate=h@W('ffn_gate.weight').T;up=h@W('ffn_up.weight').T
   x=hidden+(gate/(1+np.exp(-np.clip(gate,-80,80)))*up)@W('ffn_down.weight').T
   if not np.isfinite(x).all():raise ValueError('G78_NONFINITE_'+str(layer))
   if os.environ.get('LEEWAY_G82_ARRAY_DIR'):
    x.astype('<f4').tofile(os.path.join(os.environ['LEEWAY_G82_ARRAY_DIR'],f'cached_p{pos}_l{layer}.bin'))
   if os.environ.get('LEEWAY_G81_CAPTURE'): 
    with open(os.environ['LEEWAY_G81_CAPTURE'],'a',encoding='utf8') as checkpoint:checkpoint.write(json.dumps({'position':pos,'layer':layer,'sha256':hashlib.sha256(x.tobytes()).hexdigest()})+'\n')
  if os.environ.get('LEEWAY_G87_HIDDEN_PATH') and pos==len(tokens)-1:x.astype('<f4').tofile(os.environ['LEEWAY_G87_HIDDEN_PATH'])
  final=g73.rms(x,g73.weights(filename,base,directory,'output_norm.weight'))
  best=(-float('inf'),-1)
  with open(filename,'rb') as f:
   f.seek(base+offset)
   for i in range(shape[1]):
    block=f.read(rowbytes)
    if len(block)!=rowbytes:raise ValueError('G78_OUTPUT_TRUNCATED')
    score=float(np.dot(g62.decode(block,14),final[0]))
    if score>best[0]:best=(score,i)
  reports.append({'position':pos,'inputTokenId':token,'nextTokenId':best[1],'topLogit':best[0],'layers':36,'cachedPositions':len(caches[0][0]),'outputSha256':hashlib.sha256(x.tobytes()).hexdigest()})
 print(json.dumps({'status':'G78_INCREMENTAL_KV_EXECUTED','predictions':reports,'elapsedSeconds':round(time.perf_counter()-start,3),'modelFile':os.path.basename(filename),'independentReferenceCompared':False,'g70LdwmdExecuted':False,'productionAccepted':False},indent=2))
if __name__=='__main__':run(sys.argv[1])
