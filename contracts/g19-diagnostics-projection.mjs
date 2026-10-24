// G19 J-5: read-only diagnostic admission; no standalone verification authority.
const filled=x=>typeof x==='string'&&x.trim().length>0;
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const same=(a,b,keys)=>keys.every(k=>filled(a?.[k])&&a[k]===b?.[k]);
const authKeys=['formula','runtimeFabric','deviceBridge','ldwmd','continuum','veritas'];
export function projectG19Diagnostics({deviceId,physicalGpu,model,claim,authorization,evidence,verifyReceipt,verifyHardware,verifyAllocation}={}) {
 if(!filled(deviceId)||!filled(physicalGpu?.name)||!filled(physicalGpu?.manufacturer)||!filled(physicalGpu?.observationSource))throw Error('HARDWARE_PROVENANCE_REQUIRED');
 const base={deviceId,providerName:'LeeWay Edge GPU',providerManufacturer:'LeeWay Industries',physicalGpu:{name:physicalGpu.name,manufacturer:physicalGpu.manufacturer,observationSource:physicalGpu.observationSource},status:'UNVERIFIED',modelId:null,modelName:filled(model?.name)?model.name:null,modelDigest:null,allocatedVramBytes:null,observationId:null,receiptId:null,executionMode:'NOT_QUALIFIED',osNativeAdapter:false};
 if(!claim||!authorization||!evidence||!model)return Object.freeze(base);
 const subject={deviceId,observationId:claim.observationId,modelId:model.id,modelDigest:model.digest,physicalGpuName:physicalGpu.name,physicalGpuManufacturer:physicalGpu.manufacturer,physicalGpuSource:physicalGpu.observationSource};
 const aligned=filled(model.id)&&filled(model.name)&&sha(model.digest)&&filled(claim.observationId)&&claim.deviceId===deviceId&&claim.executionDeviceId===deviceId&&claim.modelId===model.id&&claim.artifactDigest===model.digest&&claim.physicalGpuName===physicalGpu.name&&claim.physicalGpuManufacturer===physicalGpu.manufacturer&&claim.physicalGpuSource===physicalGpu.observationSource&&same(evidence,subject,['deviceId','observationId','modelId','modelDigest','physicalGpuName','physicalGpuManufacturer','physicalGpuSource'])&&filled(evidence.receiptId)&&evidence.result==='PASS'&&authKeys.every(k=>authorization[k]===true)&&claim.gpuCommandsVerified===true&&claim.inferenceOutputVerified===true&&claim.cpuFallbackUsed===false;
 if(!aligned||typeof verifyReceipt!=='function'||typeof verifyHardware!=='function')return Object.freeze(base);
 const hardwareEvidence=evidence.hardware;
 if(!hardwareEvidence||!filled(hardwareEvidence.receiptId)||!sha(hardwareEvidence.sha256)||!same(hardwareEvidence,subject,['deviceId','observationId','physicalGpuName','physicalGpuManufacturer','physicalGpuSource']))return Object.freeze(base);
 if(verifyHardware(hardwareEvidence,subject,physicalGpu)!==true||verifyReceipt(evidence,claim,authorization,subject,physicalGpu)!==true)return Object.freeze(base);
 let allocatedVramBytes=null;
 const m=evidence.memory;
 if(m&&Number.isSafeInteger(m.allocatedBytes)&&m.allocatedBytes>=0&&Number.isSafeInteger(m.capacityBytes)&&m.capacityBytes>0&&m.allocatedBytes<=m.capacityBytes&&filled(m.allocationId)&&filled(m.leaseId)&&filled(m.receiptId)&&sha(m.sha256)&&filled(m.observedAt)&&m.source==='LDWMD'&&same(m,subject,['deviceId','observationId','modelId','modelDigest','physicalGpuName'])&&claim.allocatedVramBytes===m.allocatedBytes&&typeof verifyAllocation==='function'&&verifyAllocation(m,subject,physicalGpu)===true){allocatedVramBytes=m.allocatedBytes;}
 return Object.freeze({...base,status:'EVIDENCE_CALLBACK_ACCEPTED',modelId:model.id,modelDigest:model.digest,observationId:claim.observationId,receiptId:evidence.receiptId,executionMode:'LEEWAY_MANAGED_PHYSICAL_GPU',allocatedVramBytes});
}
