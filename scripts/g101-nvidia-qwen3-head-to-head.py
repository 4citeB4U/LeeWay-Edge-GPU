# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.QWEN3.BENCHMARK
# TAG: LEEWAY.G101.NVIDIA_EXACT_WORKLOAD_BASELINE
# 5WH: WHAT = Run exact G70 Qwen3 1024x2560 key projection on RTX using CUDA PyTorch.
# WHY = Measure same-input CUDA performance and reference error against LeeWay software compute.
# WHO = Creator-directed LeeWay benchmark engineer.
# WHERE = scripts/g101-nvidia-qwen3-head-to-head.py
# WHEN = 2026-10-23
# HOW = Reconstruct 40 verified 256x256 G66 tiles, torch CUDA matvec, synchronize and read back.
# LICENSE: MIT; AUTHORITY: Lab benchmark only; not production pipeline certification.
import json,sys,time,hashlib,pathlib
import numpy as np, torch
source=pathlib.Path(sys.argv[1])
manifest=json.loads((source/'manifest.json').read_text())
assert manifest['shape']==[2560,1024] and len(manifest['tiles'])==40
assert torch.cuda.is_available(),'CUDA_NOT_AVAILABLE'
matrix=np.empty((1024,2560),dtype=np.float32)
x=np.linspace(-0.5,0.5,2560,dtype=np.float32)
for tile in manifest['tiles']:
 a=np.fromfile(source/(tile['stem']+'.A.bin'),dtype='<f4').reshape(256,256)
 matrix[tile['outBase']:tile['outBase']+256,tile['kBase']:tile['kBase']+256]=a
 ref=np.fromfile(source/(tile['stem']+'.B.bin'),dtype='<f4').reshape(256,256)
 if not np.array_equal(ref[:,0],x[tile['kBase']:tile['kBase']+256]):raise ValueError('X_TILE_MISMATCH')
expected=np.fromfile(source/'expected.bin',dtype='<f4')
assert expected.shape==(1024,)
device=torch.device('cuda:0')
torch.cuda.init()
torch.cuda.synchronize()
start=time.perf_counter()
A=torch.from_numpy(matrix).to(device);X=torch.from_numpy(x).to(device)
torch.cuda.synchronize();upload_ms=(time.perf_counter()-start)*1000
for i in range(10):Y=torch.mv(A,X)
torch.cuda.synchronize()
iterations=100
s=torch.cuda.Event(enable_timing=True);e=torch.cuda.Event(enable_timing=True)
s.record()
for i in range(iterations):Y=torch.mv(A,X)
e.record();torch.cuda.synchronize()
kernel_ms=s.elapsed_time(e)/iterations
begin=time.perf_counter();Y=torch.mv(A,X);out=Y.cpu().numpy();torch.cuda.synchronize()
roundtrip_ms=(time.perf_counter()-begin)*1000
delta=np.abs(out-expected)
mismatches=int(np.sum(delta>(1e-4+1e-4*np.abs(expected))))
result={'status':'G101_CUDA_IDENTICAL_WORKLOAD_PASS' if mismatches==0 else 'G101_CUDA_OUTPUT_MISMATCH','gpuName':torch.cuda.get_device_name(),'torchVersion':torch.__version__,'cudaRuntime':torch.version.cuda,'shape':[1024,2560],'tiles':40,'elements':int(matrix.size),'uploadMs':round(upload_ms,3),'kernelMsMean100':round(kernel_ms,4),'singleKernelAndReadbackMs':round(roundtrip_ms,3),'maxAbsError':float(delta.max()),'mismatches':mismatches,'outputSha256':hashlib.sha256(out.tobytes()).hexdigest(),'softwareComparator':'G70 LDWMD 40-tile worker, 195.611 ms (separate earlier run)','kernelOnlyVsFullSoftwareNotEndToEndComparable':True,'productionAccepted':False}
print(json.dumps(result,indent=2))
if mismatches:sys.exit(1)
