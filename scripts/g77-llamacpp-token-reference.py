# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G77.INDEPENDENT_TOKEN_ORACLE
# 5WH: WHAT = Cross-check G76 single-token result against separate local llama.cpp.
# WHY = Independently verify first real-weight 36-layer token prediction.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g77-llamacpp-token-reference.py
# WHEN = 2026-10-22
# HOW = Local loopback llama-server completion, tokenize and detokenize endpoints.
# LICENSE: MIT
# AUTHORITY: Diagnostic only; reference engine not a LeeWay compute provider.
import json,urllib.request,sys
base=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:19077'
if base not in ('http://127.0.0.1:19077','http://localhost:19077'):raise ValueError('G77_LOOPBACK_ONLY')
def post(path,body):
 req=urllib.request.Request(base+path,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'},method='POST')
 with urllib.request.urlopen(req,timeout=120) as resp:return json.load(resp)
result=post('/completion',{'prompt':[151643],'n_predict':1,'temperature':0,'top_k':1,'stream':False,'cache_prompt':False})
token_text=result['content']
reencoded=post('/tokenize',{'content':token_text,'add_special':False})['tokens']
decoded=post('/detokenize',{'tokens':[87]})['content']
ok=token_text=='x' and reencoded==[87] and decoded=='x' and result.get('tokens_evaluated')==1 and result.get('tokens_predicted')==1
report={'status':'G77_MATCH' if ok else 'G77_MISMATCH','exactGgufFileRequiredAtServerLaunch':True,'inputTokenId':151643,'independentText':token_text,'reencodedTokens':reencoded,'g76PredictedTokenId':87,'independentDecodedToken87':decoded,'tokensEvaluated':result.get('tokens_evaluated'),'productionAccepted':False,'multiplePromptsVerified':False}
print(json.dumps(report,indent=2))
if not ok:sys.exit(1)
