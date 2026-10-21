// J-5 GPU receipt signature boundary. No authority is minted by this adapter.
// Canonical Veritas owner must provision the trusted issuer key and signing workflow.
import { verify as cryptoVerify, createPublicKey } from 'node:crypto';
const sha = v => typeof v === 'string' && /^[0-9a-f]{64}$/i.test(v);
const str = v => typeof v === 'string' && v.length > 0;
const fields = ['receiptId','deviceId','observationId','modelId','modelDigest','runtimeId','physicalGpu','providerId','commandDigest','outputDigest','formulaReceiptId','runtimeFabricReceiptId','ldwmdReceiptId','continuumReceiptId','deviceBridgeReceiptId','observedAt'];
export function verifyGpuReceipt({receipt, trustedIssuerPublicKeyPem, expected, admitReplay, now} = {}) {
  if (!receipt || !expected || !str(trustedIssuerPublicKeyPem) || typeof admitReplay!=='function'||!Number.isFinite(now)) throw Error('GPU_VERITAS_NOT_CONFIGURED');
  if (receipt.issuer !== 'CANONICAL_LEEWAY_VERITAS' || receipt.result !== 'PASS' || receipt.cpuFallbackUsed !== false || receipt.providerId !== 'LeeWay Edge GPU') throw Error('GPU_VERITAS_SCOPE_REJECTED');
  for (const field of fields) if (!str(receipt[field])) throw Error('GPU_VERITAS_FIELD_REQUIRED:'+field);
  if (![receipt.modelDigest,receipt.commandDigest,receipt.outputDigest].every(sha)) throw Error('GPU_VERITAS_HASH_REQUIRED');
  for (const field of ['receiptId','deviceId','observationId','modelId','modelDigest','runtimeId','physicalGpu','providerId','commandDigest','outputDigest']) if (!str(expected[field]) || expected[field] !== receipt[field]) throw Error('GPU_VERITAS_SUBJECT_MISMATCH:'+field);
  const observed=Date.parse(receipt.observedAt);
  if (!Number.isFinite(observed)||observed>now||now-observed>300000) throw Error('GPU_VERITAS_OBSERVATION_STALE');
  if (!str(receipt.signature) || !/^[A-Za-z0-9+/]+={0,2}$/.test(receipt.signature)) throw Error('GPU_VERITAS_SIGNATURE_REQUIRED');
  const payload = Object.fromEntries([...fields,'issuer','result','cpuFallbackUsed'].map(k=>[k,receipt[k]]));
  let ok = false;
  try { ok=cryptoVerify(null,Buffer.from(JSON.stringify(payload),'utf8'),createPublicKey(trustedIssuerPublicKeyPem),Buffer.from(receipt.signature,'base64')); } catch { throw Error('GPU_VERITAS_SIGNATURE_INVALID'); }
  if (!ok) throw Error('GPU_VERITAS_SIGNATURE_INVALID');
  if (admitReplay(receipt.receiptId,receipt.deviceId,receipt.commandDigest,receipt.outputDigest)!==true) throw Error('GPU_VERITAS_REPLAY_OR_ADMISSION_UNVERIFIED');
  return Object.freeze({verified:true,receiptId:receipt.receiptId,deviceId:receipt.deviceId,observationId:receipt.observationId,modelDigest:receipt.modelDigest,issuer:receipt.issuer});
}
