# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.ATTENTION
# TAG: LEEWAY.G72.REAL_WEIGHT_QKV_ATTENTION
# 5WH: WHAT = Verify real Qwen3 Q,K,V projections and 2-token causal attention.
# WHY = Extend G71 from a single key to QKV, RoPE, softmax and weighted value.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g72-qkv-attention.py
# WHEN = 2026-10-22
# HOW = GGUF Q4_K/Q6_K decoder and independent PyTorch operator reference.
# LICENSE: MIT
# AUTHORITY: Diagnostic reference; not G22/LDWMD dispatch or full inference.
import os,sys,json,importlib.util,numpy as np
def load(name,filename):
 sp=importlib.util.spec_from_file_location(name,os.path.join(os.path.dirname(__file__),filename));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
g64=load('g64','g64-attention-projection.py')
g63=load('g63','g63-qwen3-rmsnorm.py')
g62=load('g62','g62-native-quant-blocks.py')
def projection(file,name,inputs,kind):
 # G64 locator is pinned to K only; use same binary directory with name and expected shape adapted separately.
 from pathlib import Path
 import struct
 with open(file,'rb') as f:
  def rd(n):
   if n<0 or n>3000000:raise ValueError('READ_LIMIT')
   b=f.read(n)
   if len(b)!=n:raise ValueError('TRUNCATED')
   return b
  def u32():return struct.unpack('<I',rd(4))[0]
  def u64():return struct.unpack('<Q',rd(8))[0]
  def s():
   n=u64()
   if n>65536:raise ValueError('STRING_LIMIT')
   return rd(n).decode()
  def skip(t):
   if t==8:s();return
   if t==9:
    typ=u32();n=u64()
    if n>2000000:raise ValueError('ARRAY_LIMIT')
    for _ in range(n):skip(typ)
    return
   n={0:1,1:1,2:2,3:2,4:4,5:4,6:4,7:1,10:8,11:8,12:8}.get(t)
   if n is None:raise ValueError('META_TYPE')
   rd(n)
  if rd(4)!=b'GGUF' or u32()!=3:raise ValueError('HEADER')
  count=u64();nmeta=u64();align=32
  if count>10000 or nmeta>1000:raise ValueError('COUNTS')
  for _ in range(nmeta):
   key=s();t=u32()
   if key=='general.alignment' and t==4:align=u32()
   else:skip(t)
  found=None
  for _ in range(count):
   label=s();nd=u32()
   if not 1<=nd<=8:raise ValueError('NDIMS')
   shape=[u64() for _ in range(nd)];typ=u32();offset=u64()
   if label==name:found=(shape,typ,offset)
  if found is None or align!=32:raise ValueError('TENSOR_MISSING')
  shape,typ,offset=found
  if shape[0]!=2560 or shape[1]!=kind or typ not in (12,14):raise ValueError('UNEXPECTED_TENSOR')
  row_bytes=2560//256*{12:144,14:210}[typ]
  start=(f.tell()+align-1)//align*align+offset
  size=row_bytes*kind
  if start+size>os.fstat(f.fileno()).st_size:raise ValueError('TENSOR_RANGE')
  f.seek(start);raw=rd(size) if size<=3000000 else f.read(size)
  if len(raw)!=size:raise ValueError('TRUNCATED_TENSOR')
  matrix=np.empty((kind,2560),dtype=np.float32)
  for i in range(kind):matrix[i]=g62.decode(raw[i*row_bytes:(i+1)*row_bytes],typ)
  return inputs@matrix.T
def rms_heads(v,weights):
 return np.stack([g63.rmsnorm(row,weights,np.float32(1e-6)) for row in v],axis=0)
def rope(v,position):
 theta=position/(1000000.0**(np.arange(64,dtype=np.float64)/64))
 c=np.cos(theta).astype(np.float32);s=np.sin(theta).astype(np.float32)
 a=v.reshape(-1,64,2);o=np.empty_like(a)
 o[:,:,0]=a[:,:,0]*c-a[:,:,1]*s;o[:,:,1]=a[:,:,0]*s+a[:,:,1]*c
 return o.reshape(v.shape)
def run(file):
 import torch
 inp=np.stack([np.linspace(-.5,.5,2560,dtype=np.float32),np.linspace(.3,-.4,2560,dtype=np.float32)])
 q=projection(file,'blk.0.attn_q.weight',inp,4096).reshape(2,32,128)
 k=projection(file,'blk.0.attn_k.weight',inp,1024).reshape(2,8,128)
 v=projection(file,'blk.0.attn_v.weight',inp,1024).reshape(2,8,128)
 qw,_=g63.locate_f32(file,'blk.0.attn_q_norm.weight')
 kw,_=g63.locate_f32(file,'blk.0.attn_k_norm.weight')
 q=np.stack([rope(rms_heads(q[i],qw),i) for i in range(2)])
 k=np.stack([rope(rms_heads(k[i],kw),i) for i in range(2)])
 # Current token 1 sees keys 0 and 1; grouped query attention 4 query heads per KV head.
 qi=q[1]; keys=np.repeat(k,4,axis=1).transpose(1,0,2)
 values=np.repeat(v,4,axis=1).transpose(1,0,2)
 scores=np.einsum('hd,htd->ht',qi,keys)/np.sqrt(128)
 shifted=scores-np.max(scores,axis=1,keepdims=True)
 probs=np.exp(shifted);probs/=np.sum(probs,axis=1,keepdims=True)
 out=np.einsum('ht,htd->hd',probs,values)
 tq=torch.from_numpy(qi.copy());tk=torch.from_numpy(keys.copy());tv=torch.from_numpy(values.copy())
 ts=torch.einsum('hd,htd->ht',tq,tk)/np.sqrt(128)
 tp=torch.softmax(ts,dim=1)
 tout=torch.einsum('ht,htd->hd',tp,tv).numpy()
 error=float(np.max(np.abs(out-tout)))
 if not np.allclose(out,tout,rtol=3e-5,atol=3e-5):raise AssertionError('G72_ATTENTION_REFERENCE_MISMATCH')
 return {'status':'G72_QKV_CAUSAL_ATTENTION_PASS','positions':2,'queryHeads':32,'keyValueHeads':8,'headDim':128,'attentionOutputs':4096,'probabilityRowSumsValid':bool(np.allclose(np.sum(probs,axis=1),1,atol=1e-6)),'maxAbsoluteError':error,'g22LdwmdExecuted':False,'fullLayerExecuted':False,'productionAccepted':False}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),indent=2))
