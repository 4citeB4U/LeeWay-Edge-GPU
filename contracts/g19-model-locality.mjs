// G19 J-5 revised: device locality admission, NOT actual inference qualification.
const valid=x=>typeof x==='string'&&x.trim().length>0;
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x)&&!/^(.)\1{63}$/i.test(x);
const localSource=new Set(['DEVICE_LOCAL_APP','DEVICE_LOCAL_RUNTIME']);
export function admitLocalModelClaim(claim,verifyEvidence){
 if(!claim||!valid(claim.deviceId)||!valid(claim.modelId)||!valid(claim.runtime)||!valid(claim.executionDeviceId))throw Error('MODEL_IDENTITY_INCOMPLETE');
 if(claim.executionDeviceId!==claim.deviceId)throw Error('REMOTE_MODEL_NOT_DEVICE_LOCAL');
 if(!localSource.has(claim.inventorySource)||!localSource.has(claim.executionSource))throw Error('MODEL_SOURCE_NOT_ALLOWLISTED');
 if(!sha(claim.artifactDigest))throw Error('MODEL_ARTIFACT_DIGEST_REQUIRED');
 if(!valid(claim.deviceModelObservationId)||!valid(claim.runtimeEvidenceId)||!valid(claim.observationSubjectId)||claim.observationSubjectId!==claim.deviceId)throw Error('MODEL_OBSERVATION_SUBJECT_MISMATCH');
 const e=claim.localityEvidence;
 if(!e||!valid(e.receiptId)||e.receiptId!==claim.runtimeEvidenceId||!sha(e.sha256)||e.deviceId!==claim.deviceId||e.modelId!==claim.modelId||e.artifactDigest!==claim.artifactDigest||e.runtime!==claim.runtime||e.observationId!==claim.deviceModelObservationId)throw Error('MODEL_LOCALITY_RECEIPT_REQUIRED');
 if(typeof verifyEvidence!=='function'||verifyEvidence('deviceLocalModel',e,claim)!==true)throw Error('MODEL_LOCALITY_INDEPENDENT_VERIFICATION_REQUIRED');
 return Object.freeze({deviceId:claim.deviceId,modelId:claim.modelId,runtime:claim.runtime,artifactDigest:claim.artifactDigest,observationId:claim.deviceModelObservationId,locality:'INDEPENDENT_EVIDENCE_CALLBACK_ACCEPTED_NOT_GPU_EXECUTION_VERIFIED'});
}
