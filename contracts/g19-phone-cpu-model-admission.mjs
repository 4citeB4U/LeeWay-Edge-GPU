// G19 J-5: LeeWay-owned CPU-only, phone-only model inference admission.
// Policy gate, not an inference engine. No fallback to Adreno, Windows, or cloud.
const text=x=>typeof x==='string'&&x.trim().length>0;
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
export function admitPhoneCpuModel(t={}){
 const blockers=[];const require=(name,condition)=>{if(!condition)blockers.push(name)};
 require('TARGET_MUST_BE_FOLD6',t.device?.platform==='ANDROID'&&t.device?.model==='SM-F956U'&&text(t.device?.id));
 require('MODEL_BYTES_NOT_VERIFIED_ON_PHONE',t.model?.location==='PHONE_PRIVATE_OR_OWNER_GRANTED'&&t.model?.residentOnTarget===true&&sha(t.model?.sha256)&&text(t.model?.id));
 require('LOCAL_CPU_INFERENCE_ENTRYPOINT_MISSING',t.runtime?.localNative===true&&t.runtime?.entrypointVerified===true&&t.runtime?.backend==='CPU');
 require('GPU_OFFLOAD_NOT_DISABLED',t.runtime?.gpuOffloadDisabled===true);
 require('CROSS_DEVICE_OR_NETWORK_ROUTE_NOT_DISABLED',t.routing?.pairedComputerDisabled===true&&t.routing?.cloudDisabled===true);
 require('REQUEST_AUTHORITY_UNVERIFIED',t.authority?.requestScopedGrantVerified===true&&t.authority?.targetDeviceId===t.device?.id);
 return Object.freeze({admitted:blockers.length===0,status:blockers.length?'BLOCKED_BEFORE_INFERENCE':'READY_FOR_CONTROLLED_CPU_MODEL_RUN',blockers:Object.freeze(blockers),leewayGpuAdapterUsed:false,physicalGpuAccelerationAllowed:false,canonicalInferenceVerified:false});
}
