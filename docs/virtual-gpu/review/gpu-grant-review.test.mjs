import test from 'node:test';
import assert from 'node:assert/strict';
import {assessGpuGrantShape,legacyWireReview,readGpuGrantReviewRequirements} from './gpu-grant-review.mjs';
const spec=readGpuGrantReviewRequirements();
const now=Date.parse('2026-10-19T17:00:00Z');
const claims=Object.fromEntries(spec.requiredSignedClaims.map(k=>[k,k+'-review-fixture']));
claims.issuedAtMs=now;claims.expiresAtMs=now+45000;claims.maxMemoryBytes=1048576;
const allAuthority=Object.fromEntries(spec.requiredAuthorities.map(k=>[k,'VERIFIED_BY_INDEPENDENT_OWNER']));
const fixture=()=>({signedClaims:[...spec.requiredSignedClaims],observedClaims:{...claims},authorityEvidence:{...allAuthority},externalClient:true,userOptedIn:true});

test('actual six-field Bridge grant cannot meet proposed production claim inventory',()=>{
 const result=legacyWireReview();
 assert.equal(result.productionAdmission,'BLOCKED');
 for(const field of ['deviceId','capability','workloadHash','ownerApprovalId','issuedAtMs','audience','clientEnrollmentId'])
  assert.ok(result.missingSignedClaims.includes(field),field);
});
test('incompatible alternate eight-field grant also lacks production authority scope',()=>{
 const result=legacyWireReview('alternateRuntimeEightFieldOrder');
 assert.equal(result.productionAdmission,'BLOCKED');
 for(const field of ['capability','ownerApprovalId','workloadHash','audience'])assert.ok(result.missingSignedClaims.includes(field));
});
test('review tool has no unknown legacy mode or signer',()=>assert.throws(()=>legacyWireReview('unknown'),/UNKNOWN_LEGACY_GRANT_WIRE/));
test('missing signed device prevents complete inventory',()=>{
 const x=fixture();x.signedClaims=x.signedClaims.filter(k=>k!=='deviceId');
 assert.ok(assessGpuGrantShape(x).missingSignedClaims.includes('deviceId'));
});
test('missing signed capability or workload prevents complete inventory',()=>{
 const x=fixture();x.signedClaims=x.signedClaims.filter(k=>!['capability','workloadHash'].includes(k));
 assert.deepEqual(assessGpuGrantShape(x).missingSignedClaims.filter(k=>['capability','workloadHash'].includes(k)),['capability','workloadHash']);
});
test('overlong grant lifetime is rejected as inventory-policy mismatch',()=>{
 const x=fixture();x.observedClaims.expiresAtMs=now+3600000;
 assert.equal(assessGpuGrantShape(x).lifetimeWithinProposedLimit,false);
});
test('reverse or malformed expiration is invalid',()=>{
 const x=fixture();x.observedClaims.expiresAtMs=now-1;
 assert.equal(assessGpuGrantShape(x).lifetimeWithinProposedLimit,false);
});
test('external app enrollment requires explicit owner approval reference',()=>{
 const x=fixture();delete x.observedClaims.ownerApprovalId;
 assert.equal(assessGpuGrantShape(x).externalEnrollmentPresent,false);
});
test('unbound canonical Veritas remains missing even if every claim is present',()=>{
 const x=fixture();delete x.authorityEvidence.independentCanonicalVeritas;
 assert.ok(assessGpuGrantShape(x).missingAuthorityEvidence.includes('independentCanonicalVeritas'));
});
test('missing Learning Ledger readback remains missing',()=>{
 const x=fixture();delete x.authorityEvidence.canonicalLearningLedgerReadback;
 assert.ok(assessGpuGrantShape(x).missingAuthorityEvidence.includes('canonicalLearningLedgerReadback'));
});
test('user ON is not proof of grant or authorized GPU dispatch',()=>{
 const x=fixture();const r=assessGpuGrantShape(x);
 assert.equal(r.userOptedIn,true);
 assert.equal(r.productionAdmission,'BLOCKED');assert.equal(r.mayDispatchGpu,false);
});
test('even all caller-supplied perfect inventory labels never produce a canonical PASS',()=>{
 const r=assessGpuGrantShape(fixture());
 assert.equal(r.reviewObservation,'REVIEW_INVENTORY_COMPLETE_BUT_UNTRUSTED');
 assert.equal(r.canonicalIssuerVerified,false);
 assert.equal(r.cryptographicSignatureVerified,false);
 assert.equal(r.independentlySignedStageReceiptsVerified,false);
 assert.equal(r.productionAdmission,'BLOCKED');assert.equal(r.mayDispatchGpu,false);
});
test('spoofed owner markers still cannot promote a production decision',()=>{
 const x=fixture();x.authorityEvidence.independentCanonicalVeritas='VERIFIED_BY_INDEPENDENT_OWNER';
 assert.equal(assessGpuGrantShape(x).productionAdmission,'BLOCKED');
});
