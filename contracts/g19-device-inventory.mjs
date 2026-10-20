// G19 J-5 read-only parsing contract for Windows + Android hardware inventory.
// Provenance is observation only. Never infer compute dispatch or memory residency.
const clean=x=>typeof x==='string'?x.trim():'';
export function inventoryWindowsVideoControllers(records){
 if(!Array.isArray(records))throw Error('WINDOWS_GPU_RECORDS_REQUIRED');
 return Object.freeze(records.filter(x=>clean(x?.Name)).map(x=>Object.freeze({name:clean(x.Name),driverVersion:clean(x.DriverVersion)||null,source:'WIN32_VIDEOCONTROLLER',adapterRamReportedBytes:null,modelInferenceQualified:false,osNativeLeeWayGpu:false})));
}
export function inventoryAndroidGraphics({model,egl,vulkanLibraryPresent,glesInfo,androidSdk}={}){
 if(!clean(model)||!clean(egl))throw Error('ANDROID_DEVICE_IDENTITY_REQUIRED');
 const match=clean(glesInfo).match(/Adreno\s*\(TM\)\s*(\d+)/i);
 return Object.freeze({model:clean(model),gpuFamily:clean(egl),physicalGpuName:match?'Adreno '+match[1]:null,androidSdk:clean(String(androidSdk??''))||null,vulkanLibraryPresent:vulkanLibraryPresent===true,source:'ADB_GETPROP_AND_SYSTEM_LIBRARIES',vulkanComputeVerified:false,modelInferenceQualified:false,modelLocalityVerified:false});
}
