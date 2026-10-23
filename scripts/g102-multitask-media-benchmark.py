# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.MULTITASK.BENCHMARK
# TAG: LEEWAY.G102.REAL_MEDIA_TASK_DAG
# 5WH: WHAT = Exercise nested tool-style vision, drawing, enhancement, and video-frame tasks.
# WHY = Compare real CPU software computation with NVIDIA CUDA across several tasks.
# WHO = Creator-directed LeeWay benchmark engineering.
# WHERE = scripts/g102-multitask-media-benchmark.py
# WHEN = 2026-10-23
# HOW = Identical PyTorch operators, synchronized timing, output parity, input/output checksums.
# LICENSE: MIT; AUTHORITY: Experimental compute benchmark; not generative AI or production admission.
import os,sys,time,json,hashlib
import numpy as np,torch
import torch.nn.functional as F
from pathlib import Path
torch.set_num_threads(4)
device=torch.device('cuda:0') if torch.cuda.is_available() else None
if device is None:raise SystemExit('CUDA_REQUIRED')
H=W=384; N=12
y,x=np.mgrid[0:H,0:W].astype(np.float32)
images=np.stack([np.stack([((x+11*i)%W)/W,((y+7*i)%H)/H,(np.sin(x*.04+y*.03+i*.3)+1)/2],axis=0) for i in range(N)]).astype('f4')
kernel=torch.tensor([[1.,2.,1.],[2.,4.,2.],[1.,2.,1.]],dtype=torch.float32).reshape(1,1,3,3)/16
def task_graph(dev):
 inp=torch.tensor(images,device=dev)
 k=kernel.to(dev).expand(3,1,3,3)
 events=[];out={}
 def run(name,fn):
  if dev.type=='cuda':torch.cuda.synchronize()
  begin=time.perf_counter();v=fn()
  if dev.type=='cuda':torch.cuda.synchronize()
  events.append({'task':name,'milliseconds':round((time.perf_counter()-begin)*1000,3)})
  return v
 # Tool 1 image vision: actual gradient-edge measurements from frame pixels
 gray=run('vision.grayscale',lambda:(inp[:,0:1]*.299+inp[:,1:2]*.587+inp[:,2:3]*.114))
 gx=run('vision.edges',lambda:torch.abs(gray[:,:,:,1:]-gray[:,:,:,:-1]).mean(dim=(1,2,3)))
 out['edgeScore']=gx.detach().cpu().numpy()
 # Tool 2 image enhancement: genuine spatial convolution and sharpening
 blurred=run('enhance.gaussian_blur',lambda:F.conv2d(inp,k,padding=1,groups=3))
 enhanced=run('enhance.unsharp_mask',lambda:(inp+0.65*(inp-blurred)).clamp(0,1))
 out['enhancedMean']=enhanced.mean(dim=(1,2,3)).detach().cpu().numpy()
 # Tool 3 drawing: construct original procedural RGB artwork using per-pixel formulas
 xx=torch.tensor(x/W,device=dev);yy=torch.tensor(y/H,device=dev)
 drawn=run('draw.procedural_art',lambda:torch.stack([torch.sin((xx*9+yy*5)*3.14159265).square(),torch.cos((xx*4-yy*8)*3.14159265).square(),((xx-0.5)**2+(yy-0.5)**2).sqrt().clamp(0,1)],dim=0))
 out['drawMean']=drawn.mean().detach().cpu().numpy()
 # Tool 4 video frame processing: real 12 frame timeline and adjacent optical change energy
 temporal=run('video.frame_differences',lambda:(enhanced[1:]-enhanced[:-1]).abs().mean(dim=(1,2,3)))
 summary=run('video.timeline_summary',lambda:torch.stack([temporal.mean(),temporal.max(),temporal.min()]))
 out['videoSummary']=summary.detach().cpu().numpy()
 # Tool 5 multi-tool planning, fan out and deterministic merge
 merged=run('agent.aggregate',lambda:torch.cat([gx,temporal,enhanced.mean(dim=(1,2,3))]))
 out['aggregated']=merged.detach().cpu().numpy()
 return events,out
# Warmup (not timed), then independent CPU/CUDA execution
task_graph(torch.device('cpu'));task_graph(device)
def measure(dev):
 start=time.perf_counter();steps,values=task_graph(dev);total=(time.perf_counter()-start)*1000
 return steps,values,total
cpu,cv,ct=measure(torch.device('cpu'))
gpu,gv,gt=measure(device)
error=max(float(np.max(np.abs(cv[key]-gv[key]))) for key in cv)
record={'status':'G102_MULTITASK_PARITY_PASS' if error<1e-4 else 'G102_PARITY_FAILED','workload':'12 generated 384x384 RGB frames, actual tensor processing','nestedTasks':['vision.grayscale','vision.edges','enhance.gaussian_blur','enhance.unsharp_mask','draw.procedural_art','video.frame_differences','video.timeline_summary','agent.aggregate'],'taskCount':len(cpu),'hardware':torch.cuda.get_device_name(0),'torchVersion':torch.__version__,'CPU':{'endToEndMs':round(ct,3),'steps':cpu},'NVIDIA':{'endToEndMs':round(gt,3),'steps':gpu},'CPUvsNvidiaRatio':round(ct/gt,3),'maxCpuGpuOutputError':error,'trueImageGenerationModelLoaded':False,'trueVideoGenerationModelLoaded':False,'realVisionModelLoaded':False,'toolOrchestration':'deterministic nested task DAG (not autonomous LLM tool calls)','leewayLdwmdExecutedInThisTest':False,'productionAccepted':False}
print(json.dumps(record,indent=2))
if error>=1e-4:sys.exit(1)
