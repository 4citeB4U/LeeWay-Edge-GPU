/* LeeWay software execution diagnostic. Uses the existing dispatcher and CPU
 * arithmetic through a Node worker host. This is not production authorization. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { HybridDispatcher } from '../../core/hybrid.dispatcher.js';
import { cpuTensorNode } from '../../fallback/node-cpu.engine.mjs';
import { TENSOR_OPERATION } from '../../dispatch/tensor-contract.mjs';

const args = process.argv.slice(2);
const evidenceIndex = args.indexOf('--evidence');
if (evidenceIndex < 0 || !args[evidenceIndex + 1]) throw Error('EVIDENCE_DIRECTORY_REQUIRED');
const evidenceDirectory = path.resolve(args[evidenceIndex + 1]);
fs.mkdirSync(evidenceDirectory, { recursive: true });
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceFiles = ['core/hybrid.dispatcher.js', 'control/gpu.controller.bridge.js',
  'dispatch/tensor-contract.mjs', 'fallback/cpu.worker.js', 'fallback/tensor-reference.mjs',
  'fallback/node-cpu.engine.mjs', 'fallback/node-cpu.worker.mjs', 'tests/virtual-gpu/software-only-acceptance.mjs'];
const sourceBefore = Object.fromEntries(sourceFiles.map(file => [file, digest(fs.readFileSync(path.join(root, file)))]));
const report = {
  schema: 'leeway.gpu.software-worker-diagnostic.v1', observedAt: new Date().toISOString(),
  outcome: 'RUNNING', host: { platform: process.platform, architecture: process.arch, node: process.version, logicalCpus: os.cpus().length },
  executionMode: 'INTENTIONAL_SOFTWARE_CPU', physicalGpuRequired: false, cloudGpuRequired: false,
  workload: 'MATMUL_BIAS_RELU_V1', sourceSha256: sourceBefore, variants: [], negativeChecks: [],
  guardScope: 'Main JavaScript fetch/WebSocket/WebGPU entry points and selected worker entry points; not an OS network or device-access trace.',
  authority: { runtimeFabric: 'NOT_BOUND', formula: 'NOT_EXECUTED', veritasPre: 'NOT_BOUND', ldwmd: 'NOT_BOUND',
    continuum: 'NOT_BOUND', veritasPost: 'NOT_BOUND', receiptLedger: 'NOT_WRITTEN', learningLedger: 'NOT_UPDATED' },
  controller: 'EXPLICIT_DIAGNOSTIC_ALLOWLIST_NOT_CANONICAL_ADMISSION',
  operatingSystemAdapter: 'NOT_REGISTERED_BY_THIS_RUN', performanceComparison: 'NOT_PERFORMED'
};
let cpuCalls = 0, gpuCalls = 0, networkAttempts = 0;
const restored = [];
function replace(object, key, descriptor) {
  const original = Object.getOwnPropertyDescriptor(object, key);
  Object.defineProperty(object, key, { configurable: true, ...descriptor });
  restored.push(() => original ? Object.defineProperty(object, key, original) : delete object[key]);
}
function exactIntegerReference(actual, input) {
  let mismatches = 0;
  for (let row = 0; row < input.m; row++) for (let col = 0; col < input.n; col++) {
    let sum = BigInt(input.bias[col]);
    for (let inner = input.k - 1; inner >= 0; inner--)
      sum += BigInt(input.A[row * input.k + inner]) * BigInt(input.B[inner * input.n + col]);
    const expected = input.activation === 'relu' && sum < 0n ? 0n : sum;
    if (actual[row * input.n + col] !== Number(expected)) mismatches++;
  }
  return { valid: mismatches === 0, method: 'INDEPENDENT_BIGINT_INTEGER_REFERENCE', mismatches, values: actual.length };
}
function fixture(m, k, n, seed, activation) {
  return { operation: TENSOR_OPERATION, m, k, n,
    A: Float32Array.from({ length: m * k }, (_, i) => ((i * 7 + seed) % 17) - 8),
    B: Float32Array.from({ length: k * n }, (_, i) => ((i * 11 + seed) % 13) - 6),
    bias: Float32Array.from({ length: n }, (_, i) => ((i + seed) % 7) - 3), activation };
}
let failure;
try {
  const networkDenied = () => { networkAttempts++; throw Error('DIAGNOSTIC_NETWORK_ENTRYPOINT_DENIED'); };
  replace(globalThis, 'fetch', { value: networkDenied });
  replace(globalThis, 'WebSocket', { value: networkDenied });
  if (globalThis.navigator) replace(globalThis.navigator, 'gpu', { get: () => { gpuCalls++; throw Error('DIAGNOSTIC_WEBGPU_ENTRYPOINT_DENIED'); } });
  const unavailableGpu = { run: async () => { gpuCalls++; throw Error('PHYSICAL_GPU_ROUTE_FORBIDDEN'); } };
  const dispatcher = new HybridDispatcher({ webgpu: unavailableGpu, webgl: unavailableGpu, ml: unavailableGpu,
    cpu: { run: async (task, context) => { cpuCalls++; return cpuTensorNode(task.input, { ...context, denyExternalProviders: true }); } } });
  const context = () => ({ capability: 'CPU', allowCpuFallback: false,
    controller: { approve: async task => task.TAG === 'LEEWAY.COMPUTE.TENSOR.EXEC' && task.metadata.backend === 'CPU' },
    verify: async (actual, input) => exactIntegerReference(actual, input) });
  for (const [m, k, n, seed, activation] of [[1,1,1,0,'identity'], [3,5,7,17,'relu'],
    [16,16,16,42,'identity'], [16,16,16,91,'relu'], [32,32,32,7,'identity'],
    [64,64,64,123,'relu'], [129,65,17,255,'identity']]) {
    const started = performance.now();
    const result = await dispatcher.dispatch({ type: 'TENSOR', input: fixture(m,k,n,seed,activation) }, context());
    const roundTripMs = performance.now() - started;
    assert.equal(result.backend, 'CPU'); assert.equal(result.recoveredFrom, null);
    assert.equal(result.verification.valid, true); assert.equal(result.attempts.length, 1);
    report.variants.push({ shape: [m,k,n], seed, activation, backend: result.backend,
      values: result.result.length, mismatches: result.verification.mismatches, resultSha256: result.sha256,
      hostRoundTripMs: roundTripMs, timingScope: 'Includes thread startup, validation, execution, verification, hashing, and cleanup.' });
  }
  const task = { type: 'TENSOR', input: fixture(16,16,16,42,'identity') };
  const beforeDenied = cpuCalls;
  const deniedContext = context(); deniedContext.controller.approve = async () => false;
  await assert.rejects(() => dispatcher.dispatch(task, deniedContext), /GPU_EXECUTION_DENIED/);
  assert.equal(cpuCalls, beforeDenied); report.negativeChecks.push('DENIED_CONTROLLER_STARTS_NO_CPU_WORK');
  const preCancelled = new AbortController(); preCancelled.abort();
  await assert.rejects(() => dispatcher.dispatch(task, { ...context(), signal: preCancelled.signal }), error => error.code === 'TENSOR_CANCELLED');
  assert.equal(cpuCalls, beforeDenied); report.negativeChecks.push('PRE_CANCELLED_REQUEST_STARTS_NO_CPU_WORK');
  const wrongVerifier = context(); wrongVerifier.verify = async () => ({ valid: false, method: 'INJECTED_REJECTION' });
  await assert.rejects(() => dispatcher.dispatch(task, wrongVerifier), error => error.code === 'TENSOR_REFERENCE_MISMATCH');
  report.negativeChecks.push('INDEPENDENT_REFERENCE_REJECTION_PROPAGATES');
  assert.equal(gpuCalls, 0); assert.equal(networkAttempts, 0);
  for (const file of sourceFiles) assert.equal(digest(fs.readFileSync(path.join(root, file))), sourceBefore[file]);
  report.outcome = 'PASS_SOFTWARE_COMPUTE_COMPONENT';
} catch (error) {
  failure = error; report.outcome = 'FAIL'; report.error = { name: error.name, message: error.message };
} finally {
  for (const restore of restored.reverse()) restore();
  report.cpuCalls = cpuCalls; report.gpuBackendCalls = gpuCalls; report.mainJsNetworkAttempts = networkAttempts;
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(evidenceDirectory, 'software-only-acceptance.json'), JSON.stringify(report, null, 2) + '\n');
}
process.stdout.write(JSON.stringify({ outcome: report.outcome, variants: report.variants.length,
  negativeChecks: report.negativeChecks.length, cpuCalls, gpuBackendCalls: gpuCalls, mainJsNetworkAttempts: networkAttempts,
  evidence: path.join(evidenceDirectory, 'software-only-acceptance.json') }) + '\n');
if (failure) { process.stderr.write(failure.stack + '\n'); process.exitCode = 1; }
