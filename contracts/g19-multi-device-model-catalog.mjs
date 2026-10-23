// G19 J-5: non-executing device-specific model inventory boundary.
// Never admit a system component or paired-PC entry as usable device-local weights.
const str=x=>typeof x==='string'&&x.trim().length>0;
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
export function classifyModelCandidate({deviceId,deviceKind,source,modelId,modelSha256,backend,localWeightsObserved,entrypointVerified,accessAuthorized,physicalGpuExecutionVerified}={}){
 if(!str(deviceId)||!['WINDOWS','ANDROID'].includes(deviceKind))throw Error('MODEL_DEVICE_UNBOUND');
 const allowed=['DEVICE_LOCAL','PAIRED_PC','SYSTEM_COMPONENT','REMOTE_API'];
 if(!allowed.includes(source))throw Error('MODEL_SOURCE_INVALID');
 const locality=source==='DEVICE_LOCAL'?'DEVICE_LOCAL_CANDIDATE':source==='PAIRED_PC'?'PAIRED_PC_REMOTE':source==='SYSTEM_COMPONENT'?'SYSTEM_COMPONENT_RESTRICTED_OR_UNKNOWN':'REMOTE_API';
 const verified=source==='DEVICE_LOCAL'&&str(modelId)&&sha(modelSha256)&&str(backend)&&localWeightsObserved===true&&entrypointVerified===true&&accessAuthorized===true;
 return Object.freeze({deviceId,deviceKind,source,locality,modelId:str(modelId)?modelId:null,backend:str(backend)?backend:null,deviceLocalRunnable:verified,physicalGpuModelInferenceQualified:verified&&physicalGpuExecutionVerified===true,reason:verified?'ENTRYPOINT_AND_MODEL_BYTES_VERIFIED':'MODEL_IDENTITY_OR_ACCESS_NOT_QUALIFIED'});
}
export function proposeRoute({fromDeviceId,target,ownerGrant}={}){
 if(!str(fromDeviceId)||!target||!str(target.deviceId))throw Error('ROUTE_IDENTITY_UNBOUND');
 if(target.deviceLocalRunnable!==true||ownerGrant?.requestScopedVerified!==true||ownerGrant?.targetDeviceId!==target.deviceId)return Object.freeze({admitted:false,reason:'TARGET_MODEL_OR_AUTHORITY_UNVERIFIED'});
 return Object.freeze({admitted:true,executionDeviceId:target.deviceId,remoteExecution:fromDeviceId!==target.deviceId,voiceIdentity:'UNMODIFIED',canonicalInferenceAccepted:false});
}
