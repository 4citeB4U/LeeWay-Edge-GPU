# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.REFERENCE
# TAG: LEEWAY.G97.INDEPENDENT_TOP20_RANKING
# 5WH: WHAT = Expand real independent Qwen3 second-token distribution comparison.
# WHY = Quantify original LeeWay's distance from oracle and reject unsupported parity claims.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g97-reference-top20.py
# WHEN = 2026-10-23
# HOW = Use the installed signed llama-server localhost completion probability API.
# LICENSE: MIT; AUTHORITY: Diagnostic only; no GPU/production certification.
import json,sys,urllib.request,math
url='http://127.0.0.1:19077/completion'
payload={'prompt':[151643,87],'n_predict':1,'temperature':0,'top_k':1,'n_probs':20,'stream':False,'cache_prompt':False}
req=urllib.request.Request(url,data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'},method='POST')
with urllib.request.urlopen(req,timeout=120) as resp:result=json.load(resp)
c=result['completion_probabilities'][0]
top=c['top_logprobs'];ids=[x['id'] for x in top]
ranking_valid=result['tokens_evaluated']==2 and len(top)==20 and ids[:3]==[970,13,198] and 63 not in ids
diff=top[0]['logprob']-top[2]['logprob']
print(json.dumps({'status':'G97_REFERENCE_TOP20_PASS' if ranking_valid else 'G97_REFERENCE_MISMATCH','promptTokenIds':payload['prompt'],'oracleGreedyId':c['id'],'originalLeeWayId':198,'originalLeeWayOracleRank':ids.index(198)+1 if 198 in ids else None,'neoxOnlyLeeWayId':63,'neoxOnlyInReferenceTop20':63 in ids,'oracleVsOriginalCandidateLogprobMargin':diff,'oracleVsOriginalCandidateProbabilityRatio':math.exp(diff),'top20Ids':ids,'tensorTraceCaptured':False,'multiTokenParity':False,'productionAccepted':False},indent=2))
if not ranking_valid:sys.exit(1)
