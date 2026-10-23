# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.WEIGHTS
# TAG: LEEWAY.G61.BOUNDED_GGUF_WEIGHT_READBACK
# 5WH:
# WHAT = Validate original GGUF tensor layout and read a bounded model weight block.
# WHY = Prove actual model-weight access without whole-file memory allocation.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = LeeWay-Edge-GPU/scripts/g61-gguf-weight-blocks.py
# WHEN = 2026-10-22
# HOW = GGUF v3 metadata traversal, 32-byte alignment, quantized block sizing and readback.
# LICENSE: MIT
# AUTHORITY: Diagnostic read only; not inference or production admission.
import sys,struct,math,hashlib,json,os
# GGML types used in the pinned Qwen3 Q4_K_M file: F32, Q4_K and Q6_K.
BLOCKS={0:(1,4),12:(256,144),14:(256,210)}
def inspect(filename):
 with open(filename,'rb') as f:
  size=os.fstat(f.fileno()).st_size
  def read(n):
   if n<0 or n>1048576:raise ValueError('READ_BOUNDS')
   b=f.read(n)
   if len(b)!=n:raise ValueError('TRUNCATED_GGUF')
   return b
  def u32():return struct.unpack('<I',read(4))[0]
  def u64():return struct.unpack('<Q',read(8))[0]
  def string():
   n=u64()
   if n>65536:raise ValueError('STRING_LIMIT')
   return read(n).decode('utf8')
  def skip(t):
   if t==8:string();return
   if t==9:
    inner=u32();count=u64()
    if count>2000000:raise ValueError('ARRAY_LIMIT')
    for _ in range(count):skip(inner)
    return
   n={0:1,1:1,2:2,3:2,4:4,5:4,6:4,7:1,10:8,11:8,12:8}.get(t)
   if n is None:raise ValueError('UNKNOWN_METADATA_TYPE')
   read(n)
  if read(4)!=b'GGUF' or u32()!=3:raise ValueError('INVALID_GGUF_HEADER')
  n_tensors=u64();n_meta=u64()
  if n_tensors>200000 or n_meta>10000:raise ValueError('INVALID_COUNTS')
  alignment=32
  for _ in range(n_meta):
   key=string();typ=u32()
   if key=='general.alignment' and typ==4:alignment=u32()
   else:skip(typ)
  if alignment<1 or alignment>4096 or alignment&(alignment-1):raise ValueError('INVALID_ALIGNMENT')
  tensors=[]
  for _ in range(n_tensors):
   name=string();dims=u32()
   if dims<1 or dims>8:raise ValueError('INVALID_DIMS')
   shape=[u64() for _ in range(dims)]
   typ=u32();offset=u64()
   if typ not in BLOCKS:raise ValueError('UNSUPPORTED_GGML_TYPE_'+str(typ))
   elements=math.prod(shape)
   block,bytes_per=BLOCKS[typ]
   if elements<=0 or elements%block:raise ValueError('QUANT_BLOCK_SHAPE_INVALID_'+name)
   nbytes=elements//block*bytes_per
   tensors.append((name,shape,typ,offset,nbytes))
  start=(f.tell()+alignment-1)//alignment*alignment
  spans=sorted([(start+offset,start+offset+nbytes,name) for name,_,_,offset,nbytes in tensors])
  for i,(begin,end,name) in enumerate(spans):
   if begin%alignment or end>size or (i and begin<spans[i-1][1]):raise ValueError('TENSOR_SPAN_INVALID_'+name)
  chosen=next((row for row in tensors if row[0]=='output_norm.weight'),None)
  if not chosen or chosen[2]!=0 or chosen[4]>65536:raise ValueError('EXPECTED_F32_TENSOR_ABSENT')
  name,shape,typ,offset,nbytes=chosen
  f.seek(start+offset)
  weight=read(nbytes)
  values=struct.unpack('<'+'f'*(nbytes//4),weight)
  if not all(math.isfinite(v) for v in values):raise ValueError('WEIGHT_NONFINITE')
  return {'status':'G61_WEIGHT_LAYOUT_AND_F32_READBACK_PASS','tensors':n_tensors,'alignment':alignment,'data_start':start,'file_bytes':size,'supported_tensor_types':sorted(set(x[2] for x in tensors)),'quantized_spans_validated':sum(x[2]!=0 for x in tensors),'read_tensor':name,'read_elements':len(values),'read_sha256':hashlib.sha256(weight).hexdigest(),'first_values':[round(x,6) for x in values[:6]],'quantized_decompression_executed':False,'inference_executed':False,'production_accepted':False}
if __name__=='__main__':
 try:print(json.dumps(inspect(sys.argv[1]),indent=2))
 except Exception as exc:print(json.dumps({'status':'BLOCKED','reason':str(exc)}));sys.exit(1)
