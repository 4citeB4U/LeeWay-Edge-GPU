# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G79.CAUSAL_KV_BATCH_INVARIANT
# 5WH: WHAT = Compare two-position causal attention with incremental KV, using true layer-0 weights.
# WHY = Locate G78 mismatch before changing RoPE or model arithmetic.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g79-cache-causal-invariant.py
# WHEN = 2026-10-23
# HOW = Decode real embeddings and layer-0 QKV, compare two independent attention evaluation forms.
# LICENSE: MIT; AUTHORITY: Diagnostic only, no production, no model acceptance.
import os,sys,json,numpy as np,importlib.util
root=os.path.dirname(__file__)
def mod(name,filename):
 spec=importlib.util.spec_from_file_location(name,os.path.join(root,filename));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
g73=mod('g73','g73-first-transformer-block.py')
g72=mod('g72','g72-qkv-attention.py')
g62=mod('g62','g62-native-quant-blocks.py')
def run(file):
 base,info=g73.index_gguf(file)
 emb_shape,typ,offset=info['token_embd.weight']
 assert emb_shape==[2560,151936] and typ==14
 def embed(token):
  with open(file,'rb') as f:f.seek(base+offset+token*2100);raw=f.read(2100)
  return g62.decode(raw,14)
 x=np.stack([embed(151643),embed(87)])
 W=lambda name:g73.weights(file,base,info,'blk.0.'+name)
 n=g73.rms(x,W('attn_norm.weight'))
 q=(n@W('attn_q.weight').T).reshape(2,32,128)
 k=(n@W('attn_k.weight').T).reshape(2,8,128)
 v=(n@W('attn_v.weight').T).reshape(2,8,128)
 qw=W('attn_q_norm.weight');kw=W('attn_k_norm.weight')
 q=np.stack([g72.rope(g73.rms(q[i],qw),i) for i in range(2)])
 k=np.stack([g72.rope(g73.rms(k[i],kw),i) for i in range(2)])
 a=[];b=[]
 for t in range(2):
  # G78 cache incremental computation
  ks=np.repeat(k[:t+1],4,axis=1).transpose(1,0,2)
  vs=np.repeat(v[:t+1],4,axis=1).transpose(1,0,2)
  s=np.einsum('hd,htd->ht',q[t],ks)/np.sqrt(np.float32(128))
  s-=s.max(axis=1,keepdims=True);p=np.exp(s);p/=p.sum(axis=1,keepdims=True)
  a.append(np.einsum('ht,htd->hd',p,vs))
 # Independent PyTorch batched two-position causal attention.
 import torch
 tq=torch.from_numpy(q.copy()).permute(1,0,2)
 tk=torch.from_numpy(np.repeat(k,4,axis=1).copy()).permute(1,0,2)
 tv=torch.from_numpy(np.repeat(v,4,axis=1).copy()).permute(1,0,2)
 logits=tq@tk.transpose(1,2)/np.sqrt(128)
 mask=torch.ones((2,2),dtype=torch.bool).tril()
 logits=logits.masked_fill(~mask.unsqueeze(0),float('-inf'))
 b=(torch.softmax(logits,dim=-1)@tv).permute(1,0,2).numpy()
 a=np.stack(a);error=float(np.max(np.abs(a-b)))
 passed=bool(np.allclose(a,b,atol=3e-5,rtol=3e-5))
 print(json.dumps({'status':'G79_CAUSAL_CACHE_EQUIVALENT' if passed else 'G79_CAUSAL_CACHE_DIVERGENT','positions':2,'layer':0,'attentionElements':int(a.size),'maxAbsoluteDifference':error,'passesTolerance':passed,'llamaCppModelTokenMismatchStillOpen':True,'productionAccepted':False},indent=2))
 if not passed:sys.exit(1)
if __name__=='__main__':run(sys.argv[1])
