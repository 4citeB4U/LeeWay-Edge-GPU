// G19 J-5 proposed versioned envelope for owner-issued Veritas receipts.
// This consumer never mints trusted keys or substitutes for canonical authority checks.
import {verify as verifySignature,createPublicKey} from 'node:crypto';
const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const word=x=>typeof x==='string'&&x.trim().length>0;
const hexFields=['requestHash','modelSha256','tokenizerSha256','implementationSha256','resultHash','formulaReceiptSha256','ldWmdReceiptSha256','continuumReceiptSha256','postReceiptSha256','commandDigest','outputDigest'];
const identityFields=['requestId','sessionId','requestHash','modelSha256','tokenizerSha256','implementationSha256','resultHash','leaseId','formulaReceiptSha256','ldWmdReceiptSha256','continuumReceiptSha256','postReceiptSha256','commandDigest','outputDigest'];
export function verifyGpuReceiptV2({envelope,executionBinding,expected,trustedKeys,verifyUpstream,admitReplay,now}={}){
 if(!envelope||!executionBinding||!expected||!trustedKeys||typeof verifyUpstream!=='function'||typeof admitReplay!=='function'||!Number.isFinite(now))throw Error('G19_VERIFIER_UNBOUND');
 const {subject,authority,signature}=envelope;
 if(envelope.schema!=='LEEWAY.GPU.VERITAS.v2'||envelope.algorithm!=='Ed25519'||envelope.issuer!=='CANONICAL_LEEWAY_VERITAS'||!word(envelope.keyId)||!word(envelope.receiptId)||!subject||!authority||!word(signature))throw Error('G19_RECEIPT_SCHEMA_INVALID');
 if(!word(trustedKeys[envelope.keyId])||envelope.status!=='PASS'||subject.providerId!=='LeeWay Edge GPU'||subject.cpuFallbackUsed!==false||!word(subject.deviceId)||!word(subject.observationId)||!word(subject.adapterId)||!word(subject.physicalGpuManufacturer)||!word(subject.physicalGpuSource))throw Error('G19_RECEIPT_SUBJECT_INVALID');
 for(const k of identityFields){if(!word(executionBinding[k])||subject[k]!==executionBinding[k])throw Error('G19_REQUEST_BINDING_MISMATCH:'+k)}
 for(const k of ['deviceId','observationId','adapterId','physicalGpuManufacturer','physicalGpuSource','requestId','sessionId','modelId','modelSha256','runtimeId','commandDigest','outputDigest'])if(!word(expected[k])||subject[k]!==expected[k])throw Error('G19_EXPECTED_SUBJECT_MISMATCH:'+k);
 for(const k of hexFields)if(!hash(subject[k]))throw Error('G19_DIGEST_INVALID:'+k);
 if(!hash(subject.commandDigest)||!hash(subject.outputDigest)||!word(subject.modelId)||!word(subject.runtimeId)||!word(authority.formulaReceiptId)||!word(authority.runtimeFabricReceiptId)||!word(authority.ldwmdReceiptId)||!word(authority.continuumReceiptId)||!word(authority.deviceBridgeReceiptId))throw Error('G19_AUTHORITY_FIELDS_MISSING');
 if(!Number.isSafeInteger(envelope.issuedAtMs)||!Number.isSafeInteger(envelope.expiresAtMs)||envelope.issuedAtMs>now||envelope.expiresAtMs<=now||envelope.expiresAtMs<=envelope.issuedAtMs||envelope.expiresAtMs-envelope.issuedAtMs>300000)throw Error('G19_RECEIPT_EXPIRED_OR_INVALID');
 // Replay nonce admission is only allowed after signature and upstream verification.
 // Explicit ordered serialization is a protocol candidate; canonical issuer must adopt it before production.
 const message=JSON.stringify({domain:'LEEWAY.GPU.VERITAS.v2',schema:envelope.schema,algorithm:envelope.algorithm,issuer:envelope.issuer,keyId:envelope.keyId,receiptId:envelope.receiptId,issuedAtMs:envelope.issuedAtMs,expiresAtMs:envelope.expiresAtMs,status:envelope.status,subject,authority});
 let valid=false;try{valid=verifySignature(null,Buffer.from(message,'utf8'),createPublicKey(trustedKeys[envelope.keyId]),Buffer.from(signature,'base64'));}catch{throw Error('G19_RECEIPT_SIGNATURE_INVALID')}
 if(!valid)throw Error('G19_RECEIPT_SIGNATURE_INVALID');
 if(verifyUpstream(authority,subject,executionBinding)!==true)throw Error('G19_UPSTREAM_RECEIPTS_UNVERIFIED');
 // This host-bound callback MUST atomically check and consume the signed receipt ID.
 if(admitReplay(envelope.receiptId,subject.requestId,subject,authority)!==true)throw Error('G19_RECEIPT_REPLAYED_OR_ADMISSION_UNVERIFIED');
 return Object.freeze({status:'SIGNATURE_AND_CALLBACK_ACCEPTED_NOT_CANONICAL',receiptId:envelope.receiptId,requestId:subject.requestId,deviceId:subject.deviceId,observationId:subject.observationId,modelSha256:subject.modelSha256});
}
