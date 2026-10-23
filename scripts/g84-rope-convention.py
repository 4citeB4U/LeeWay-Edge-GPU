# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.ROPE
# TAG: LEEWAY.G84.QWEN3_NEOX_ROPE_CONVENTION
# 5WH: WHAT = Verify correct Qwen3 NeoX half-split rotary convention.
# WHY = Identify disagreement between prior consecutive-pair implementation and llama.cpp.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g84-rope-convention.py
# WHEN = 2026-10-23
# HOW = Independent Torch half-split reference and existing G72 comparison.
# LICENSE: MIT; AUTHORITY: Diagnostic only; multi-token agreement not established.
import os,sys,json,importlib.util,numpy as np
import torch
root=os.path.dirname(__file__)
s=importlib.util.spec_from_file_location('g72',os.path.join(root,'g72-qkv-attention.py'));g72=importlib.util.module_from_spec(s);s.loader.exec_module(g72)
def neox(v,pos):
 theta=pos/np.power(1000000.0,np.arange(64,dtype=np.float64)/64)
 c=np.cos(theta).astype(np.float32);sn=np.sin(theta).astype(np.float32)
 a=v[...,:64];b=v[...,64:]
 return np.concatenate([a*c-b*sn,a*sn+b*c],axis=-1)
v=np.linspace(-0.35,0.9,1024,dtype=np.float32).reshape(8,128)
pos=17
actual=neox(v,pos)
tv=torch.from_numpy(v.copy());t=torch.arange(64,dtype=torch.float64)
phase=torch.tensor(float(pos),dtype=torch.float64)/torch.pow(torch.tensor(1000000.0,dtype=torch.float64),t/64)
c=phase.cos().float();sn=phase.sin().float();a,b=torch.chunk(tv,2,dim=-1)
reference=torch.cat([a*c-b*sn,a*sn+b*c],dim=-1).numpy()
prior=g72.rope(v,pos)
err=float(np.max(np.abs(actual-reference)));prior_error=float(np.max(np.abs(prior-reference)))
passed=bool(np.allclose(actual,reference,atol=2e-6,rtol=2e-6)) and prior_error>0.1
print(json.dumps({'status':'G84_NEOX_ROPE_CONVENTION_PASS' if passed else 'G84_FAIL','headDimension':128,'position':pos,'neoxVsTorchMaxError':err,'previousAdjacentPairVsNeoXMaxError':prior_error,'llamaCppQwen3RopeType':'NEOX','inferenceReferenceMatched':False,'productionAccepted':False},indent=2))
if not passed:sys.exit(1)
