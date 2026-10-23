# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G98.ORIGINAL_VS_REFERENCE_CANDIDATES
# 5WH: WHAT = Measure original LeeWay logits for 20 llama.cpp reference candidates.
# WHY = Distinguish ranking disagreement from a near-tie, without claiming full distribution parity.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g98-candidate-distribution-audit.py
# WHEN = 2026-10-23
# HOW = Read captured original hidden state, independently decode GGUF embedding rows and compare rankings.
# LICENSE: MIT; AUTHORITY: Lab-only reference analysis, not production inference.
import json,sys,os,numpy as np,importlib.util
root=os.path.dirname(__file__)
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,os.path.join(root,file));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
g73=load('g73','g73-first-transformer-block.py')
g62=load('g62','g62-native-quant-blocks.py')
model,hiddenfile=sys.argv[1:]
hidden=np.fromfile(hiddenfile,dtype='<f4')
if hidden.size!=2560:raise ValueError('INVALID_G98_HIDDEN')
base,idx=g73.index_gguf(model)
final=g73.rms(hidden.reshape(1,2560),g73.weights(model,base,idx,'output_norm.weight'))[0]
ids=[970,13,198,812,491,60032,65301,4102,1134,64684,42665,19049,3279,32266,10181,487,359,35279,1325,48586]
ref=[-4.757956504821777,-4.849603652954102,-5.103039741516113,-5.218339920043945,-5.331391334533691,-5.544569969177246,-5.545718193054199,-5.600929260253906,-5.61570930480957,-5.666282653808594,-5.723672866821289,-5.735369682312012,-5.743683815002441,-5.767927169799805,-5.772672653198242,-5.793859481811523,-5.807888031005859,-5.952662467956543,-5.962585926055908,-5.9814863204956055]
shp,typ,offset=idx['token_embd.weight']
assert shp==[2560,151936] and typ==14
scores={}
with open(model,'rb') as f:
 for token in ids:
  f.seek(base+offset+token*2100)
  scores[token]=float(np.dot(g62.decode(f.read(2100),14),final))
local_rank=sorted(ids,key=lambda t:scores[t],reverse=True)
delta={str(t):round(scores[t]-scores[970],6) for t in ids}
refdelta={str(t):round(ref[i]-ref[0],6) for i,t in enumerate(ids)}
print(json.dumps({'status':'G98_CANDIDATE_LOGITS_CAPTURED','prompt':[151643,87],'candidateCount':len(ids),'referenceTopIds':ids,'leewayOriginalCandidateRanking':local_rank,'leewayOriginalCandidateLogitMarginVs970':delta,'referenceLogProbabilityMarginVs970':refdelta,'referenceTopId970RankAmongTested':local_rank.index(970)+1,'observedFullDistribution':False,'productionAccepted':False},indent=2))
