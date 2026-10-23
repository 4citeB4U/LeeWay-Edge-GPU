# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.FORWARD
# TAG: LEEWAY.G75.CONNECTED_LAYER_FORWARD
# 5WH: WHAT = Execute successive Qwen3 transformer layers with real GGUF weights.
# WHY = Verify each layer consumes previous layer output, not isolated demonstrations.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g75-chained-qwen3-layers.py
# WHEN = 2026-10-22
# HOW = Reuse verified G73 tensor decoder and G72 RoPE; bounded per-layer weights.
# LICENSE: MIT; AUTHORITY: Diagnostic only, not G70 or production model inference.
import os,sys,json,time,hashlib,importlib.util,numpy as np
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,os.path.join(os.path.dirname(__file__),file));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
g73=load('g73','g73-first-transformer-block.py')
g72=load('g72','g72-qkv-attention.py')
def run(filename,layers):
 base,directory=g73.index_gguf(filename)
 assert 1<=layers<=36
 x=np.stack([np.linspace(-.5,.5,2560,dtype=np.float32),np.linspace(.3,-.4,2560,dtype=np.float32)])
 evidence=[];start=time.perf_counter()
 for layer in range(layers):
  W=lambda key:g73.weights(filename,base,directory,f'blk.{layer}.'+key)
  n=g73.rms(x,W('attn_norm.weight'))
  q=(n@W('attn_q.weight').T).reshape(2,32,128)
  k=(n@W('attn_k.weight').T).reshape(2,8,128)
  v=(n@W('attn_v.weight').T).reshape(2,8,128)
  qw=W('attn_q_norm.weight');kw=W('attn_k_norm.weight')
  q=np.stack([g72.rope(g73.rms(q[i],qw),i) for i in range(2)])
  k=np.stack([g72.rope(g73.rms(k[i],kw),i) for i in range(2)])
  out=np.empty((2,32,128),dtype=np.float32)
  for t in range(2):
   keys=np.repeat(k[:t+1],4,axis=1).transpose(1,0,2)
   values=np.repeat(v[:t+1],4,axis=1).transpose(1,0,2)
   score=np.einsum('hd,htd->ht',q[t],keys)/np.sqrt(np.float32(128))
   score-=score.max(axis=1,keepdims=True)
   prob=np.exp(score);prob/=prob.sum(axis=1,keepdims=True)
   out[t]=np.einsum('ht,htd->hd',prob,values)
  hidden=x+out.reshape(2,4096)@W('attn_output.weight').T
  ff=g73.rms(hidden,W('ffn_norm.weight'))
  gate=ff@W('ffn_gate.weight').T
  up=ff@W('ffn_up.weight').T
  x=hidden+(gate/(1+np.exp(-np.clip(gate,-80,80)))*up)@W('ffn_down.weight').T
  if not np.isfinite(x).all():raise ValueError('G75_NONFINITE_LAYER_'+str(layer))
  evidence.append({'layer':layer,'outputSha256':hashlib.sha256(x.tobytes()).hexdigest()})
 report={'status':'G75_CHAINED_REAL_WEIGHTS_PASS','layersExecuted':layers,'inputSource':'synthetic_embedding_vectors','tokens':2,'finalOutputShape':list(x.shape),'elapsedSeconds':round(time.perf_counter()-start,3),'finalSha256':evidence[-1]['outputSha256'],'perLayer':evidence,'tokenizerExecuted':False,'logitsProduced':False,'g70LdwmdExecuted':False,'productionAccepted':False}
 print(json.dumps(report,indent=2))
if __name__=='__main__':run(sys.argv[1],int(sys.argv[2]) if len(sys.argv)>2 else 2)
