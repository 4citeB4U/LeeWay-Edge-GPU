# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.REFERENCE
# TAG: LEEWAY.G88.INDEPENDENT_TOPK_PROBABILITY_PROBE
# 5WH: WHAT = Query local llama.cpp top-k for two-token exact-ID prompt.
# WHY = Distinguish model prediction mismatch from absence of candidate in reference distribution.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g88-llamacpp-topk-reference.py
# WHEN = 2026-10-23
# HOW = Local completion endpoint with greedy decoding and top-logprob response.
# LICENSE: MIT; AUTHORITY: Reference diagnostic, not production certification.
import json,sys,urllib.request
url='http://127.0.0.1:19077/completion'
body={'prompt':[151643,87],'n_predict':1,'temperature':0,'top_k':1,'n_probs':8,'stream':False,'cache_prompt':False}
request=urllib.request.Request(url,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'},method='POST')
with urllib.request.urlopen(request,timeout=120) as response:result=json.load(response)
top=result['completion_probabilities'][0]['top_logprobs']
ids=[row['id'] for row in top]
passed=result['tokens_evaluated']==2 and result['completion_probabilities'][0]['id']==970 and ids[:3]==[970,13,198]
print(json.dumps({'status':'G88_REFERENCE_TOPK_PASS' if passed else 'G88_REFERENCE_TOPK_FAIL','tokens':[151643,87],'topCandidates':[{'id':r['id'],'logprob':r['logprob']} for r in top],'originalLeeWayId198Rank':ids.index(198)+1 if 198 in ids else None,'neoxLeeWayId63InTop8':63 in ids,'independentLogitsNotExported':True,'productionAccepted':False},indent=2))
if not passed:sys.exit(1)
