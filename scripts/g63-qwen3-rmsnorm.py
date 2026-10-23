# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
# TAG: LEEWAY.G63.REAL_WEIGHT_RMSNORM
# 5WH:
# WHAT = Read actual Qwen3 normalization weights and execute native RMSNorm.
# WHY = Begin actual transformer math using GGUF model weights.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g63-qwen3-rmsnorm.py
# WHEN = 2026-10-22
# HOW = Strict GGUF directory locator; NumPy mathematical implementation and independent Torch reference.
# LICENSE: MIT
# AUTHORITY: Diagnostic operator execution, not G22 or production inference.
import os,struct,math,sys,json,hashlib,numpy as np
def locate_f32(file,name):
 with open(file,'rb') as f:
  def rd(n):
   if n<0 or n>1048576:raise ValueError('BOUNDS')
   x=f.read(n)
   if len(x)!=n:raise ValueError('TRUNCATED')
   return x
  def u32():return struct.unpack('<I',rd(4))[0]
  def u64():return struct.unpack('<Q',rd(8))[0]
  def text():
   n=u64()
   if n>65536:raise ValueError('STRING_LIMIT')
   return rd(n).decode()
  def skip(t):
   if t==8:text();return
   if t==9:
    sub=u32();n=u64()
    if n>2000000:raise ValueError('ARRAY_LIMIT')
    for _ in range(n):skip(sub)
    return
   size={0:1,1:1,2:2,3:2,4:4,5:4,6:4,7:1,10:8,11:8,12:8}.get(t)
   if size is None:raise ValueError('META_TYPE')
   rd(size)
  if rd(4)!=b'GGUF' or u32()!=3:raise ValueError('INVALID_GGUF')
  count=u64();meta=u64()
  if count>200000 or meta>10000:raise ValueError('COUNTS')
  alignment=32
  for _ in range(meta):
   key=text();typ=u32()
   if key=='general.alignment' and typ==4:alignment=u32()
   else:skip(typ)
  found=None
  for _ in range(count):
   key=text();nd=u32()
   if nd<1 or nd>8:raise ValueError('DIMS')
   shape=[u64() for _ in range(nd)];typ=u32();off=u64()
   if key==name:
    if found is not None or typ!=0 or len(shape)!=1 or shape[0]>16384:raise ValueError('UNSUPPORTED_WEIGHT')
    found=(off,shape[0])
  if found is None:raise ValueError('TENSOR_MISSING')
  start=((f.tell()+alignment-1)//alignment)*alignment
  offset,length=found
  if start+offset+length*4>os.fstat(f.fileno()).st_size:raise ValueError('SPAN_INVALID')
  f.seek(start+offset)
  raw=rd(length*4)
  return np.frombuffer(raw,dtype='<f4').copy(),hashlib.sha256(raw).hexdigest()
def rmsnorm(x,weight,eps):
 if x.shape!=weight.shape or x.ndim!=1 or not np.isfinite(x).all() or not np.isfinite(weight).all() or eps<=0:raise ValueError('RMSNORM_INPUT')
 # Explicit float32 accumulation and final f32 output: reference chooses same precision.
 mean=np.mean(x*x,dtype=np.float32)
 return (x*np.float32(1/np.sqrt(np.float32(mean+eps)))*weight).astype(np.float32)
def run(path):
 import torch
 weight,sha=locate_f32(path,'blk.0.attn_norm.weight')
 x=np.linspace(-1,1,len(weight),dtype=np.float32)
 eps=1e-6
 actual=rmsnorm(x,weight,eps)
 tx=torch.from_numpy(x.copy());tw=torch.from_numpy(weight.copy())
 expected=(tx*torch.rsqrt(torch.mean(tx*tx)+eps)*tw).numpy()
 err=np.max(np.abs(actual-expected))
 if not np.allclose(actual,expected,rtol=2e-6,atol=2e-6):raise AssertionError('REFERENCE_MISMATCH')
 return {'status':'G63_RMSNORM_REAL_WEIGHTS_PASS','tensor':'blk.0.attn_norm.weight','elements':len(weight),'weightSha256':sha,'maxAbsoluteError':float(err),'outputFinite':bool(np.isfinite(actual).all()),'g22Executed':False,'fullLayerExecuted':False,'productionAccepted':False}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),indent=2))
