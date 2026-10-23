# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.REFERENCE
# TAG: LEEWAY.G92.INDEPENDENT_DEBUG_CAPTURE_CONTRACT
# 5WH: WHAT = Check for supported llama.cpp tensor-debugger and record reference capabilities.
# WHY = Previous tests compared self-derived intermediate operators rather than external traces.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g92-reference-capture-contract.py
# WHEN = 2026-10-23
# HOW = Read-only checks of local tool availability and GGUF SHA256, fail closed on absence.
# LICENSE: MIT; AUTHORITY: Diagnostic only, not production admission.
import os,sys,json,hashlib,shutil,pathlib
model=pathlib.Path(sys.argv[1]);toolsdir=pathlib.Path(sys.argv[2])
names=('llama-debug.exe','llama-debug')
candidates=[str(toolsdir/n) for n in names if (toolsdir/n).is_file()]
onpath=shutil.which('llama-debug')
if onpath:candidates.append(onpath)
modelsha=hashlib.file_digest(open(model,'rb'),'sha256').hexdigest()
expected='7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5'
if modelsha!=expected:raise ValueError('G92_MODEL_SHA_MISMATCH')
ready=bool(candidates)
print(json.dumps({'status':'G92_DEBUG_TENSOR_CAPTURE_READY' if ready else 'G92_DEBUG_TENSOR_CAPTURE_UNAVAILABLE','modelSha256':modelsha,'debugExecutablesFound':candidates,'llamaServerPresent':(toolsdir/'llama-server.exe').is_file(),'upstreamLlamaDebugFlags':['--tensor-filter','--verbose','--save-logits'],'observedIntermediateTensors':False,'g78SecondTokenMatch':False,'productionAccepted':False},indent=2))
# Nonzero deliberately blocks any workflow claiming that reference tensors were captured.
if not ready:sys.exit(2)
