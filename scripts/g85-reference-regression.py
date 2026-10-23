# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G85.NEOX_TWO_POSITION_REFERENCE
# 5WH: WHAT = Ensure NeoX G85 remains unqualified when reference output differs.
# WHY = Local computation completing is not proof of correct next-token inference.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g85-reference-regression.py
# WHEN = 2026-10-23
# HOW = Check recorded same-GGUF greedy token results against independent llama.cpp.
# LICENSE: MIT; AUTHORITY: Lab diagnostic only.
import json,sys
records=[{'tokens':[151643],'leeway':87,'llamaCpp':87},{'tokens':[151643,87],'leeway':63,'llamaCpp':970}]
valid=all(x['leeway']==x['llamaCpp'] for x in records)
print(json.dumps({'status':'G85_REFERENCE_PASS' if valid else 'G85_REFERENCE_MISMATCH','observations':records,'neoxOperatorUnitTestPassed':True,'productionAccepted':False},indent=2))
if not valid:sys.exit(1)
