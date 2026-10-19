// Review-only schema coverage diagnostic; NEVER a cryptographic verifier or admission gate.
import {readFileSync} from 'node:fs';
const proposal=JSON.parse(readFileSync(new URL('./gpu-grant-review.json',import.meta.url),'utf8'));
const required=Object.freeze(proposal.reviewRequirements.requiredSignedClaims);
const authorityNames=Object.freeze(proposal.reviewRequirements.requiredAuthorities);
export const GPU_GRANT_REVIEW_STATE='UNRATIFIED_REVIEW_ONLY';

export function assessGpuGrantShape({signedClaims=[],observedClaims={},authorityEvidence={},externalClient=false,userOptedIn=false}={}){
 // signedClaims is an inventory assertion, not proof of which bytes were signed.
 // authorityEvidence is likewise untrusted test input. Neither may activate execution.
 const inventory=Array.isArray(signedClaims)?new Set(signedClaims.filter(x=>typeof x==='string')):new Set();
 const missingSignedClaims=required.filter(field=>!inventory.has(field));
 const missingClaimValues=required.filter(field=>{
  const v=observedClaims?.[field];return v===null||v===undefined||(typeof v==='string'&&!v.trim());
 });
 const missingAuthorityEvidence=authorityNames.filter(name=>authorityEvidence?.[name]!=='VERIFIED_BY_INDEPENDENT_OWNER');
 const lifetime=Number.isSafeInteger(observedClaims?.issuedAtMs)&&Number.isSafeInteger(observedClaims?.expiresAtMs)
   &&observedClaims.expiresAtMs>observedClaims.issuedAtMs
   &&observedClaims.expiresAtMs-observedClaims.issuedAtMs<=120000;
 const externalEnrollmentOk=!externalClient || Boolean(observedClaims?.clientEnrollmentId&&observedClaims?.ownerApprovalId);
 const inventoryComplete=missingSignedClaims.length===0 && missingClaimValues.length===0 &&
  lifetime && externalEnrollmentOk && missingAuthorityEvidence.length===0;
 return Object.freeze({
  schema:GPU_GRANT_REVIEW_STATE,
  reviewObservation:inventoryComplete?'REVIEW_INVENTORY_COMPLETE_BUT_UNTRUSTED':'REVIEW_INVENTORY_INCOMPLETE',
  missingSignedClaims,missingClaimValues,missingAuthorityEvidence,
  lifetimeWithinProposedLimit:lifetime,externalEnrollmentPresent:externalEnrollmentOk,
  userOptedIn:userOptedIn===true,
  cryptographicSignatureVerified:false,
  canonicalIssuerVerified:false,
  independentlySignedStageReceiptsVerified:false,
  productionAdmission:'BLOCKED',
  mayDispatchGpu:false,
  warning:'Inventory claims are caller supplied and cannot constitute canonical authority'
 });
}
export function legacyWireReview(kind='bridgeSixFieldOrder'){
 const signedClaims=proposal.legacy[kind];
 if(!Array.isArray(signedClaims))throw Error('UNKNOWN_LEGACY_GRANT_WIRE');
 return assessGpuGrantShape({signedClaims});
}
export function readGpuGrantReviewRequirements(){
 return Object.freeze({state:GPU_GRANT_REVIEW_STATE,requiredSignedClaims:[...required],
 requiredAuthorities:[...authorityNames]});
}
