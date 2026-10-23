# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.TOKEN
# TAG: LEEWAY.G76.REAL_TOKEN_FORWARD
# 5WH: WHAT = Execute 36 Qwen3 layers from genuine token embedding and select next token.
# WHY = Test full real-weight forward pass and vocabulary logits.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g76-real-token-forward.py
# WHEN = 2026-10-22
# HOW = Bounded GGUF Q6_K embedding-row read; reuse validated operators; stream output logits.
# LICENSE: MIT
# AUTHORITY: Diagnostic CPU/NumPy only, no G70/RTX or production authorization.
import os,sys,json,time,hashlib,importlib.util,numpy as np
root=os.path.dirname(__file__)
def module(name,filename):
 s=importlib.util.spec_from_file_location(name,os.path.join(root,filename));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
g73=module('g73','g73-first-transformer-block.py')
g72=module('g72','g72-qkv-attention.py')
g62=module('g62','g62-native-quant-blocks.py')
def main(filename,token_id=151643):
 start=time.perf_counter();base,directory=g73.index_gguf(filename)
 shape,typ,offset=directory['token_embd.weight']
 if shape!=[2560,151936] or typ!=14 or not 0<=token_id<shape[1]:raise ValueError('G76_EMBEDDING_SCHEMA_INVALID')
 rowbytes=2560//256*210
 with open(filename,'rb') as f:
  f.seek(base+offset+rowbytes*token_id);raw=f.read(rowbytes)
 if len(raw)!=rowbytes:raise ValueError('G76_EMBEDDING_TRUNCATED')
 x=g62.decode(raw,14).reshape(1,2560)
 embed_sha=hashlib.sha256(x.tobytes()).hexdigest()
 checkpoints=[]
 for layer in range(36):
  W=lambda name:g73.weights(filename,base,directory,f'blk.{layer}.'+name)
  h=g73.rms(x,W('attn_norm.weight'))
  q=(h@W('attn_q.weight').T).reshape(32,128)
  k=(h@W('attn_k.weight').T).reshape(8,128)
  v=(h@W('attn_v.weight').T).reshape(8,128)
  q=g72.rope(g73.rms(q,W('attn_q_norm.weight')),0)
  k=g72.rope(g73.rms(k,W('attn_k_norm.weight')),0)
  # With a single token, each query head attends only its corresponding value.
  context=np.repeat(v,4,axis=0).reshape(1,4096)
  hidden=x+context@W('attn_output.weight').T
  h=g73.rms(hidden,W('ffn_norm.weight'))
  gate=h@W('ffn_gate.weight').T;up=h@W('ffn_up.weight').T
  x=hidden+(gate/(1+np.exp(-np.clip(gate,-80,80)))*up)@W('ffn_down.weight').T
  if not np.isfinite(x).all():raise ValueError('G76_NONFINITE_LAYER_'+str(layer))
  checkpoints.append(hashlib.sha256(x.tobytes()).hexdigest())
 # output_norm is global: do not substitute block norm.
 if 'output_norm.weight' not in directory:raise ValueError('G76_GLOBAL_NORM_MISSING')
 final=g73.rms(x,g73.weights(filename,base,directory,'output_norm.weight'))
 # model ties embedding weights if no output.weight tensor exists.
 if 'output.weight' in directory:raise ValueError('G76_UNTIED_OUTPUT_NEEDS_SEPARATE_PATH')
 best=(-float('inf'),-1);finite=0
 with open(filename,'rb') as f:
  f.seek(base+offset)
  for tid in range(shape[1]):
   block=f.read(rowbytes)
   if len(block)!=rowbytes:raise ValueError('G76_OUTPUT_TRUNCATED')
   weight=g62.decode(block,14)
   score=float(np.dot(weight,final[0]))
   if not np.isfinite(score):raise ValueError('G76_NONFINITE_LOGIT')
   finite+=1
   if score>best[0]:best=(score,tid)
 print(json.dumps({'status':'G76_REAL_TOKEN_FORWARD_PASS','inputTokenId':token_id,'embeddingSha256':embed_sha,'layersExecuted':len(checkpoints),'finalLayerSha256':checkpoints[-1],'vocabularyLogits':finite,'greedyNextTokenId':best[1],'topLogit':best[0],'elapsedSeconds':round(time.perf_counter()-start,3),'singlePositionNoKvCache':True,'tokenizerDecoded':False,'g70LdwmdExecuted':False,'productionAccepted':False},indent=2))
if __name__=='__main__':main(sys.argv[1],int(sys.argv[2]) if len(sys.argv)>2 else 151643)
