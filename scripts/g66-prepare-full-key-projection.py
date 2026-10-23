# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
# TAG: LEEWAY.G66.FULL_ATTENTION_KEY_PROJECTION_PREP
# 5WH: WHAT = Prepare all real Qwen3 key projection tiles; WHY = G22/G30 square bound;
# WHO = Creator-directed diagnostic engineering; WHERE = scripts/g66-prepare-full-key-projection.py;
# WHEN = 2026-10-22; HOW = Real GGUF Q4_K blocks and independent GGUF dequant reference.
# LICENSE: MIT; AUTHORITY: Diagnostic only, no inference production admission.
import os,sys,json,importlib.util,numpy as np,hashlib
root=os.path.dirname(__file__)
def module(name,filename):
 spec=importlib.util.spec_from_file_location(name,os.path.join(root,filename));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
g64=module('g64','g64-attention-projection.py');g62=module('g62','g62-native-quant-blocks.py')
reference_root=os.environ['LEEWAY_GGUF_REFERENCE'];sys.path.insert(0,reference_root)
from gguf.quants import Q4_K
raw,shape=g64.select_tensor(sys.argv[1],'blk.0.attn_k.weight')
assert shape==[2560,1024]
dest=sys.argv[2];os.makedirs(dest,exist_ok=True)
N=256;K=2560;O=1024;stride=K//256*144
x=np.linspace(-0.5,0.5,K,dtype=np.float32)
expected=np.zeros(O,dtype=np.float32)
manifest=[]
for out_base in range(0,O,N):
 for k_base in range(0,K,N):
  A=np.empty((N,N),dtype=np.float32);reference=np.empty((N,N),dtype=np.float32)
  for i in range(N):
   b=raw[(out_base+i)*stride+k_base//256*144:(out_base+i)*stride+(k_base//256+1)*144]
   A[i]=g62.decode(b,12)
   reference[i]=Q4_K.dequantize_blocks(np.frombuffer(b,dtype=np.uint8).reshape(1,Q4_K.type_size)).reshape(-1)
  if not np.array_equal(A,reference):raise ValueError('G66_DEQUANT_REFERENCE_MISMATCH')
  B=np.zeros((N,N),dtype=np.float32);B[:,0]=x[k_base:k_base+N]
  # Float64 reference accumulation for the reduction, then float32 cast.
  values=(reference.astype(np.float64)@x[k_base:k_base+N].astype(np.float64)).astype(np.float32)
  # Sum partial outputs in float64 to avoid extra rounding in merged output.
  if k_base==0:total=np.zeros(N,dtype=np.float64)
  total+=values.astype(np.float64)
  stem=f'o{out_base:04d}_k{k_base:04d}'
  A.tofile(os.path.join(dest,stem+'.A.bin'));B.tofile(os.path.join(dest,stem+'.B.bin'))
  manifest.append({'stem':stem,'outBase':out_base,'kBase':k_base})
 expected[out_base:out_base+N]=total.astype(np.float32)
expected.tofile(os.path.join(dest,'expected.bin'))
with open(os.path.join(dest,'manifest.json'),'w') as f:json.dump({'shape':shape,'tiles':manifest,'expectedSha256':hashlib.sha256(expected.tobytes()).hexdigest()},f)
print(json.dumps({'status':'G66_FULL_PROJECTION_PREPARED','tiles':len(manifest),'outputs':len(expected),'expectedSha256':hashlib.sha256(expected.tobytes()).hexdigest()}))
