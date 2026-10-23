# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MODEL_HUB.QUANT
# TAG: LEEWAY.G62.Q4K_Q6K_NATIVE_DEQUANT
# 5WH:
# WHAT = Decode bounded Q4_K/Q6_K model weight blocks to Float32.
# WHY = Allow the LeeWay model reader to consume real quantized Qwen3 weights.
# WHO = Creator-directed LeeWay diagnostic engineering.
# WHERE = scripts/g62-native-quant-blocks.py
# WHEN = 2026-10-22
# HOW = GGML K-block bit packing, independent reference comparison required before acceptance.
# LICENSE: MIT
# AUTHORITY: Diagnostic only; no inference or production acceptance.
import numpy as np
def decode(data,typ):
 blocksize={12:144,14:210}.get(typ)
 if blocksize is None or len(data)==0 or len(data)%blocksize:raise ValueError('QUANT_BLOCK_INVALID')
 b=np.frombuffer(data,dtype=np.uint8).reshape(-1,blocksize)
 count=b.shape[0]
 if typ==12:
  d=b[:,0:2].copy().view('<f2').astype(np.float32)
  dm=b[:,2:4].copy().view('<f2').astype(np.float32)
  scales=b[:,4:16].reshape(count,3,4)
  a,mi,extra=scales[:,0,:],scales[:,1,:],scales[:,2,:]
  sc=np.concatenate((a&63,(extra&15)|((a>>2)&48)),axis=1).astype(np.float32)
  mins=np.concatenate((mi&63,(extra>>4)|((mi>>2)&48)),axis=1).astype(np.float32)
  packed=b[:,16:].reshape(count,4,32)
  q=np.stack((packed&15,packed>>4),axis=2).reshape(count,8,32).astype(np.float32)
  out=((d*sc).reshape(count,8,1)*q-(dm*mins).reshape(count,8,1)).reshape(count,256)
 else:
  low=b[:,:128].reshape(count,2,1,64)
  low=np.stack((low[:,:,0,:]&15,low[:,:,0,:]>>4),axis=2).reshape(count,8,32)
  high=b[:,128:192].reshape(count,2,1,32)
  high=np.stack(tuple((high[:,:,0,:]>>(2*i))&3 for i in range(4)),axis=2).reshape(count,8,32)
  q=(low|(high<<4)).astype(np.int16)-32
  sc=b[:,192:208].view(np.int8).astype(np.float32)
  d=b[:,208:210].copy().view('<f2').astype(np.float32)
  out=((d*sc).reshape(count,16,1)*q.reshape(count,16,16)).reshape(count,256)
 if not np.isfinite(out).all():raise ValueError('DEQUANT_NONFINITE')
 return out.reshape(-1)
