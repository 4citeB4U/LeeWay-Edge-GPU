# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.BLOCK
# TAG: LEEWAY.G73.FIRST_TRANSFORMER_BLOCK
# 5WH: WHAT = Run genuine first Qwen3 block on 2 synthetic embeddings.
# WHY = Prove full block math beyond individual attention projections.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g73-first-transformer-block.py
# WHEN = 2026-10-22
# HOW = Native GGUF dequant with NumPy, independent Torch operators.
# LICENSE: MIT; AUTHORITY: Diagnostic only; not G70 dispatch or production.
import os,sys,json,struct,importlib.util,hashlib,numpy as np
root=os.path.dirname(__file__)
def load(name,file):
 s=importlib.util.spec_from_file_location(name,os.path.join(root,file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
g62=load('g62','g62-native-quant-blocks.py')
g72=load('g72','g72-qkv-attention.py')
def index_gguf(filename):
 tensors={}
 with open(filename,'rb') as f:
  def rd(n):
   if n<0 or n>1000000:raise ValueError('BOUNDS')
   b=f.read(n)
   if len(b)!=n:raise ValueError('TRUNCATED')
   return b
  def u32():return struct.unpack('<I',rd(4))[0]
  def u64():return struct.unpack('<Q',rd(8))[0]
  def st():
   n=u64()
   if n>65536:raise ValueError('STRING_TOO_LONG')
   return rd(n).decode('utf8')
  def skip(t):
   if t==8:st();return
   if t==9:
    sub=u32();n=u64()
    if n>2000000:raise ValueError('ARRAY_TOO_LARGE')
    for _ in range(n):skip(sub)
    return
   n={0:1,1:1,2:2,3:2,4:4,5:4,6:4,7:1,10:8,11:8,12:8}.get(t)
   if n is None:raise ValueError('TYPE_UNSUPPORTED')
   rd(n)
  if rd(4)!=b'GGUF' or u32()!=3:raise ValueError('NOT_GGUF3')
  count=u64();metas=u64();align=32
  if count>200000 or metas>10000:raise ValueError('COUNTS')
  for _ in range(metas):
   key=st();typ=u32()
   if key=='general.alignment' and typ==4:align=u32()
   else:skip(typ)
  if align!=32:raise ValueError('ALIGNMENT_UNSUPPORTED')
  for _ in range(count):
   name=st();n=u32()
   if not 1<=n<=8 or name in tensors:raise ValueError('TENSOR_DIR')
   shape=[u64() for _ in range(n)];typ=u32();offset=u64()
   tensors[name]=(shape,typ,offset)
  base=(f.tell()+31)//32*32
  return base,tensors
def weights(filename,base,directory,name):
 shape,typ,offset=directory[name]
 if typ not in (0,12,14):raise ValueError('TYPE_'+name)
 count=int(np.prod(shape));block,byte={0:(1,4),12:(256,144),14:(256,210)}[typ]
 if count%block:raise ValueError('BLOCK_SIZE')
 size=count//block*byte
 with open(filename,'rb') as f:
  f.seek(base+offset);raw=f.read(size)
 if len(raw)!=size:raise ValueError('TRUNCATED_WEIGHT')
 values=np.frombuffer(raw,dtype='<f4').copy() if typ==0 else g62.decode(raw,typ)
 return values.reshape(tuple(reversed(shape)))
def rms(x,w):
 return x*np.reciprocal(np.sqrt(np.mean(x*x,axis=-1,keepdims=True)+np.float32(1e-6)))*w
def execute(filename):
 import torch
 base,directory=index_gguf(filename)
 W=lambda name:weights(filename,base,directory,'blk.0.'+name)
 x=np.stack([np.linspace(-.5,.5,2560,dtype=np.float32),np.linspace(.3,-.4,2560,dtype=np.float32)])
 residual=x.copy()
 attn_norm=W('attn_norm.weight')
 xnorm=rms(x,attn_norm)
 q=(xnorm@W('attn_q.weight').T).reshape(2,32,128)
 k=(xnorm@W('attn_k.weight').T).reshape(2,8,128)
 v=(xnorm@W('attn_v.weight').T).reshape(2,8,128)
 qnorm=W('attn_q_norm.weight');knorm=W('attn_k_norm.weight')
 q=np.stack([g72.rope(rms(q[i],qnorm),i) for i in range(2)])
 k=np.stack([g72.rope(rms(k[i],knorm),i) for i in range(2)])
 out=np.empty((2,32,128),dtype=np.float32)
 for t in range(2):
  qi=q[t];ks=np.repeat(k[:t+1],4,axis=1).transpose(1,0,2)
  vs=np.repeat(v[:t+1],4,axis=1).transpose(1,0,2)
  scores=np.einsum('hd,htd->ht',qi,ks)/np.sqrt(np.float32(128))
  scores-=scores.max(axis=1,keepdims=True)
  prob=np.exp(scores);prob/=prob.sum(axis=1,keepdims=True)
  out[t]=np.einsum('ht,htd->hd',prob,vs)
 attnout=out.reshape(2,4096)@W('attn_output.weight').T
 hidden=residual+attnout
 ff_norm=W('ffn_norm.weight'); h=rms(hidden,ff_norm)
 gate=h@W('ffn_gate.weight').T
 up=h@W('ffn_up.weight').T
 activated=(gate/(1+np.exp(-np.clip(gate,-80,80))))*up
 down=activated@W('ffn_down.weight').T
 final=hidden+down
 if os.environ.get('LEEWAY_BLOCK_COMPARE_DIR'): final.tofile(os.path.join(os.environ['LEEWAY_BLOCK_COMPARE_DIR'],'g73.bin'))
 # Independent PyTorch reference checks SwiGLU residual and normalization, all with same weights.
 th=torch.from_numpy(hidden.copy());tw=torch.from_numpy(ff_norm.copy())
 tr=th*torch.rsqrt(th.square().mean(-1,keepdim=True)+1e-6)*tw
 refgate=tr@torch.from_numpy(W('ffn_gate.weight').copy()).T
 refup=tr@torch.from_numpy(W('ffn_up.weight').copy()).T
 refdown=(torch.nn.functional.silu(refgate)*refup)@torch.from_numpy(W('ffn_down.weight').copy()).T
 refer=(th+refdown).numpy()
 error=float(np.max(np.abs(final-refer)))
 if not np.allclose(final,refer,rtol=3e-4,atol=2e-3):raise AssertionError('G73_FFN_REFERENCE_MISMATCH')
 return {'status':'G73_FIRST_BLOCK_NUMERICS_PASS','tokens':2,'firstLayer':0,'attentionOutputShape':list(attnout.shape),'ffnIntermediate':int(gate.shape[1]),'finalShape':list(final.shape),'maxFfnReferenceError':error,'outputSha256':hashlib.sha256(final.tobytes()).hexdigest(),'independentCompleteBlockReference':False,'g70LdwmdExecuted':False,'productionAccepted':False}
if __name__=='__main__':print(json.dumps(execute(sys.argv[1]),indent=2))
