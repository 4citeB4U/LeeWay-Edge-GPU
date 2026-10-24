import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyGpuReceiptV2 as verify} from './g19-gpu-receipt-v2.mjs';
const base=()=>({executionBinding:{},expected:{},trustedKeys:{},verifyUpstream:()=>true,seenReceipt:()=>false,now:1000});
test('requires canonical configuration',()=>assert.throws(()=>verify({}),/G19_VERIFIER_UNBOUND/));
test('missing receipt fails closed',()=>assert.throws(()=>verify(base()),/G19_VERIFIER_UNBOUND/));
test('rejects untrusted issuer',()=>{const x=base();x.envelope={schema:'LEEWAY.GPU.VERITAS.v2',algorithm:'Ed25519',issuer:'FAKE',keyId:'fake',receiptId:'r1',subject:{},authority:{},signature:'AA=='};assert.throws(()=>verify(x),/G19_RECEIPT_SCHEMA_INVALID/)});
