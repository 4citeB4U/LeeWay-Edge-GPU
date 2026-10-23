# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3
# TAG: LEEWAY.G65.REAL_QUANT_TILE_PREP
# 5WH:
# WHAT = Prepare one real quantized Qwen3 attention projection tile for G22.
# WHY = G30 supports bounded square input while Qwen3 uses rectangular projections.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g65-prepare-projection-tile.py
# WHEN = 2026-10-22
# HOW = Read exact first 256 output rows x 256 columns from Q4_K blocks, independent reference.
# LICENSE: MIT
# AUTHORITY: Diagnostic only; no production or native model inference approval.
import os,sys,importlib.util,numpy as np,json
root=os.path.dirname(__file__)
def load(name,filename):
 sp=importlib.util.spec_from_file_location(name,os.path.join(root,filename));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
g64=load('g64','g64-attention-projection.py');g62=load('g62','g62-native-quant-blocks.py')
raw,shape=g64.select_tensor(sys.argv[1],'blk.0.attn_k.weight')
assert shape==[2560,1024]
size=256;stride=2560//256*144
matrix=np.empty((size,size),dtype=np.float32)
for r in range(size):matrix[r]=g62.decode(raw[r*stride:r*stride+144],12)
x=np.linspace(-.5,.5,2560,dtype=np.float32)[:size].copy()
expected=matrix.astype(np.float64)@x.astype(np.float64)
expected=expected.astype(np.float32)
# Original G22 computes A (square weight rows) @ B, B first column is vector.
B=np.zeros((size,size),dtype=np.float32);B[:,0]=x
dir=sys.argv[2];os.makedirs(dir,exist_ok=True)
matrix.tofile(os.path.join(dir,'A.bin'));B.tofile(os.path.join(dir,'B.bin'));expected.tofile(os.path.join(dir,'expected.bin'))
print(json.dumps({'status':'G65_TILE_PREPARED','tensor':'blk.0.attn_k.weight','tile_shape':[256,256],'independent_expected_values':256,'model_inference_executed':False}))
