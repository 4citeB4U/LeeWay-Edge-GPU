# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.GRAPHICS.QUALITY
# TAG: LEEWAY.G56.720P_1440P_4K_BASELINE
# 5WH:
# WHAT = Quantify deterministic graphics reconstruction from 720p to 1440p and 4K.
# WHY = Compare actual fidelity and execution time rather than make neural-upscaling claims.
# WHO = Creator-directed engineering, local measurement only.
# WHERE = LeeWay-Edge-GPU/scripts/g56-resolution-quality-benchmark.py
# WHEN = 2026-10-22
# HOW = NumPy reference, Pillow resamplers, crop-independent metric and measured RSS.
# LICENSE: MIT
# AUTHORITY: Diagnostic baseline; not LeeWay G22 dispatch or production certified.
import json, time, math, os
import numpy as np
from PIL import Image
try:
 import psutil
 proc=psutil.Process(os.getpid())
 rss=lambda:proc.memory_info().rss
except ImportError:
 rss=lambda:None
results=[]
for w,h in ((2560,1440),(3840,2160)):
 t=time.perf_counter()
 yy,xx=np.ogrid[:h,:w]
 # Exact synthetic target constructed at output resolution, with known fine details.
 r=np.uint8(np.clip((0.5+0.27*np.sin(xx/21)+0.18*np.cos(yy/25)+0.04*np.sin(xx/3.8))*255,0,255))
 g=np.uint8(np.clip((0.5+0.21*np.sin((xx+yy)/29)+0.19*np.cos(yy/13)+0.06*np.sin(xx/4.7))*255,0,255))
 b=np.uint8(np.clip((0.5+0.26*np.cos((xx-yy)/33)+0.14*np.sin(xx/11)+0.06*np.cos(yy/4.1))*255,0,255))
 ref=np.stack((np.broadcast_to(r,(h,w)),np.broadcast_to(g,(h,w)),np.broadcast_to(b,(h,w))),axis=-1)
 reference=Image.fromarray(ref,'RGB')
 source=reference.resize((1280,720),Image.Resampling.BOX)
 methods={}
 for name,resampler in (('bilinear',Image.Resampling.BILINEAR),('bicubic',Image.Resampling.BICUBIC),('lanczos',Image.Resampling.LANCZOS)):
  run=[]
  for _ in range(3):
   s=time.perf_counter()
   out=source.resize((w,h),resampler)
   run.append((time.perf_counter()-s)*1000)
  # Evaluate in 256-line slices to bound temporary memory, double precision for sum.
  total=0.0
  for start in range(0,h,256):
   end=min(h,start+256)
   delta=np.asarray(out.crop((0,start,w,end)),dtype=np.float32)-ref[start:end].astype(np.float32)
   total+=float(np.sum(delta*delta,dtype=np.float64))
  mse=total/(w*h*3)
  methods[name]={'median_ms':round(float(np.median(run)),2),'mse':round(mse,4),'psnr_db':round(10*math.log10(65025/mse),3) if mse else None}
  del out
 results.append({'resolution':f'{w}x{h}','source':'1280x720','reference_type':'synthetic','methods':methods,'process_rss_mib':round(rss()/1048576,2) if rss() else None,'elapsed_setup_and_test_s':round(time.perf_counter()-t,2)})
 del ref,reference,source,r,g,b
print(json.dumps({'schema':'leeway.g56.synthetic-resolution-benchmark.v1','status':'BASELINE_EXECUTED','results':results,'neural_model_used':False,'leeway_gpu_execution':False,'production_accepted':False},indent=2))
