# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.GGUF
# TAG: LEEWAY.G60.READ_ONLY_GGUF_V3_INSPECTOR
# 5WH:
# WHAT = Read bounded GGUF v3 metadata and real tensor directory without loading all weights.
# WHY = Establish the architecture and exact tensor names for native LeeWay inference.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = LeeWay-Edge-GPU/scripts/g60-gguf-inspect.py
# WHEN = 2026-10-22
# HOW = Strict binary parsing and SHA-256 content pin, no execution or model mutation.
# LICENSE: MIT
# AUTHORITY: Read-only diagnostic; never confers inference or production admission.
import json,struct,sys,hashlib,collections,os
TYPE_SIZES={0:1,1:1,2:2,3:2,4:4,5:4,6:4,7:1,10:8,11:8,12:8}
def inspect(filename):
 with open(filename,'rb') as f:
  def raw(n):
   if not 0<=n<=256*1024*1024: raise ValueError('GGUF_READ_LIMIT')
   b=f.read(n)
   if len(b)!=n: raise ValueError('GGUF_TRUNCATED')
   return b
  def u32():return struct.unpack('<I',raw(4))[0]
  def u64():return struct.unpack('<Q',raw(8))[0]
  def s():
   n=u64()
   if n>65536:raise ValueError('GGUF_STRING_LIMIT')
   return raw(n).decode('utf-8')
  def val(t):
   if t==8:return s()
   if t==9:
    sub=u32();n=u64()
    if n>1000000:raise ValueError('GGUF_ARRAY_LIMIT')
    a=[val(sub) for _ in range(n)]
    return a if n<=40 else {'array_type':sub,'count':n,'sample':a[:5]}
   fmt={0:'B',1:'b',2:'H',3:'h',4:'I',5:'i',6:'f',7:'?',10:'Q',11:'q',12:'d'}.get(t)
   if fmt is None:raise ValueError('GGUF_UNKNOWN_META_TYPE_'+str(t))
   return struct.unpack('<'+fmt,raw(TYPE_SIZES[t]))[0]
  if raw(4)!=b'GGUF':raise ValueError('NOT_GGUF')
  version=u32()
  if version!=3:raise ValueError('GGUF_VERSION_NOT_SUPPORTED')
  tensors=u64();metas=u64()
  if tensors>200000 or metas>10000:raise ValueError('GGUF_COUNT_LIMIT')
  metadata={}
  for _ in range(metas):
   key=s();t=u32()
   if key in metadata:raise ValueError('GGUF_DUPLICATE_METADATA')
   metadata[key]=val(t)
  tensor_dir=[];counts=collections.Counter()
  for _ in range(tensors):
   name=s();nd=u32()
   if nd>8:raise ValueError('GGUF_DIMENSION_LIMIT')
   shape=[u64() for _ in range(nd)]
   dtype=u32();offset=u64()
   counts[str(dtype)]+=1
   tensor_dir.append({'name':name,'shape':shape,'type':dtype,'offset':offset})
  keys={k:v for k,v in metadata.items() if not isinstance(v,dict) and ('tokenizer.ggml.tokens' not in k and 'tokenizer.ggml.scores' not in k and 'tokenizer.ggml.token_type' not in k)}
  f.seek(0)
  digest=hashlib.file_digest(f,'sha256').hexdigest()
  return {'status':'GGUF_V3_DIRECTORY_PARSED','file_bytes':os.path.getsize(filename),'sha256':digest,'tensor_count':tensors,'metadata_count':metas,'metadata':keys,'tensor_type_counts':dict(counts),'tensor_examples':tensor_dir[:18],'last_tensor':tensor_dir[-1] if tensor_dir else None,'model_executed':False,'production_admitted':False}
if __name__=='__main__':
 try:print(json.dumps(inspect(sys.argv[1]),indent=2))
 except Exception as e:print(json.dumps({'status':'BLOCKED','reason':str(e)}));sys.exit(1)
