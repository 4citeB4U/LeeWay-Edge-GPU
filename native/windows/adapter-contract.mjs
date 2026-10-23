// LeeWay native Windows adapter discovery admission; NOT a graphics driver.
const list=value=>value==null?[]:Array.isArray(value)?value:[value];
const valid=value=>typeof value==='string'&&value.length>0;
export function classifyWindowsAdapter(observation){
 if(!observation||typeof observation!=='object')throw Error('WINDOWS_ADAPTER_OBSERVATION_REQUIRED');
 const pnp=list(observation.pnp),video=list(observation.video);
 const candidates=pnp.filter(d=>/leeway/i.test(d?.FriendlyName??''));
 const correlated=candidates.filter(d=>d.Status==='OK'&&valid(d.InstanceId)&&video.some(v=>v.PNPDeviceID===d.InstanceId&&/leeway/i.test(v.Name??'')&&valid(v.DriverVersion)));
 const nativeRecognized=correlated.length>0;
 return Object.freeze({classification:nativeRecognized?'WINDOWS_DISPLAY_ENUMERATED_UNQUALIFIED':'LEEWAY_COMPUTE_ENGINE_NOT_NATIVE_GPU',nativeRecognized,computeVerified:false,diagnosticsNativeGpuEligible:false,matchedPnP:candidates.length,correlatedVideo:correlated.length,reason:nativeRecognized?'DXGI_D3D_COMMAND_SUBMISSION_AND_READBACK_REQUIRED':'WINDOWS_DISPLAY_AND_VIDEO_CONTROLLER_CORRELATION_REQUIRED'});
}
export function qualifyNativeCompute(discovery,verified){
 if(!discovery?.nativeRecognized)return {qualified:false,reason:'NATIVE_ENUMERATION_REQUIRED'};
 if(verified?.source!=='independent-native-runtime'||verified?.deviceInstanceId!==verified?.dxgiInstanceId||!valid(verified.deviceInstanceId)||verified?.commandSubmission!==true||verified?.readbackMatchesReference!==true)return {qualified:false,reason:'INDEPENDENT_NATIVE_COMPUTE_EVIDENCE_REQUIRED'};
 return {qualified:true,reason:'DISCOVERY_AND_RUNTIME_EVIDENCE_PRESENT_REQUIRES_VERITAS'};
}
