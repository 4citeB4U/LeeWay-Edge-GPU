// G19 J-5: same GGUF + native engine acceptance for direct GPU and LeeWay-controlled GPU.
// This is a validation contract, NEVER runtime/physical evidence by itself.
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const t=x=>typeof x==='string'&&x.trim().length>0;
const MODEL_SHA='c004ac34cce45e03e4452bca472535bc371fcb0d07ae560bba2c57ce4a284b7b';
const MODEL_BYTES=386405280;
export const BENCHMARK=Object.freeze({device:'SM-F956U',modelId:'SmolLM2-360M-Instruct-Q8_0.gguf',sha256:MODEL_SHA,sizeBytes:MODEL_BYTES,prompt:'A delivery van has 12 packages and delivers 5. How many remain? Answer in one short sentence.',context:512,predict:48,temperature:0,seed:69,backend:'VULKAN',gpuOffloadLayers:99});
export function qualifyRun(e={},route='DIRECT_HARDWARE'){
 if(!['DIRECT_HARDWARE','LEEWAY_CONTROLLED'].includes(route))throw Error('INVALID_BENCHMARK_ROUTE');
 const blockers=[];
 const req=(name,ok)=>{if(!ok)blockers.push(name)};
 req('MODEL_IDENTITY_MISMATCH',e.modelId===BENCHMARK.modelId&&e.modelSha256===MODEL_SHA&&e.modelSizeBytes===MODEL_BYTES);
 req('DEVICE_MISMATCH',e.device==='SM-F956U');
 req('PROMPT_OR_SAMPLER_MISMATCH',e.prompt===BENCHMARK.prompt&&e.context===BENCHMARK.context&&e.predict===BENCHMARK.predict&&e.temperature===BENCHMARK.temperature&&e.seed===BENCHMARK.seed);
 req('PHYSICAL_GPU_NOT_ATTESTED',e.backend==='VULKAN'&&e.gpuAdapter?.includes('Adreno')&&e.hardwareGpuDispatchObserved===true&&e.cpuOnlyFallback===false);
 req('NATIVE_ENGINE_UNQUALIFIED',t(e.engineVersion)&&hash(e.engineBinarySha256));
 req('NO_COMPLETED_GENERATION',e.completed===true&&t(e.response)&&Number.isInteger(e.generatedTokens)&&e.generatedTokens>0&&Number.isFinite(e.generationMs)&&e.generationMs>0);
 if(route==='DIRECT_HARDWARE')req('LEEWAY_PRESENT_IN_DIRECT_CONTROL',e.leewayDispatcherUsed===false);
 else req('LEEWAY_RUNTIME_AUTHORITY_UNVERIFIED',e.leewayDispatcherUsed===true&&e.requestScopedRuntimeGrantVerified===true&&t(e.runtimeReceiptId));
 return Object.freeze({route,status:blockers.length?'BLOCKED':'READY_FOR_INDEPENDENT_VALIDATION',blockers:Object.freeze(blockers),verifiedPhysicalGpuModelInference:false});
}
export function compareRuns(a,b){
 const direct=qualifyRun(a,'DIRECT_HARDWARE'),leeway=qualifyRun(b,'LEEWAY_CONTROLLED');
 if(direct.status==='BLOCKED'||leeway.status==='BLOCKED')return Object.freeze({comparable:false,reason:'BOTH_REAL_GPU_RUNS_REQUIRED',directBlockers:direct.blockers,leewayBlockers:leeway.blockers});
 if(a.engineVersion!==b.engineVersion||a.engineBinarySha256!==b.engineBinarySha256)return Object.freeze({comparable:false,reason:'RUNTIME_BINARY_DIFFERENCE'});
 if(a.generatedTokens!==b.generatedTokens)return Object.freeze({comparable:false,reason:'GENERATED_TOKEN_COUNT_MISMATCH'});
 return Object.freeze({comparable:true,generationSpeedRatio:a.generationMs/b.generationMs,deltaMs:b.generationMs-a.generationMs,independentVerificationRequired:true});
}
