# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G74.FULL_BLOCK_COMPARATOR
# 5WH: WHAT = Compare LeeWay G73 and independent G74 output element by element.
# WHY = Numerical equivalence cannot be inferred from differing SHA256 values.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g74-compare-blocks.py
# WHEN = 2026-10-22
# HOW = Run both implementations in isolated temp dir on the exact GGUF.
# LICENSE: MIT; AUTHORITY: Lab test only.
import os,sys,tempfile,subprocess,json,numpy as np
root=os.path.dirname(__file__)
def execute():
 with tempfile.TemporaryDirectory(prefix='leeway-g74-') as directory:
  env={**os.environ,'LEEWAY_BLOCK_COMPARE_DIR':directory}
  for name in ('g73-first-transformer-block.py','g74-independent-full-block.py'):
   subprocess.run([sys.executable,'-B',os.path.join(root,name),sys.argv[1]],env=env,check=True,capture_output=True,text=True)
  a=np.fromfile(os.path.join(directory,'g73.bin'),dtype='<f4')
  b=np.fromfile(os.path.join(directory,'g74.bin'),dtype='<f4')
  if a.size!=5120 or b.size!=5120 or not np.isfinite(a).all() or not np.isfinite(b).all():raise ValueError('G74_DATA_INVALID')
  diff=np.abs(a-b);passed=bool(np.allclose(a,b,rtol=3e-4,atol=2e-3))
  outcome={'status':'G74_FULL_BLOCK_COMPARISON_PASS' if passed else 'G74_FAIL','valuesCompared':int(a.size),'maximumAbsoluteError':float(np.max(diff)),'meanAbsoluteError':float(np.mean(diff)),'numericTolerancePass':passed,'fullModelInference':False,'productionAccepted':False}
  print(json.dumps(outcome,indent=2))
  if not passed:sys.exit(1)
if __name__=='__main__':execute()
