# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G78.CAUSAL_REFERENCE_REGRESSION
# 5WH: WHAT = Refuse to qualify unmatched incremental KV next-token predictions.
# WHY = G78 local two-token result disagreed with same-file llama.cpp reference.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g78-reference-regression.py
# WHEN = 2026-10-22
# HOW = Record exact input IDs and both observed greedy predictions; test must fail on mismatch.
# LICENSE: MIT; AUTHORITY: Diagnostic evidence, not production authorization.
import json,sys
observations=[
 {'promptTokenIds':[151643],'leewayNextId':87,'llamaCppNextId':87},
 {'promptTokenIds':[151643,87],'leewayNextId':198,'llamaCppNextId':970}
]
passed=all(row['leewayNextId']==row['llamaCppNextId'] for row in observations)
print(json.dumps({'status':'G78_REFERENCE_MATCH' if passed else 'G78_MULTI_POSITION_REFERENCE_MISMATCH','observations':observations,'comparisonSource':'local same-file llama.cpp CPU, greedy, manually observed 2026-10-22','productionAccepted':False},indent=2))
if not passed:sys.exit(1)
