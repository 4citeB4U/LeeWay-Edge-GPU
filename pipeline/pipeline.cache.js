/*
REGION: LEEWAY.EDGE_GPU.PIPELINES
TAG: LEEWAY.EDGE_GPU.PIPELINE_CACHE.G0
WHAT: Device- and source-bound compute pipeline cache. WHY: Prevent stale/cross-device objects.
WHO: Creator-authorized Agent Lee. WHERE: Existing pipeline cache. WHEN: Pipeline acquisition.
HOW: Weak device keys and full source identity; bounded cache entries. LICENSE: MIT
*/
const devices=new WeakMap();
export function getPipeline(device,key,shaderCode){
 if(!device||typeof device.createComputePipeline!=='function')throw new TypeError('GPU_DEVICE_REQUIRED');
 if(typeof key!=='string'||typeof shaderCode!=='string'||!shaderCode.trim())throw new TypeError('PIPELINE_SOURCE_REQUIRED');
 let cache=devices.get(device);
 if(!cache){cache=new Map();devices.set(device,cache);device.lost?.then?.(()=>cache.clear());}
 const identity=JSON.stringify([key,shaderCode,'main']);
 if(cache.has(identity))return cache.get(identity);
 const module=device.createShaderModule({code:shaderCode});
 const pipeline=device.createComputePipeline({layout:'auto',compute:{module,entryPoint:'main'}});
 if(cache.size>=128)cache.delete(cache.keys().next().value);
 cache.set(identity,pipeline);return pipeline;
}
export function clearPipelineCache(device){devices.get(device)?.clear();}
