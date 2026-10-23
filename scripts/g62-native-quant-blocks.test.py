# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QUANT.TEST
# TAG: LEEWAY.G62.Q4K_Q6K_REFERENCE_TEST
# 5WH:
# WHAT = Compare LeeWay quantized weight decoding to independent GGUF reference.
# WHY = Verify real Qwen3 weight semantics on exact file bytes.
# WHO = Creator-directed independent numerical comparison.
# WHERE = scripts/g62-native-quant-blocks.test.py
# WHEN = 2026-10-22
# HOW = Import separate reference library only in test; production decoder is independent.
# LICENSE: MIT
# AUTHORITY: Diagnostic only.
import os,sys,importlib.util,numpy as np,json
root=os.path.dirname(__file__)
sys.path.insert(0,root)
sp=importlib.util.spec_from_file_location('g62',os.path.join(root,'g62-native-quant-blocks.py'))
g62=importlib.util.module_from_spec(sp);sp.loader.exec_module(g62)
reference=os.environ.get('LEEWAY_GGUF_REFERENCE')
if not reference:raise RuntimeError('INDEPENDENT_REFERENCE_REQUIRED')
sys.path.insert(0,reference)
from gguf.quants import Q4_K,Q6_K
path=os.environ['LEEWAY_QWEN3_GGUF']
results=[]
with open(path,'rb') as f:
 for typ,name,offset,size,ref in [(12,'blk.0.attn_k.weight',320550400-1474560,144*8,Q4_K),(14,'blk.0.attn_v.weight',332358144,210*8,Q6_K)]:
  # Span offsets are GGUF tensor-directory relative offsets.
  if typ==12:offset=319075840
  f.seek(5956352+offset);raw=f.read(size)
  local=g62.decode(raw,typ)
  external=ref.dequantize_blocks(np.frombuffer(raw,dtype=np.uint8).reshape(-1,ref.type_size)).reshape(-1)
  diff=float(np.max(np.abs(local-external)))
  equal=np.array_equal(local,external)
  if not equal:raise AssertionError(f'{name} mismatch max error {diff}, first {local[:3]} vs {external[:3]}')
  results.append({'tensor':name,'type':typ,'decoded_values':local.size,'reference_exact_match':equal,'max_error':diff})
print(json.dumps({'status':'G62_PASS','results':results,'model_inference_executed':False},indent=2))
