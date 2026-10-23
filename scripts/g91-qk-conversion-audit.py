# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.CONVERSION
# TAG: LEEWAY.G91.GGUF_QK_COORDINATE_CONTRACT
# 5WH: WHAT = Audit Q/K projection and normalization shapes and converter requirements.
# WHY = Avoid assuming a GGUF tensor needs re-permutation without conversion provenance.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g91-qk-conversion-audit.py
# WHEN = 2026-10-23
# HOW = Inspect exact GGUF tensor directory and model metadata, verify paired weight layout.
# LICENSE: MIT; AUTHORITY: Read-only lab verification, not inference acceptance.
import os,sys,json,importlib.util
root=os.path.dirname(__file__)
def load(name,src):
 spec=importlib.util.spec_from_file_location(name,os.path.join(root,src));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
g73=load('g73','g73-first-transformer-block.py')
g60=load('g60','g60-gguf-inspect.py')
path=sys.argv[1]
base,tensors=g73.index_gguf(path);inspection=g60.inspect(path)
expected={'attn_q.weight':[2560,4096],'attn_k.weight':[2560,1024],'attn_q_norm.weight':[128],'attn_k_norm.weight':[128]}
per_layer=[]
for l in range(36):
 row={}
 for suffix,shape in expected.items():
  name=f'blk.{l}.{suffix}'
  actual,typ,offset=tensors[name]
  if actual!=shape:raise ValueError(f'G91_SHAPE_MISMATCH_{name}:{actual}')
  row[suffix]=typ
 per_layer.append(row)
result={'status':'G91_QK_SHAPE_CONTRACT_PASS','modelSha256':inspection['sha256'],'layersVerified':len(per_layer),'tensorsVerified':len(expected)*len(per_layer),'firstLayerTypes':per_layer[0],'ggufStoresConversionFlag':any('rope_is_neox_style' in k for k in inspection['metadata']),'hfConverterPermutesWhenRopeIsNeoxFalse':True,'sourceConventionDeterminedFromGGUFAlone':False,'llamaCppIntermediateVerified':False,'secondTokenMismatchResolved':False,'productionAccepted':False}
print(json.dumps(result,indent=2))
