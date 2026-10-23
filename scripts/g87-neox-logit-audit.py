# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.DIAGNOSTIC
# TAG: LEEWAY.G87.COMPETING_TOKEN_LOGIT_AUDIT
# 5WH: WHAT = Compare Qwen3 predicted and reference token logits for a two-token prompt.
# WHY = Quantify how far the independently observed llama.cpp choice is from LeeWay's.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g87-neox-logit-audit.py
# WHEN = 2026-10-23
# HOW = Run real layer stack in G85, independently dot candidate GGUF output rows.
# LICENSE: MIT; AUTHORITY: Diagnostic only, not production admission.
import os,sys,json,subprocess,tempfile,numpy as np,importlib.util
root=os.path.dirname(__file__)
def readmod(name,path):
 sp=importlib.util.spec_from_file_location(name,os.path.join(root,path))
 m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
g73=readmod('g73','g73-first-transformer-block.py')
g62=readmod('g62','g62-native-quant-blocks.py')
def main(file):
 with tempfile.TemporaryDirectory(prefix='leeway-g87-') as tmp:
  env={**os.environ,'LEEWAY_G87_HIDDEN_PATH':os.path.join(tmp,'last_hidden.bin')}
  proc=subprocess.run([sys.executable,'-B',os.path.join(root,'g85-neox-kv-experiment.py'),file],env=env,capture_output=True,text=True,check=True)
  hidden=np.fromfile(env['LEEWAY_G87_HIDDEN_PATH'],dtype='<f4')
  if hidden.size!=2560:raise ValueError('G87_HIDDEN_MISSING')
  base,idx=g73.index_gguf(file)
  final=g73.rms(hidden.reshape(1,2560),g73.weights(file,base,idx,'output_norm.weight'))[0]
  shp,typ,offset=idx['token_embd.weight']
  assert shp==[2560,151936] and typ==14
  scores={}
  with open(file,'rb') as f:
   for token in (63,198,970):
    f.seek(base+offset+token*2100)
    weight=g62.decode(f.read(2100),14)
    scores[str(token)]=float(np.dot(weight,final))
  print(json.dumps({'status':'G87_CANDIDATE_LOGITS_MEASURED','input':[151643,87],'candidateLogits':scores,'llamaCppReferenceToken':970,'neoxLeeWayToken':63,'referenceLogitGapVsLeeWayTop':scores['63']-scores['970'],'modelOutputAgreement':False,'productionAccepted':False},indent=2))
if __name__=='__main__':main(sys.argv[1])
