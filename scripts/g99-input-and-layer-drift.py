# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G99.INPUT_AND_LAYER_DRIFT
# 5WH: WHAT = Verify exact token embeddings and numeric cached/batched layer differences.
# WHY = Separate internal numerical drift from the unresolved external llama.cpp mismatch.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g99-input-and-layer-drift.py
# WHEN = 2026-10-23
# HOW = Direct GGUF embeddings, 144 saved layer arrays and latest final hidden state.
# LICENSE: MIT; AUTHORITY: Read-only laboratory diagnostic; no external tensor oracle.
import os,sys,json,hashlib,numpy as np,importlib.util
root=os.path.dirname(__file__)
def load(name,file):
 s=importlib.util.spec_from_file_location(name,os.path.join(root,file));m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
g73=load('g73','g73-first-transformer-block.py')
g62=load('g62','g62-native-quant-blocks.py')
model,arraydir,latest=sys.argv[1:]
base,index=g73.index_gguf(model)
shape,typ,offset=index['token_embd.weight']
if shape!=[2560,151936] or typ!=14:raise ValueError('GGUF_EMBED_SHAPE')
embeddings=[]
with open(model,'rb') as f:
 for token in (151643,87):
  f.seek(base+offset+token*2100);raw=f.read(2100)
  if len(raw)!=2100:raise ValueError('EMBED_TRUNCATED')
  v=g62.decode(raw,14)
  if v.shape!=(2560,) or not np.isfinite(v).all():raise ValueError('INVALID_EMBEDDING')
  embeddings.append({'token':token,'sha256':hashlib.sha256(v.tobytes()).hexdigest(),'l2norm':float(np.linalg.norm(v))})
rows=[];missing=[]
for pos in range(2):
 for layer in range(36):
  paths=[os.path.join(arraydir,f'{kind}_p{pos}_l{layer}.bin') for kind in ('cached','batched')]
  if not all(os.path.isfile(p) for p in paths):missing.extend([p for p in paths if not os.path.isfile(p)]);continue
  a,b=[np.fromfile(path,dtype='<f4') for path in paths]
  if a.shape!=(2560,) or b.shape!=(2560,):raise ValueError('INVALID_LAYER_SHAPE')
  rows.append({'position':pos,'layer':layer,'maxAbsError':float(np.max(np.abs(a-b))),'rmsError':float(np.sqrt(np.mean((a.astype('f8')-b.astype('f8'))**2))),'allclose':bool(np.allclose(a,b,rtol=3e-4,atol=2e-3))})
latestvec=np.fromfile(latest,dtype='<f4')
prevpath=os.path.join(arraydir,'cached_p1_l35.bin')
prev=np.fromfile(prevpath,dtype='<f4') if os.path.isfile(prevpath) else np.array([])
last_error=float(np.max(np.abs(latestvec-prev))) if latestvec.shape==prev.shape==(2560,) else None
passed=not missing and len(rows)==72 and all(x['allclose'] for x in rows) and last_error is not None
print(json.dumps({'status':'G99_INTERNAL_REPRODUCIBILITY_PASS' if passed else 'G99_INTERNAL_REPRODUCIBILITY_FAIL','inputTokenIds':[151643,87],'embeddingFingerprints':embeddings,'layerPairsCompared':len(rows),'missingFiles':len(missing),'allWithinPriorTolerance':all(x['allclose'] for x in rows),'worstLayer':max(rows,key=lambda x:x['maxAbsError']) if rows else None,'latestFinalVsPriorCachedMaxAbsError':last_error,'externalLlamaCppIntermediateTensorsCompared':False,'multiTokenParity':False,'productionAccepted':False},indent=2))
if not passed:sys.exit(2)
