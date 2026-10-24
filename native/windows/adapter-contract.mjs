/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.NATIVE.WINDOWS.ADAPTER_DISCOVERY
TAG: LEEWAY_OS_GPU_RECOGNITION_CORRELATION_V2
WHO: Creator-authorized LeeWay GPU engineering.
WHAT: Distinguish PnP naming from actual independent Windows GPU enumeration.
WHY: A friendly name, service, or software renderer DLL cannot certify WDDM.
WHERE: native/windows/adapter-contract.mjs. WHEN: 2026-10-24.
HOW: Correlate PnP, VideoController, running LeeWay driver, and DXGI LUID.
AUTHORITY: Diagnostic gate only; Runtime/Veritas owns execution admission.
LICENSE: Existing LeeWay terms.
*/
const list=value=>value==null?[]:Array.isArray(value)?value:[value];
const valid=value=>typeof value==='string'&&value.trim().length>0;
const equal=(a,b)=>valid(a)&&valid(b)&&a.toLowerCase()===b.toLowerCase();

export function classifyWindowsAdapter(observation){
 if(!observation||typeof observation!=='object')throw Error('WINDOWS_ADAPTER_OBSERVATION_REQUIRED');
 const pnp=list(observation.pnp),video=list(observation.video);
 const services=list(observation.services),dxgi=list(observation.dxgi);
 const matches=pnp.filter(d=>/leeway/i.test(d?.FriendlyName??''));
 const correlated=matches.filter(d=>
  d.Status==='OK'&&valid(d.InstanceId)&&video.some(v=>
   equal(v.PNPDeviceID,d.InstanceId)&&/leeway/i.test(v.Name??'')&&valid(v.DriverVersion)));
 const recognized=correlated.filter(d=>
  services.some(s=>/leeway/i.test(s?.Name??'')&&
    String(s.State).toLowerCase()==='running' &&
    valid(s.PathName)&&/\.sys(?:\s|$|")/i.test(s.PathName)&&
    equal(s.PNPDeviceID,d.InstanceId)) &&
  dxgi.some(x=>x.NativeMapping===true&&equal(x.PNPDeviceID,d.InstanceId)&&
    valid(x.AdapterLuid)&&/leeway/i.test(x.Description??'')));
 const nativeRecognized=recognized.length>0;
 return Object.freeze({
  classification:nativeRecognized?'WINDOWS_DXGI_ENUMERATED_UNQUALIFIED':
    correlated.length?'WINDOWS_PNP_VIDEO_ONLY_NOT_DXGI':'LEEWAY_COMPUTE_ENGINE_NOT_NATIVE_GPU',
  nativeRecognized,
  computeVerified:false, diagnosticsNativeGpuEligible:false,
  matchedPnP:matches.length,correlatedVideo:correlated.length,
  correlatedDxgiAndDriver:recognized.length,
  recognizedAdapterLuid:nativeRecognized?
    dxgi.find(x=>equal(x.PNPDeviceID,recognized[0].InstanceId))?.AdapterLuid:null,
  recognizedDeviceInstanceId:nativeRecognized?recognized[0].InstanceId:null,
  reason:nativeRecognized?'INDEPENDENT_D3D_COMMAND_SUBMISSION_AND_READBACK_REQUIRED':
   correlated.length?'WDDM_DRIVER_SERVICE_AND_DXGI_CORRELATION_REQUIRED':
    'WINDOWS_DISPLAY_AND_VIDEO_CONTROLLER_CORRELATION_REQUIRED'
 });
}
export function qualifyNativeCompute(discovery,verified){
 if(!discovery?.nativeRecognized)return {qualified:false,reason:'DXGI_NATIVE_ENUMERATION_REQUIRED'};
 if(verified?.source!=='independent-native-runtime'||
    !equal(verified?.deviceInstanceId,discovery.recognizedDeviceInstanceId)||
    !equal(verified?.dxgiInstanceId,discovery.recognizedDeviceInstanceId)||
    !equal(verified?.adapterLuid,discovery.recognizedAdapterLuid)||
    verified?.commandSubmission!==true||
    verified?.readbackMatchesReference!==true)
  return {qualified:false,reason:'INDEPENDENT_NATIVE_COMPUTE_EVIDENCE_REQUIRED'};
 return {qualified:true,reason:'DISCOVERY_AND_RUNTIME_EVIDENCE_PRESENT_REQUIRES_VERITAS'};
}
