# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.REFERENCE
# TAG: LEEWAY.G100.UPSTREAM_GRAPH_CALLBACK_CONTRACT
# 5WH: WHAT = Verify upstream Qwen3 graph callback names against code actually checked out.
# WHY = Prepare exact independent intermediate comparison without assuming debug API access.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g100-qwen3-graph-capture-contract.py
# WHEN = 2026-10-23
# HOW = Read-only checks of pinned llama.cpp C++ Qwen3 implementation and model fingerprint.
# LICENSE: MIT; AUTHORITY: Lab-only source audit; external tensor capture not claimed.
import json,sys,hashlib,pathlib,re,subprocess
src=pathlib.Path(sys.argv[1]);model=pathlib.Path(sys.argv[2])
code=(src/'src/models/qwen3.cpp').read_text(encoding='utf-8')
commit=subprocess.check_output(['git','-C',str(src),'rev-parse','HEAD'],text=True).strip()
expected='1ab09d632ebc30f171f58547a1110f8d6e9546c0'
callbacks=('attn_norm','Qcur_normed','Kcur_normed','Qcur','Kcur','Vcur','ffn_inp','ffn_norm')
found={name:bool(re.search(r'cb\([^;]*,\s*"'+re.escape(name)+r'"\s*,\s*il\)',code)) for name in callbacks}
with model.open('rb') as file:modelhash=hashlib.file_digest(file,'sha256').hexdigest()
valid=commit==expected and all(found.values()) and modelhash=='7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5'
print(json.dumps({'status':'G100_PINNED_GRAPH_CALLBACK_CONTRACT_PASS' if valid else 'G100_CONTRACT_FAIL','upstreamCommit':commit,'modelSha256':modelhash,'callbackNamesPresent':found,'qkNormalizationBeforeRoPE':code.index('cb(Qcur, "Qcur_normed"')<code.index('cb(Qcur, "Qcur"'),'externalIntermediateTensorValuesCaptured':False,'debuggerExecutionAuthorized':False,'productionAccepted':False},indent=2))
if not valid:sys.exit(2)
