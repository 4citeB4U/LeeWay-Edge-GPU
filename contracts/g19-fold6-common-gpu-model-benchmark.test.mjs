import test from 'node:test';
import assert from 'node:assert/strict';
import {BENCHMARK,qualifyRun,compareRuns} from './g19-fold6-common-gpu-model-benchmark.mjs';
const run={device:BENCHMARK.device,modelId:BENCHMARK.modelId,modelSha256:BENCHMARK.sha256,modelSizeBytes:BENCHMARK.sizeBytes,prompt:BENCHMARK.prompt,context:BENCHMARK.context,predict:BENCHMARK.predict,temperature:BENCHMARK.temperature,seed:BENCHMARK.seed,backend:'VULKAN',gpuAdapter:'Adreno (TM) 750',hardwareGpuDispatchObserved:true,cpuOnlyFallback:false,engineVersion:'native-candidate',engineBinarySha256:'ab'.repeat(32),completed:true,response:'7 remaining.',generatedTokens:5,generationMs:1000,leewayDispatcherUsed:false};
const governed={...run,leewayDispatcherUsed:true,requestScopedRuntimeGrantVerified:true,runtimeReceiptId:'receipt-example',generationMs:1100};
test('missing GPU generation cannot be called successful',()=>{let r=qualifyRun({...run,completed:false,response:''});assert.equal(r.status,'BLOCKED');assert.ok(r.blockers.includes('NO_COMPLETED_GENERATION'))});
test('Vulkan physical Adreno GPU evidence required',()=>{let r=qualifyRun({...run,backend:'CPU'});assert.ok(r.blockers.includes('PHYSICAL_GPU_NOT_ATTESTED'))});
test('same model digest mandatory',()=>{let r=qualifyRun({...run,modelSha256:'0'.repeat(64)});assert.ok(r.blockers.includes('MODEL_IDENTITY_MISMATCH'))});
test('direct baseline must exclude LeeWay',()=>assert.ok(qualifyRun(governed).blockers.includes('LEEWAY_PRESENT_IN_DIRECT_CONTROL')));
test('LeeWay route requires genuine request grant',()=>assert.ok(qualifyRun({...governed,requestScopedRuntimeGrantVerified:false},'LEEWAY_CONTROLLED').blockers.includes('LEEWAY_RUNTIME_AUTHORITY_UNVERIFIED')));
test('both actual runs required before speed ratio',()=>assert.equal(compareRuns({...run,completed:false},governed).comparable,false));
test('binary mismatch invalidates comparison',()=>assert.equal(compareRuns(run,{...governed,engineBinarySha256:'cd'.repeat(32)}).reason,'RUNTIME_BINARY_DIFFERENCE'));
test('synthetic fully-qualified pair yields only candidate comparison, not canonical proof',()=>{const r=compareRuns(run,governed);assert.equal(r.comparable,true);assert.equal(r.independentVerificationRequired,true);assert.equal(qualifyRun(run).verifiedPhysicalGpuModelInference,false)});

test('different generated token workloads cannot yield a raw latency ratio',()=>{
 const x=compareRuns({...run,generatedTokens:1},{...governed,generatedTokens:48});
 assert.equal(x.comparable,false);
 assert.equal(x.reason,'GENERATED_TOKEN_COUNT_MISMATCH');
 assert.equal(x.generationSpeedRatio,undefined);
});
