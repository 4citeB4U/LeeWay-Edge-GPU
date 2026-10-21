import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {verifyGpuReceipt} from './g19-gpu-veritas-gate.mjs';
const kp=generateKeyPairSync('ed25519');
const names='receiptId deviceId observationId modelId modelDigest runtimeId physicalGpu providerId commandDigest outputDigest formulaReceiptId runtimeFabricReceiptId ldwmdReceiptId continuumReceiptId deviceBridgeReceiptId observedAt'.split(' ');
function fixture(){const time=Date.now();const r={};for(const n of names)r[n]=n+'-one';for(const n of ['modelDigest','commandDigest','outputDigest'])r[n]='ab'.repeat(32);r.observedAt=new Date(time-100).toISOString();r.providerId='LeeWay Edge GPU';r.issuer='CANONICAL_LEEWAY_VERITAS';r.result='PASS';r.cpuFallbackUsed=false;const payload=Object.fromEntries([...names,'issuer','result','cpuFallbackUsed'].map(n=>[n,r[n]]));r.signature=sign(null,Buffer.from(JSON.stringify(payload)),kp.privateKey).toString('base64');const expected=Object.fromEntries(['receiptId','deviceId','observationId','modelId','modelDigest','runtimeId','physicalGpu','providerId','commandDigest','outputDigest'].map(n=>[n,r[n]]));return {receipt:r,expected,admitReplay:()=>true,now:time,trustedIssuerPublicKeyPem:kp.publicKey.export({type:'spki',format:'pem'})};}
test('fixture signature valid, without live authority claim',()=>assert.equal(verifyGpuReceipt(fixture()).verified,true));
test('no trusted issuer fails closed',()=>{const x=fixture();delete x.trustedIssuerPublicKeyPem;assert.throws(()=>verifyGpuReceipt(x),/NOT_CONFIGURED/)});
test('tampered command evidence fails',()=>{const x=fixture();x.receipt.commandDigest='cd'.repeat(32);assert.throws(()=>verifyGpuReceipt(x),/SUBJECT_MISMATCH:commandDigest/)});
test('invented Runtime Fabric receipt fails',()=>{const x=fixture();x.receipt.runtimeFabricReceiptId='fake';assert.throws(()=>verifyGpuReceipt(x),/SIGNATURE_INVALID/)});
test('wrong device identity fails',()=>{const x=fixture();x.expected.deviceId='other';assert.throws(()=>verifyGpuReceipt(x),/SUBJECT_MISMATCH/)});
test('CPU fallback fails',()=>{const x=fixture();x.receipt.cpuFallbackUsed=true;assert.throws(()=>verifyGpuReceipt(x),/SCOPE_REJECTED/)});

test('a different signed legacy command cannot satisfy expected current command',()=>{
 const x=fixture();x.expected.commandDigest='cd'.repeat(32);
 assert.throws(()=>verifyGpuReceipt(x),/SUBJECT_MISMATCH:commandDigest/);
});
test('a different signed legacy output cannot satisfy expected current readback',()=>{
 const x=fixture();x.expected.outputDigest='ef'.repeat(32);
 assert.throws(()=>verifyGpuReceipt(x),/SUBJECT_MISMATCH:outputDigest/);
});

test('legacy signed GPU receipt requires durable replay admission and rejects a second use',()=>{
 const x=fixture(),used=new Set();
 x.admitReplay=(receiptId)=>{if(used.has(receiptId))return false;used.add(receiptId);return true;};
 assert.equal(verifyGpuReceipt(x).verified,true);
 assert.throws(()=>verifyGpuReceipt(x),/REPLAY_OR_ADMISSION_UNVERIFIED/);
 assert.equal(used.size,1);
});
test('legacy signed receipt cannot consume replay ID on invalid signature',()=>{
 const x=fixture();let admitted=0;
 x.admitReplay=()=>{admitted++;return true;};x.receipt.runtimeFabricReceiptId='fabric-spoof';
 assert.throws(()=>verifyGpuReceipt(x),/SIGNATURE_INVALID/);
 assert.equal(admitted,0);
});
test('legacy signed receipt cannot be accepted after observation expires',()=>{
 const x=fixture();x.now+=300001;
 assert.throws(()=>verifyGpuReceipt(x),/OBSERVATION_STALE/);
});
test('legacy signed receipt requires expected receipt identity and replay custodian',()=>{
 const a=fixture();delete a.expected.receiptId;
 assert.throws(()=>verifyGpuReceipt(a),/SUBJECT_MISMATCH:receiptId/);
 const b=fixture();delete b.admitReplay;
 assert.throws(()=>verifyGpuReceipt(b),/NOT_CONFIGURED/);
});
