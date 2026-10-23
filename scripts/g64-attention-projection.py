# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
# TAG: LEEWAY.G64.REAL_QWEN3_QUANTIZED_PROJECTION
# 5WH:
# WHAT = Compute one genuine Qwen3 attention key projection from GGUF Q4_K weights.
# WHY = Prove model math on real quantized weights against an independent GGUF decoder.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g64-attention-projection.py
# WHEN = 2026-10-22
# HOW = Strict GGUF directory parse, bounded per-output-row dequant, NumPy matvec.
# LICENSE: MIT
# AUTHORITY: Diagnostic only; not G22/LDWMD or full Qwen3 inference.
import os,sys,struct,importlib.util,json,hashlib,numpy as np
sp=importlib.util.spec_from_file_location('leequant',os.path.join(os.path.dirname(__file__),'g62-native-quant-blocks.py'))
leequant=importlib.util.module_from_spec(sp);sp.loader.exec_module(leequant)
def select_tensor(file,name):
 with open(file,'rb') as f:
  def rd(n):
   if n<0 or n>2000000:raise ValueError('GGUF_READ_LIMIT')
   b=f.read(n)
   if len(b)!=n:raise ValueError('GGUF_TRUNCATED')
   return b
  def u32():return struct.unpack('<I',rd(4))[0]
  def u64():return struct.unpack('<Q',rd(8))[0]
  def s():
   n=u64()
   if n>65536:raise ValueError('GGUF_STRING_LIMIT')
   return rd(n).decode()
  def skip(t):
   if t==8:s();return
   if t==9:
    sub=u32();n=u64()
    if n>2000000:raise ValueError('GGUF_ARRAY_LIMIT')
    for _ in range(n):skip(sub)
    return
   n={0:1,1:1,2:2,3:2,4:4,5:4,6:4,7:1,10:8,11:8,12:8}.get(t)
   if n is None:raise ValueError('GGUF_TYPE_UNKNOWN')
   rd(n)
  if rd(4)!=b'GGUF' or u32()!=3:raise ValueError('GGUF_HEADER_INVALID')
  num=u64();meta=u64()
  if num>200000 or meta>10000:raise ValueError('GGUF_COUNTS_INVALID')
  align=32
  for _ in range(meta):
   key=s();typ=u32()
   if key=='general.alignment' and typ==4:align=u32()
   else:skip(typ)
  found=None
  for _ in range(num):
   label=s();dims=u32()
   if not 1<=dims<=8:raise ValueError('GGUF_DIMS_INVALID')
   shape=[u64() for _ in range(dims)];typ=u32();offset=u64()
   if label==name:
    if found is not None:raise ValueError('GGUF_DUPLICATE_TENSOR')
    found=(shape,typ,offset)
  if found is None or align<1 or align>4096 or align&(align-1):raise ValueError('GGUF_TENSOR_OR_ALIGNMENT_INVALID')
  start=(f.tell()+align-1)//align*align
  shape,typ,offset=found
  if typ!=12 or shape!=[2560,1024]:raise ValueError('UNEXPECTED_QWEN3_ATTENTION_K_SHAPE')
  nblocks=shape[0]*shape[1]//256
  length=nblocks*144
  if start+offset+length>os.fstat(f.fileno()).st_size:raise ValueError('GGUF_TENSOR_OUT_OF_BOUNDS')
  f.seek(start+offset);raw=f.read(length)
  if len(raw)!=length:raise ValueError('GGUF_TENSOR_TRUNCATED')
  return raw,shape
def run(file):
 raw,shape=select_tensor(file,'blk.0.attn_k.weight')
 # GGUF tensor shape is [input_dim, output_dim], serialized output rows.
 input_dim,output_dim=shape
 x=np.linspace(-0.5,0.5,input_dim,dtype=np.float32)
 # Each output row contains input_dim weights. Read/dequantize bounded rows.
 row_bytes=input_dim//256*144
 native=np.empty(output_dim,dtype=np.float32)
 for i in range(output_dim):
  w=leequant.decode(raw[i*row_bytes:(i+1)*row_bytes],12)
  native[i]=np.dot(w,x)
 reference_root=os.environ.get('LEEWAY_GGUF_REFERENCE')
 if not reference_root:raise ValueError('INDEPENDENT_REFERENCE_REQUIRED')
 sys.path.insert(0,reference_root)
 from gguf.quants import Q4_K
 independent=np.empty(output_dim,dtype=np.float32)
 for i in range(output_dim):
  block=np.frombuffer(raw[i*row_bytes:(i+1)*row_bytes],dtype=np.uint8).reshape(-1,Q4_K.type_size)
  w=Q4_K.dequantize_blocks(block).reshape(-1)
  independent[i]=np.dot(w,x)
 max_error=float(np.max(np.abs(native-independent)))
 if not np.array_equal(native,independent):raise AssertionError('G64_INDEPENDENT_PROJECTION_MISMATCH')
 return {'status':'G64_REAL_QUANTIZED_ATTENTION_PROJECTION_PASS','tensor':'blk.0.attn_k.weight','shape_gguf':shape,'output_elements':output_dim,'quantized_bytes':len(raw),'max_absolute_error':max_error,'digest':hashlib.sha256(native.tobytes()).hexdigest(),'g22_executed':False,'full_attention_executed':False,'production_accepted':False}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),indent=2))
