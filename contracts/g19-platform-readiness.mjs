// G19 J-5: independent platform readiness classification, no fabricated acceptance.
const text=x=>typeof x==='string'&&x.trim().length>0;
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const req=['formula','runtimeFabric','deviceBridge','ldwmd','continuum','veritas'];
export function assessG19Readiness(a={}) {
 if(!['WINDOWS','ANDROID'].includes(a.platform)||!text(a.deviceId)||!text(a.physicalGpu?.name)||!text(a.physicalGpu?.manufacturer))throw Error('DEVICE_IDENTITY_REQUIRED');
 const failures=[];
 if(a.platform==='WINDOWS'&&a.nativeBuild?.wdkPresent!==true)failures.push('WINDOWS_WDK_MISSING');
 if(a.platform==='ANDROID'&&a.compute?.vulkanLibraryPresent!==true)failures.push('ANDROID_VULKAN_NOT_DETECTED');
 if(a.platform==='ANDROID'&&a.model?.inventorySource==='PAIRED_PC')failures.push('PHONE_MODEL_REMOTE_NOT_LOCAL');
 if(!text(a.model?.id)||!sha(a.model?.digest)||a.model?.executionDeviceId!==a.deviceId)failures.push('MODEL_LOCALITY_UNPROVEN');
 if(a.compute?.dispatchReadbackVerified!==true||a.compute?.cpuFallbackUsed!==false)failures.push('GPU_MODEL_EXECUTION_UNVERIFIED');
 if(req.some(x=>a.authority?.[x]?.verified!==true||!text(a.authority?.[x]?.receiptId)))failures.push('CANONICAL_AUTHORITY_UNBOUND');
 if(a.diagnostics?.deviceId!==a.deviceId||!text(a.diagnostics?.observationId)||a.diagnostics?.observationId!==a.digitalBrain?.observationId)failures.push('BRAIN_DIAGNOSTICS_UNBOUND');
 if(a.veritas?.canonicalVerified!==true||!text(a.veritas?.receiptId)||a.veritas?.deviceId!==a.deviceId||a.veritas?.modelDigest!==a.model?.digest)failures.push('CANONICAL_GPU_VERITAS_UNVERIFIED');
 // A readiness checklist never has authority to assert final PASS. Final approval belongs to owner-qualified verifier.
 return Object.freeze({platform:a.platform,deviceId:a.deviceId,physicalGpu:a.physicalGpu.name,status:failures.length?'BLOCKED':'READY_FOR_INDEPENDENT_ACCEPTANCE',qualifiedInference:false,osNativeLeeWayGpu:false,blockers:Object.freeze(failures)});
}
