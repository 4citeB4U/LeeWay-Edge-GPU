# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QWEN3.ATTENTION
# TAG: LEEWAY.G71.REAL_KEY_NORM_ROPE
# 5WH:
# WHAT = Apply genuine Qwen3 key normalization and rotary positional encoding.
# WHY = Extend verified quantized key projection toward native attention math.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g71-qwen3-key-rope.py
# WHEN = 2026-10-22
# HOW = Real Q4_K weights; independent Torch reference for RMSNorm and RoPE.
# LICENSE: MIT
# AUTHORITY: Diagnostic reference; not G22/LDWMD execution or full inference.
import os,sys,json,importlib.util,numpy as np
def module(name,filename):
 spec=importlib.util.spec_from_file_location(name,os.path.join(os.path.dirname(__file__),filename))
 obj=importlib.util.module_from_spec(spec);spec.loader.exec_module(obj);return obj
g64=module('g64','g64-attention-projection.py')
g63=module('g63','g63-qwen3-rmsnorm.py')
g62=module('g62','g62-native-quant-blocks.py')
def key_pipeline(file,position=17):
 import torch
 raw,shape=g64.select_tensor(file,'blk.0.attn_k.weight')
 assert shape==[2560,1024]
 weights,sha=g63.locate_f32(file,'blk.0.attn_k_norm.weight')
 assert weights.size==128
 x=np.linspace(-0.5,0.5,2560,dtype=np.float32)
 # GGUF contiguous output rows; Q4_K dequantize in bounded blocks.
 row_bytes=2560//256*144
 projected=np.empty(1024,dtype=np.float32)
 for row in range(1024):
  w=g62.decode(raw[row*row_bytes:(row+1)*row_bytes],12)
  projected[row]=np.dot(w,x)
 k=projected.reshape(8,128)
 epsilon=np.float32(1e-6)
 norm=np.empty_like(k)
 for h in range(8):
  norm[h]=g63.rmsnorm(k[h],weights,epsilon)
 # Qwen3 GGUF llama.cpp RoPE dimensions are interleaved neighboring pairs.
 base=1000000.0
 idx=np.arange(64,dtype=np.float64)
 theta=position/(base**(idx/64.0))
 cos=np.cos(theta).astype(np.float32);sin=np.sin(theta).astype(np.float32)
 rot=norm.reshape(8,64,2)
 out=np.empty_like(rot)
 out[:,:,0]=rot[:,:,0]*cos-rot[:,:,1]*sin
 out[:,:,1]=rot[:,:,0]*sin+rot[:,:,1]*cos
 # Independent PyTorch reference computes same documented mathematical operation.
 kt=torch.from_numpy(projected.copy()).reshape(8,128)
 wt=torch.from_numpy(weights.copy())
 refnorm=kt*torch.rsqrt(kt.square().mean(-1,keepdim=True)+float(epsilon))*wt
 angles=torch.arange(64,dtype=torch.float64)
 angles=(position/torch.pow(torch.tensor(base,dtype=torch.float64),angles/64)).to(torch.float32)
 c=torch.cos(angles);s=torch.sin(angles)
 even=refnorm[:,0::2];odd=refnorm[:,1::2]
 reference=torch.stack((even*c-odd*s,even*s+odd*c),dim=-1).reshape(8,128).numpy()
 actual=out.reshape(8,128)
 err=float(np.max(np.abs(actual-reference)))
 if not np.allclose(actual,reference,rtol=1e-5,atol=2e-5):raise AssertionError('G71_TORCH_REFERENCE_MISMATCH')
 return {'status':'G71_KEY_NORM_ROPE_PASS','weightTensor':'blk.0.attn_k.weight','normTensor':'blk.0.attn_k_norm.weight','kvHeads':8,'headDim':128,'position':position,'valuesChecked':1024,'maxAbsoluteError':err,'keyNormSha256':sha,'fullAttentionExecuted':False,'g22LdwmdExecuted':False,'productionAccepted':False}
if __name__=='__main__':print(json.dumps(key_pipeline(sys.argv[1]),indent=2))
