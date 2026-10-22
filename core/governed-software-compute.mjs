/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.GOVERNED_SOFTWARE_COMPUTE
TAG: LEEWAY.EDGE_GPU.G23.SOFTWARE_FULL_PIPELINE_CONSUMER
5WH:
WHAT = Bind existing software matrix engine to all canonical LeeWay governance stages.
WHY = G22 diagnostic admission bypasses Formula, LDWMD, Continuum and Veritas.
WHO = Creator-authorized LeeWay engineering; authority stays with existing owners.
WHERE = LeeWay-Edge-GPU/core/governed-software-compute.mjs
WHEN = 2026-10-22
HOW = Require host-origin provider callbacks, correlate exact request/output, fail closed.
LICENSE: MIT
ASSURANCE: Consumer contract only; injected test callbacks cannot certify production.
*/
import { createHash } from 'node:crypto';
import { cpuMatMulNode } from '../fallback/node-cpu.engine.mjs';

export const SOFTWARE_CAPABILITY = 'leeway.gpu.software.compute';
export const REQUIRED_HOST_OPERATIONS = Object.freeze([
  'verifyCanonicalHost', 'runtimeAuthorize', 'formulaEvaluate', 'formulaReplayVerify',
  'veritasPre', 'veritasPost', 'veritasVerify', 'ldwmdAcquire', 'ldwmdVerify', 'ldwmdRelease',
  'outputVerify', 'continuumStore', 'continuumReadback',
  'receiptAppend', 'receiptReadback', 'learningAdmit', 'learningReadback'
]);
const HEX = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { const error = new Error(code); error.code = code; throw error; };
const insist = (condition, code) => { if (!condition) fail(code); };
const same = (value, expected) => value === expected;
const bytesOf = typed => Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
const hasSharedBuffer = typed => typeof SharedArrayBuffer !== 'undefined' &&
  typed.buffer instanceof SharedArrayBuffer;
const present = value => typeof value === 'string' && ID.test(value);
function assertReceipt(reply, binding, code) {
  insist(reply && reply.status === 'PASS' &&
    same(reply.requestId, binding.requestId) &&
    same(reply.inputSha256, binding.inputSha256) &&
    present(reply.receiptId), code);
}
function checkMatrix(A, B, size) {
  insist(Number.isSafeInteger(size) && size >= 1 && size <= 2048,
    'G23_SOFTWARE_MATRIX_SIZE_INVALID');
  insist(A instanceof Float32Array && B instanceof Float32Array &&
    A.length === size * size && B.length === size * size &&
    !hasSharedBuffer(A) && !hasSharedBuffer(B) &&
    A.every(Number.isFinite) && B.every(Number.isFinite),
    'G23_SOFTWARE_MATRIX_INPUT_INVALID');
}
function hashInput(A, B, size) {
  const header = Buffer.alloc(4);
  header.writeUInt32LE(size, 0);
  return sha256(Buffer.concat([
    Buffer.from('LEEWAY.G23.SOFTWARE.MATMUL.v1\0'), header, bytesOf(A), bytesOf(B)
  ]));
}
function classifyOutcomeRisk(error, stage) {
  let code = null;
  if (stage.startsWith('LEARNING_')) code = 'G23_LEARNING_OUTCOME_RECONCILIATION_REQUIRED';
  else if (stage.startsWith('RECEIPT_')) code = 'G23_RECEIPT_OUTCOME_RECONCILIATION_REQUIRED';
  else if (stage.startsWith('CONTINUUM_')) code = 'G23_CONTINUUM_OUTCOME_RECONCILIATION_REQUIRED';
  if (!code) return error;
  const e = new Error(code);
  e.code = code;
  e.cause = error;
  return e;
}

/**
 * Consumer of the existing canonical providers, never an issuer or certificate.
 * host must be constructed and authenticated by Runtime Fabric, not from task data.
 */
export function createGovernedSoftwareCompute(host = {}) {
  insist(host && typeof host === 'object' && !Array.isArray(host),
    'G23_TRUSTED_HOST_INVALID');
  for (const key of REQUIRED_HOST_OPERATIONS) {
    insist(typeof host[key] === 'function', 'G23_HOST_BINDING_MISSING_' + key);
  }
  const bindings = Object.freeze(Object.fromEntries(
    REQUIRED_HOST_OPERATIONS.map(key => [key, host[key].bind(host)])
  ));

  async function execute(request, options = {}) {
    insist(request && typeof request === 'object' &&
      Object.keys(request).sort().join('|') ===
      ['A', 'B', 'requestId', 'size', 'sourceSha256'].sort().join('|') &&
      present(request.requestId) && HEX.test(request.sourceSha256 || ''),
      'G23_REQUEST_OR_SOURCE_PIN_INVALID');
    const { requestId, sourceSha256, size } = request;
    checkMatrix(request.A, request.B, size);
    insist(!options.signal?.aborted, 'G23_REQUEST_CANCELLED');
    const A = request.A.slice(), B = request.B.slice();
    const inputSha256 = hashInput(A, B, size);
    const allocationBytes = size * size * 4 * 3;
    insist(Number.isSafeInteger(allocationBytes) && allocationBytes > 0,
      'G23_HOST_MEMORY_BUDGET_INVALID');
    const binding = Object.freeze({
      requestId, inputSha256, sourceSha256, size, allocationBytes,
      capability: SOFTWARE_CAPABILITY, backend: 'LEEWAY_SOFTWARE_HOST_CPU',
      externalGpuProvider: false
    });
    let lease = null, stage = 'PREFLIGHT', output = null, resultSha256 = null;
    let released = false;
    let result, error;
    try {
      const pin = await bindings.verifyCanonicalHost(binding);
      insist(pin?.status === 'PASS' && pin.sourceSha256 === sourceSha256 &&
        pin.requestId === requestId && pin.capability === SOFTWARE_CAPABILITY,
        'G23_CANONICAL_HOST_SOURCE_UNQUALIFIED');

      const runtime = await bindings.runtimeAuthorize(binding);
      assertReceipt(runtime, binding, 'G23_RUNTIME_GRANT_UNVERIFIED');

      const formula = await bindings.formulaEvaluate({ ...binding, runtime });
      assertReceipt(formula, binding, 'G23_FORMULA_DECISION_UNVERIFIED');
      const replay = await bindings.formulaReplayVerify({ ...binding, runtime, formula });
      assertReceipt(replay, binding, 'G23_FORMULA_REPLAY_UNVERIFIED');

      const pre = await bindings.veritasPre({ ...binding, runtime, formula, replay });
      assertReceipt(pre, binding, 'G23_VERITAS_PRE_UNVERIFIED');
      const preProof = await bindings.veritasVerify({ ...binding, phase: 'PRE', receipt: pre });
      assertReceipt(preProof, binding, 'G23_VERITAS_PRE_SIGNATURE_UNVERIFIED');

      lease = await bindings.ldwmdAcquire({ ...binding, runtime, formula, pre });
      insist(lease && lease.status === 'PASS' && lease.requestId === requestId &&
        present(lease.leaseId) && lease.memoryKind === 'HOST_RAM' &&
        Number.isSafeInteger(lease.allocatedBytes) && lease.allocatedBytes >= allocationBytes,
        'G23_LDWMD_HOST_LEASE_UNVERIFIED');
      const verifiedLease = await bindings.ldwmdVerify({ ...binding, lease });
      assertReceipt(verifiedLease, binding, 'G23_LDWMD_LEASE_PROOF_UNVERIFIED');

      output = await cpuMatMulNode(A, B, size, {
        signal: options.signal,
        timeoutMs: options.timeoutMs ?? 30000,
        denyExternalProviders: true
      });
      insist(output instanceof Float32Array && output.length === size * size &&
        output.every(Number.isFinite), 'G23_LEEWAY_SOFTWARE_RESULT_INVALID');
      const outputSnapshot = output.slice();
      resultSha256 = sha256(bytesOf(outputSnapshot));

      const independent = await bindings.outputVerify({
        ...binding, output: outputSnapshot.slice(), resultSha256, lease
      });
      insist(independent?.status === 'PASS' && independent.requestId === requestId &&
        independent.resultSha256 === resultSha256 && present(independent.receiptId),
        'G23_INDEPENDENT_OUTPUT_PROOF_UNVERIFIED');

      stage = 'CONTINUUM_WRITE_STARTED';
      const stored = await bindings.continuumStore({
        ...binding, output: outputSnapshot.slice(), resultSha256, lease, independent
      });
      insist(stored?.status === 'PASS' && stored.requestId === requestId &&
        present(stored.recordId) && stored.resultSha256 === resultSha256,
        'G23_CONTINUUM_STORAGE_UNVERIFIED');
      const readback = await bindings.continuumReadback({ ...binding, stored });
      insist(readback?.recordId === stored.recordId &&
        (Buffer.isBuffer(readback.bytes) || readback.bytes instanceof Uint8Array) &&
        Buffer.compare(Buffer.from(readback.bytes), bytesOf(outputSnapshot)) === 0,
        'G23_CONTINUUM_BYTES_MISMATCH');
      stage = 'CONTINUUM_VERIFIED';

      const post = await bindings.veritasPost({
        ...binding, runtime, formula, replay, pre, lease, independent, stored, resultSha256
      });
      assertReceipt(post, binding, 'G23_VERITAS_POST_UNVERIFIED');
      const postProof = await bindings.veritasVerify({
        ...binding, phase: 'POST', receipt: post, resultSha256
      });
      assertReceipt(postProof, binding, 'G23_VERITAS_POST_SIGNATURE_UNVERIFIED');

      stage = 'RECEIPT_APPEND_STARTED';
      const receipt = await bindings.receiptAppend({
        ...binding, post, resultSha256, continuumRecordId: stored.recordId
      });
      assertReceipt(receipt, binding, 'G23_RECEIPT_APPEND_UNVERIFIED');
      const ledger = await bindings.receiptReadback({ ...binding, receipt, resultSha256 });
      assertReceipt(ledger, binding, 'G23_RECEIPT_CHAIN_READBACK_UNVERIFIED');
      stage = 'RECEIPT_VERIFIED';

      stage = 'LEARNING_ADMISSION_STARTED';
      const learning = await bindings.learningAdmit({ ...binding, receipt, ledger, resultSha256 });
      stage = 'LEARNING_ADMITTED';
      insist(learning?.status === 'PASS' && learning.requestId === requestId &&
        present(learning.eventId), 'G23_LEARNING_ADMISSION_UNVERIFIED');
      const learned = await bindings.learningReadback({ ...binding, learning, receipt, resultSha256 });
      insist(learned?.status === 'PASS' && learned.requestId === requestId &&
        learned.eventId === learning.eventId && learned.receiptId === receipt.receiptId &&
        learned.resultSha256 === resultSha256, 'G23_LEARNING_EXACT_READBACK_UNVERIFIED');
      stage = 'LEARNING_VERIFIED';
      result = Object.freeze({
        status: 'FULL_CHAIN_CONSUMER_CHECKS_PASS',
        productionAccepted: false, // Consumer cannot promote itself to production authority.
        independentProductionCertificate: false,
        requestId, inputSha256, resultSha256, continuumRecordId: stored.recordId,
        receiptId: receipt.receiptId, learningEventId: learning.eventId,
        backend: binding.backend, externalGpuProvider: false,
        output: outputSnapshot
      });
    } catch (cause) {
      error = classifyOutcomeRisk(cause, stage);
    } finally {
      if (lease) {
        try {
          const release = await bindings.ldwmdRelease({ ...binding, lease });
          insist(release?.status === 'PASS' && release.requestId === requestId &&
            release.leaseId === lease.leaseId && release.activeBytes === 0,
            'G23_LDWMD_RELEASE_UNVERIFIED');
          released = true;
        } catch (releaseError) {
          if (!error) error = releaseError;
        }
      }
      // No output may be released to callers after an unverified cleanup.
      if (!released && lease && !error) error = new Error('G23_LDWMD_RELEASE_UNVERIFIED');
    }
    if (error) throw error;
    return result;
  }
  return Object.freeze({ capability: SOFTWARE_CAPABILITY, execute });
}
