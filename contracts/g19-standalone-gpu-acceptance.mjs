// G19 J-5: separate LeeWay compute-interface verification from OS-visible GPU independence.
// This classifier is NOT a device installer or an acceptance certificate.
const validText=x=>typeof x==='string'&&x.trim().length>0;
export function assessStandaloneGpu(e={}) {
 const checks=[];
 const check=(name,ok)=>{if(!ok)checks.push(name);};
 check('LEEWAY_DISPATCHER_EXECUTION_REQUIRED',e.leewayDispatcher?.realGpuRun===true&&e.leewayDispatcher?.resultCompared===true&&e.leewayDispatcher?.cpuFallbackUsed===false);
 check('HARDWARE_PROVENANCE_REQUIRED',validText(e.backend?.api)&&validText(e.backend?.physicalAdapter)&&e.backend?.hardwareBacked===true);
 const componentPass=checks.length===0;
 const separate=[];
 const requireSeparate=(name,ok)=>{if(!ok)separate.push(name);};
 requireSeparate('LEEWAY_OS_ADAPTER_ENUMERATION_MISSING',e.osAdapter?.isSeparatelyEnumerated===true&&validText(e.osAdapter?.stableIdentifier));
 requireSeparate('LEEWAY_OWN_PROVIDER_MISSING',e.provider?.leeWayOwned===true&&e.provider?.loadedAndBound===true&&validText(e.provider?.binaryDigest));
 requireSeparate('INDEPENDENT_DISPATCH_AND_READBACK_MISSING',e.osAdapter?.submittedThroughLeeWayAdapter===true&&e.osAdapter?.readbackMatched===true);
 requireSeparate('NATIVE_DRIVER_OR_ICD_QUALIFICATION_MISSING',e.provider?.nativeDriverOrIcdQualified===true);
 requireSeparate('CANONICAL_AUTHORITY_MISSING',e.authority?.requestScopedFormulaAndRuntime===true&&e.authority?.canonicalVeritasReceipt===true);
 return Object.freeze({componentInterface:componentPass?'PASS':'BLOCKED',componentBlockers:Object.freeze(checks),standaloneGpu:componentPass&&separate.length===0?'READY_FOR_INDEPENDENT_ACCEPTANCE':'NOT_VERIFIED',standaloneBlockers:Object.freeze(separate),isOsNativeStandaloneGpuVerified:false});
}
