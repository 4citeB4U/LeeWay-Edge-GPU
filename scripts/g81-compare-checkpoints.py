# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G81.INCREMENTAL_BATCH_CHECKPOINT_COMPARISON
# 5WH: WHAT = Record SHA equality of two-position cached and batched Qwen3 layer outputs.
# WHY = Detect mismatches without wrongly equating SHA inequality with numerical failure.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g81-compare-checkpoints.py
# WHEN = 2026-10-23
# HOW = Compare 72 grounded local layer checkpoint records.
# LICENSE: MIT; AUTHORITY: Diagnostic only; no numerical equivalence established.
import sys,json
cached=[json.loads(line) for line in open(sys.argv[1],encoding='utf8') if line.strip()]
batched=json.load(open(sys.argv[2],encoding='utf-8-sig'))['checkpoints']
assert len(cached)==72 and len(batched)==36
unequal=[{'position':x['position'],'layer':x['layer']} for x in cached if x['sha256']!=batched[x['layer']]['pos'+str(x['position'])]]
report={'status':'G81_BITWISE_DIFFERENCE_DETECTED' if unequal else 'G81_BITWISE_IDENTICAL','checkpoints':72,'mismatches':len(unequal),'firstMismatch':unequal[0] if unequal else None,'numericErrorMeasured':False,'llamaCppMismatchResolved':False,'productionAccepted':False}
print(json.dumps(report,indent=2))
