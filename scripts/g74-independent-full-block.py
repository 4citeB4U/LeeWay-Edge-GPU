# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.VERIFICATION
# TAG: LEEWAY.G74.INDEPENDENT_FULL_BLOCK_ORACLE
# 5WH: WHAT = Compare complete first Qwen3 block end to end against independent Torch math.
# WHY = G73 covered FFN oracle but did not validate whole-block reference.
# WHO = Creator-directed diagnostic engineering.
# WHERE = scripts/g74-independent-full-block.py
# WHEN = 2026-10-22
# HOW = Distinct Torch RMSNorm, RoPE, masked SDPA and SwiGLU, GGUF tensor decoder.
# LICENSE: MIT
# AUTHORITY: Lab only; no live G70 integration or production admission.
import sys,os,json,importlib.util,numpy as np,hashlib
def module(name,filename):
 spec=importlib.util.spec_from_file_location(name,os.path.join(os.path.dirname(__file__),filename))
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
g73=module('g73','g73-first-transformer-block.py')
g72=module('g72','g72-qkv-attention.py')
def run(file):
 import torch
 torch.set_num_threads(2)
 base,directory=g73.index_gguf(file)
 W=lambda name:torch.from_numpy(g73.weights(file,base,directory,'blk.0.'+name).copy())
 inp=torch.from_numpy(np.stack([np.linspace(-.5,.5,2560,dtype=np.float32),np.linspace(.3,-.4,2560,dtype=np.float32)]))
 def norm(v,w):return v*torch.rsqrt(v.square().mean(-1,keepdim=True)+1e-6)*w
 def rotary(z):
  theta=1.0/torch.pow(torch.tensor(1e6,dtype=torch.float64),torch.arange(64,dtype=torch.float64)/64)
  freq=torch.outer(torch.arange(2,dtype=torch.float64),theta).to(torch.float32)
  cs=freq.cos()[:,None,:];sn=freq.sin()[:,None,:]
  even=z[...,0::2];odd=z[...,1::2]
  return torch.stack((even*cs-odd*sn,even*sn+odd*cs),dim=-1).reshape(z.shape)
 n=norm(inp,W('attn_norm.weight'))
 q=rotary(norm((n@W('attn_q.weight').T).reshape(2,32,128),W('attn_q_norm.weight')))
 k=rotary(norm((n@W('attn_k.weight').T).reshape(2,8,128),W('attn_k_norm.weight')))
 v=(n@W('attn_v.weight').T).reshape(2,8,128)
 keys=k.repeat_interleave(4,dim=1).permute(1,0,2)
 values=v.repeat_interleave(4,dim=1).permute(1,0,2)
 queries=q.permute(1,0,2)
 scores=queries@keys.transpose(1,2)/np.sqrt(128)
 mask=torch.ones((2,2),dtype=torch.bool).tril()
 probs=torch.softmax(scores.masked_fill(~mask[None,:,:],float('-inf')),dim=-1)
 context=(probs@values).permute(1,0,2).reshape(2,4096)
 attn_out=context@W('attn_output.weight').T
 hidden=inp+attn_out
 ff=norm(hidden,W('ffn_norm.weight'))
 gate=ff@W('ffn_gate.weight').T
 up=ff@W('ffn_up.weight').T
 final=hidden+(torch.nn.functional.silu(gate)*up)@W('ffn_down.weight').T
 if os.environ.get('LEEWAY_BLOCK_COMPARE_DIR'): final.numpy().tofile(os.path.join(os.environ['LEEWAY_BLOCK_COMPARE_DIR'],'g74.bin'))
 if not torch.isfinite(final).all():raise ValueError('G74_NONFINITE')
 return {'status':'G74_INDEPENDENT_TORCH_BLOCK_EXECUTED','outputShape':list(final.shape),'outputSha256':hashlib.sha256(final.numpy().tobytes()).hexdigest(),'firstValues':final.flatten()[:8].tolist(),'independentWeightsDecoded':False,'modelInference':False,'productionAccepted':False}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),indent=2))
