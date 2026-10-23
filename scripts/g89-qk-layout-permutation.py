# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G89.QK_LAYOUT_PERMUTATION
# 5WH: WHAT = Check Q/K tensor and q_norm/k_norm layout transformations together.
# WHY = Changing only RoPE layout can invalidate projections and head normalization.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g89-qk-layout-permutation.py
# WHEN = 2026-10-23
# HOW = Real GGUF first-layer projections; compare simultaneous basis change at position 17.
# LICENSE: MIT; AUTHORITY: Diagnostic only, not llama.cpp parity or production.
import os,sys,json,importlib.util,numpy as np
def load(name,f):
 s=importlib.util.spec_from_file_location(name,os.path.join(os.path.dirname(__file__),f))
 m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
g73=load('g73','g73-first-transformer-block.py')
g72=load('g72','g72-qkv-attention.py')
base,idx=g73.index_gguf(sys.argv[1])
W=lambda s:g73.weights(sys.argv[1],base,idx,'blk.0.'+s)
x=np.linspace(-0.5,0.5,2560,dtype=np.float32)
norm=g73.rms(x,W('attn_norm.weight'))
def reorder(z):
 return np.concatenate((z[...,0::2],z[...,1::2]),axis=-1)
def neox(z,pos):
 angle=pos/np.power(1e6,np.arange(64,dtype=np.float64)/64)
 c=np.cos(angle).astype('f4');s=np.sin(angle).astype('f4')
 return np.concatenate((z[...,:64]*c-z[...,64:]*s,z[...,:64]*s+z[...,64:]*c),axis=-1)
results={}
for kind,heads in [('q',32),('k',8)]:
 original=(norm@W('attn_'+kind+'.weight').T).reshape(heads,128)
 weights=W('attn_'+kind+'_norm.weight')
 adjacent=g72.rope(g73.rms(original,weights),17)
 transformed=neox(g73.rms(reorder(original),reorder(weights)),17)
 proper_error=float(np.max(np.abs(reorder(adjacent)-transformed)))
 naive=neox(g73.rms(original,weights),17)
 naive_error=float(np.max(np.abs(reorder(adjacent)-naive)))
 results[kind]={'correctBasisChangeError':proper_error,'naiveRoPESwapError':naive_error}
passed=all(r['correctBasisChangeError']<1e-5 and r['naiveRoPESwapError']>1e-3 for r in results.values())
print(json.dumps({'status':'G89_QK_BASIS_INVARIANCE_PASS' if passed else 'G89_FAIL','results':results,'ggufProjectionBasisProvenByReference':False,'multiTokenLlamaCppMatched':False,'productionAccepted':False},indent=2))
if not passed:sys.exit(1)
