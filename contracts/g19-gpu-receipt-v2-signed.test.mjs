import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {verifyGpuReceiptV2 as verify} from './g19-gpu-receipt-v2.mjs';
const kp=generateKeyPairSync('ed25519'),H='ab'.repeat(32),time=100000;
const identity='requestId sessionId requestHash modelSha256 tokenizerSha256 implementationSha256 resultHash leaseId formulaReceiptSha256 ldWmdReceiptSha256 continuumReceiptSha256 postReceiptSha256'.split(' ');
function fixture(){const b=Object.fromEntries(identity.map(k=>[k,k.endsWith('Hash')||k.toLowerCase().includes('sha256')?H:k+'-1']));const subject={...b,deviceId:'pc',observationId:'ob-1',adapterId:'dxgi-1',physicalGpuManufacturer:'NVIDIA',physicalGpuSource:'DXGI',modelId:'gemma4',runtimeId:'wgsl',providerId:'LeeWay Edge GPU',cpuFallbackUsed:false,commandDigest:H,outputDigest:H};const authority=Object.fromEntries('formulaReceiptId runtimeFabricReceiptId ldwmdReceiptId continuumReceiptId deviceBridgeReceiptId'.split(' ').map(k=>[k,k+'-1']));const envelope={schema:'LEEWAY.GPU.VERITAS.v2',algorithm:'Ed25519',issuer:'CANONICAL_LEEWAY_VERITAS',keyId:'test',receiptId:'r1',issuedAtMs:time-100,expiresAtMs:time+100,status:'PASS',subject,authority};const msg=JSON.stringify({domain:'LEEWAY.GPU.VERITAS.v2',...envelope});envelope.signature=sign(null,Buffer.from(msg),kp.privateKey).toString('base64');const expected=Object.fromEntries('deviceId observationId adapterId physicalGpuManufacturer physicalGpuSource requestId sessionId modelId modelSha256 runtimeId'.split(' ').map(k=>[k,subject[k]]));return {envelope,expected,executionBinding:b,trustedKeys:{test:kp.publicKey.export({type:'spki',format:'pem'})},verifyUpstream:()=>true,admitReplay:()=>true,now:time};}
test('synthetic signed correlated receipt admitted with no canonical claim',()=>assert.match(verify(fixture()).status,/NOT_CANONICAL/));
test('different request hash rejected',()=>{const x=fixture();x.executionBinding.requestHash='cd'.repeat(32);assert.throws(()=>verify(x),/BINDING_MISMATCH/)});
test('different tokenizer rejected',()=>{const x=fixture();x.envelope.subject.tokenizerSha256='cd'.repeat(32);assert.throws(()=>verify(x),/BINDING_MISMATCH/)});
test('different adapter rejected',()=>{const x=fixture();x.expected.adapterId='other';assert.throws(()=>verify(x),/SUBJECT_MISMATCH/)});
test('upstream denial rejected',()=>{const x=fixture();x.verifyUpstream=()=>false;assert.throws(()=>verify(x),/UPSTREAM_RECEIPTS_UNVERIFIED/)});
test('tampered authority ID rejected',()=>{const x=fixture();x.envelope.authority.runtimeFabricReceiptId='fabric-fake';assert.throws(()=>verify(x),/SIGNATURE_INVALID/)});
test('expired receipt rejected',()=>{const x=fixture();x.now=time+101;assert.throws(()=>verify(x),/EXPIRED/)});
test('replay rejected',()=>{const x=fixture();x.admitReplay=()=>false;assert.throws(()=>verify(x),/REPLAYED/)});

test('wrong expected runtime cannot borrow a valid signed GPU receipt',()=>{
 const x=fixture();x.expected.runtimeId='other-runtime';
 assert.throws(()=>verify(x),/EXPECTED_SUBJECT_MISMATCH:runtimeId/);
});
test('a host atomic check-and-consume admits once, then rejects signed replay',()=>{
 const x=fixture(),seen=new Set();
 x.admitReplay=(id,req)=>{const key=id+':'+req;if(seen.has(key))return false;seen.add(key);return true;};
 assert.match(verify(x).status,/NOT_CANONICAL/);
 assert.throws(()=>verify(x),/REPLAYED_OR_ADMISSION_UNVERIFIED/);
 assert.equal(seen.size,1);
});
test('tampered signatures cannot consume the durable replay identifier',()=>{
 const x=fixture();let count=0;
 x.admitReplay=()=>{count++;return true;};
 x.envelope.authority.runtimeFabricReceiptId='tampered';
 assert.throws(()=>verify(x),/SIGNATURE_INVALID/);
 assert.equal(count,0);
});
test('host replay callback is mandatory even with a valid signature',()=>{
 const x=fixture();delete x.admitReplay;
 assert.throws(()=>verify(x),/VERIFIER_UNBOUND/);
});
