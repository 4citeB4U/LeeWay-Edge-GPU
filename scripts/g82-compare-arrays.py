# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G82.NUMERICAL_LAYER_COMPARISON
# 5WH: WHAT = Compare 72 paired cached/batched per-layer arrays numerically.
# WHY = G81 hash differences cannot distinguish floating noise from model defects.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g82-compare-arrays.py
# WHEN = 2026-10-23
# HOW = Exact float32 files; max, mean and relative error with tolerance checks.
# LICENSE: MIT; AUTHORITY: Diagnostic only, not llama.cpp equivalence or production.
import os,sys,json,numpy as np
directory=sys.argv[1];results=[]
for position in range(2):
 for layer in range(36):
  cached=np.fromfile(os.path.join(directory,f'cached_p{position}_l{layer}.bin'),dtype='<f4')
  batched=np.fromfile(os.path.join(directory,f'batched_p{position}_l{layer}.bin'),dtype='<f4')
  if cached.size!=2560 or batched.size!=2560 or not np.isfinite(cached).all() or not np.isfinite(batched).all():raise ValueError('G82_BAD_ARRAY')
  delta=np.abs(cached.astype(np.float64)-batched.astype(np.float64))
  maxerr=float(delta.max());meanerr=float(delta.mean());rel=float(np.max(delta/np.maximum(np.abs(batched),1e-5)))
  passed=bool(np.allclose(cached,batched,rtol=3e-4,atol=2e-3))
  results.append({'position':position,'layer':layer,'maxAbsoluteError':maxerr,'meanAbsoluteError':meanerr,'maxScaledRelativeError':rel,'withinTolerance':passed})
fails=[r for r in results if not r['withinTolerance']]
print(json.dumps({'status':'G82_NUMERIC_COMPARISON_PASS' if not fails else 'G82_NUMERIC_DIVERGENCE','comparisons':len(results),'toleranceFailures':len(fails),'firstToleranceFailure':fails[0] if fails else None,'maxAbsoluteErrorAcrossAll':max(x['maxAbsoluteError'] for x in results),'positionOneFirstAndLast':[results[36],results[-1]],'llamaCppReferenceCompared':False,'productionAccepted':False},indent=2))
if fails:sys.exit(1)
