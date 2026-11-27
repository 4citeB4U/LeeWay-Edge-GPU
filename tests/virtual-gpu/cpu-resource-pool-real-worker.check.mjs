/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.CPU_RESOURCE_POOL.REAL_WORKER.V1
WHAT: Exercise the production worker factory with a real worker thread and the canonical CPU worker source.
WHY: Prove the pool reaches real arithmetic, not only injected test doubles.
WHO: OpenCode authorized implementation contributor.
WHERE: tests/virtual-gpu/cpu-resource-pool-real-worker.check.mjs
WHEN: 2026-11-27
HOW: Real node:worker_threads Worker bound to fallback/node-cpu.worker.mjs, with a test-only memory owner.
AUTHORITY: TEST_ONLY. No production authorization, Veritas or deployment claim.
LICENSE: Existing repository terms.
*/
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { createCpuResourcePool, createNodeCpuWorkerFactory, measureHostResources } from '../../core/cpu-resource-pool.mjs';

const factory = createNodeCpuWorkerFactory({ WorkerCtor: Worker });
const tensorInput = () => ({
  operation: 'MATMUL_BIAS_RELU_V1',
  m: 2, k: 2, n: 2,
  A: Float32Array.from([1, 2, 3, 4]),
  B: Float32Array.from([5, 6, 7, 8]),
  bias: Float32Array.from([0, 0]),
  activation: 'identity'
});
const direct = await factory.run({ op: 'TENSOR', input: tensorInput() });
assert.ok(direct instanceof Float32Array, 'canonical worker must return Float32Array');
assert.equal(direct.length, 4);

const pool = createCpuResourcePool({
  controller: { approve: async () => true },
  workerFactory: factory,
  memoryOwner: { acquire: async () => ({ leaseRef: 'LEASE-REAL-001', bytes: 1024 }), release: async () => {} },
  resourceProbe: measureHostResources
});
const result = await pool.submit({
  authorization: { subjectRef: 'TEST::actor', tenantRef: 'TEST::tenant', approvalRef: 'APPR-REAL-001', capability: 'LEEWAY_CPU_TENSOR', correlationId: 'CORR-REAL-001' },
  task: { op: 'TENSOR', input: tensorInput() },
  resource: { resourceClass: 'CPU', logicalWorkers: 1, bytes: 1024 }
});
assert.equal(result.state, 'EXECUTED_UNVERIFIED');
assert.equal(result.executed, true);
assert.equal(result.physicalGpu, 'NOT_EXECUTED');
assert.match(result.outputSha256, /^[0-9a-f]{64}$/);
console.log(JSON.stringify({
  outcome: 'REAL_CPU_WORKER_EXECUTION_PASS',
  directResult: Array.from(direct),
  poolState: result.state,
  outputSha256: result.outputSha256,
  physicalGpu: result.physicalGpu,
  veritas: 'NOT_EXECUTED'
}, null, 2));
