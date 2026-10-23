# LEEWAY HEADER — DO NOT REMOVE
# REGION: LEEWAY.EDGE_GPU.VISUAL_TENSOR_BENCHMARK
# TAG: LEEWAY.G55.VISUAL_RECONSTRUCTION_MEMORY_CACHE
# 5WH:
# WHAT = Benchmark synthetic image upscaling, tiled tensor footprint and exact compute caching.
# WHY = Measure graphics-oriented effects without claiming neural inference equivalence.
# WHO = Creator-directed LeeWay engineering, benchmark-only.
# WHERE = LeeWay-Edge-GPU/scripts/g55-visual-tensor-benchmark.py
# WHEN = 2026-10-22
# HOW = NumPy/Pillow deterministic synthetic reference, PSNR, Float32 tiles, SHA-256 cache.
# LICENSE: MIT
# AUTHORITY: Diagnostic test, no canonical Veritas admission or ledger write.
import hashlib, io, json, math, time, tracemalloc
import numpy as np
from PIL import Image, ImageFilter
W,H=1280,640
y,x=np.mgrid[0:H,0:W]
# Deterministic high-frequency synthetic image; no model training.
a=(0.5+0.24*np.sin(x/19)+0.20*np.cos(y/17)+0.06*np.sin((x+y)/2.1))
b=(0.5+0.22*np.sin((x+y)/23)+0.18*np.cos(x/7)+0.08*np.sin(y/2.8))
c=(0.5+0.25*np.cos((x-y)/26)+0.15*np.sin(y/13)+0.08*np.cos(x/3.1))
reference=np.uint8(np.clip(np.stack([a,b,c],axis=-1),0,1)*255)
original=Image.fromarray(reference,'RGB')
low=original.resize((640,320),Image.Resampling.BOX)
def metric(im):
    delta=np.asarray(im,dtype=np.float64)-reference.astype(np.float64)
    mse=float(np.mean(delta*delta))
    return {'mse':round(mse,3),'psnr_db':round(10*math.log10(255**2/mse),3) if mse else None,'perfect':mse==0}
methods={}
for name,resample in [('nearest',Image.Resampling.NEAREST),('bilinear',Image.Resampling.BILINEAR),('bicubic',Image.Resampling.BICUBIC),('lanczos',Image.Resampling.LANCZOS)]:
    t=time.perf_counter(); out=low.resize((W,H),resample); elapsed=(time.perf_counter()-t)*1000
    methods[name]={'elapsed_ms':round(elapsed,3),**metric(out)}
t=time.perf_counter()
sharpened=low.resize((W,H),Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2,percent=110,threshold=2))
methods['lanczos_unsharp']={'elapsed_ms':round((time.perf_counter()-t)*1000,3),**metric(sharpened)}
# Macro tensor is a virtual partition plan: do not allocate 800MiB.
dims=(640,320,64,16); elements=math.prod(dims); bytecount=elements*4
tile=(32,32,8,16); tile_elements=math.prod(tile); tile_bytes=tile_elements*4
tile_count=math.prod(math.ceil(d/t) for d,t in zip(dims,tile))
# Exact-value cached compute; cache guarantees no change for identical content only.
rng=np.random.default_rng(55); matrix=rng.standard_normal((128,128),dtype=np.float32)
cache={}; calls=120; hits=0; misses=0
tracemalloc.start()
t=time.perf_counter()
for i in range(calls):
    m=matrix if i%3 else matrix*1.001
    key=hashlib.sha256(m.tobytes()+b'G55.square.v1').hexdigest()
    if key in cache:
        hits+=1; result=cache[key]
    else:
        misses+=1; result=m@m; cache[key]=result
cached_ms=(time.perf_counter()-t)*1000
_,peak=tracemalloc.get_traced_memory();tracemalloc.stop()
t=time.perf_counter()
for i in range(calls):
    m=matrix if i%3 else matrix*1.001
    result=m@m
uncached_ms=(time.perf_counter()-t)*1000
result={'status':'G55_SYNTHETIC_VISUAL_AND_TENSOR_BENCHMARK','reference':'deterministic synthetic 1280x640 RGB','low_resolution':'640x320','reconstruction':methods,'tensor_plan':{'dimensions':dims,'float32_elements':elements,'logical_mib':round(bytecount/1048576,3),'tile_shape':tile,'tile_count':tile_count,'tile_mib':round(tile_bytes/1048576,3),'logical_data_preserved_by_tiling':True,'neural_compression_proven':False},'exact_cache':{'calls':calls,'hits':hits,'misses':misses,'cached_ms':round(cached_ms,3),'uncached_ms':round(uncached_ms,3),'tracked_peak_bytes':peak,'equivalent_model_inference_proven':False},'claims':{'trained_AI_model_used':False,'DLSS_FSR_equivalence':False,'frontier_model_tested':False,'production_admitted':False}}
print(json.dumps(result,indent=2))
