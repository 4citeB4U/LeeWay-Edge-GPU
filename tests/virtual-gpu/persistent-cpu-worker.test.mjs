/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.PERSISTENT_WORKER.V1
WHAT: Fail-closed qualification of bounded persistent CPU worker residency.
WHY: Worker reuse must be measured, authorized, revocable and recoverable without creating a second scheduler.
WHO: OpenCode authorized implementation contributor.
WHERE: tests/virtual-gpu/persistent-cpu-worker.test.mjs
WHEN: 2026-11-27
HOW: Real node worker threads through the existing canonical worker shim; injected task metadata only.
AUTHORITY: TEST_ONLY. No production GPU, provider, Veritas or deployment claim.
LICENSE: Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { createPersistentNodeCpuWorkerFactory } from '../../core/cpu-resource-pool.mjs';

const auth = (id = 'CORR-PERSIST-001') => ({
  subjectRef: 'OWNER-TEST', tenantRef: 'TENANT-TEST', approvalRef: 'APPR-TEST',
  capability: 'LEEWAY_CPU_TENSOR', correlationId: id
});
const task = (value = 4) => ({
  op: 'TENSOR',
  input: {
    operation: 'MATMUL_BIAS_RELU_V1', m: 2, k: 2, n: 2,
    A: Float32Array.from([value, 0, 0, value]), B: Float32Array.from([1, 0, 0, 1]),
    bias: Float32Array.from([0, 0]), activation: 'identity'
  }
});
const factory = (options = {}) => createPersistentNodeCpuWorkerFactory({ WorkerCtor: Worker, maxWorkers: 2, timeoutMs: 10000, ...options });

test('persistent factory fails closed without a worker constructor or authorization', async () => {
  assert.throws(() => createPersistentNodeCpuWorkerFactory({}), /CPU_WORKER_CONSTRUCTOR_UNBOUND/);
  const f = factory();
  await assert.rejects(() => f.run(task()), /WORKER_JOB_UNAUTHORIZED/);
  await f.shutdown();
});

test('sequential jobs reuse a live worker and report separated timing', async () => {
  const f = factory();
  const first = await f.run(task(2), { authorization: auth('CORR-PERSIST-101') });
  const second = await f.run(task(3), { authorization: auth('CORR-PERSIST-102') });
  const id1 = first._leeWayWorkerIdentity, id2 = second._leeWayWorkerIdentity;
  assert.equal(id1.workerId, id2.workerId);
  assert.equal(id1.threadId, id2.threadId);
  assert.equal(id2.jobsOnWorker, 2);
  assert.equal(f.status().liveWorkers, 1);
  assert.equal(f.status().completedJobs, 2);
  for (const value of [first, second]) {
    const t = value._leeWayWorkerTiming;
    assert.ok(t.enqueueToDispatchMs >= 0);
    assert.ok(t.dispatchToResponseMs >= 0);
    assert.ok(Number.isFinite(t.workerArithmeticMs));
  }
  assert.equal(first[0], 2);
  assert.equal(second[3], 3);
  await f.shutdown();
});

test('concurrent jobs occupy distinct worker threads with overlapping intervals', async () => {
  const f = factory({ maxWorkers: 2 });
  const results = await Promise.all([
    f.run(task(5), { authorization: auth('CORR-PERSIST-201') }),
    f.run(task(7), { authorization: auth('CORR-PERSIST-202') })
  ]);
  const [a, b] = results.map(r => r._leeWayWorkerIdentity);
  assert.notEqual(a.workerId, b.workerId);
  assert.notEqual(a.threadId, b.threadId);
  assert.equal(f.status().liveWorkers, 2);
  assert.equal(a.jobsOnWorker, 1);
  assert.equal(b.jobsOnWorker, 1);
  await f.shutdown();
});

test('revocation rejects a queued job and shutdown blocks later submissions', async () => {
  const f = factory({ maxWorkers: 1 });
  const first = f.run(task(11), { authorization: auth('CORR-PERSIST-301') });
  const queued = f.run(task(13), { authorization: auth('CORR-PERSIST-302') });
  assert.equal(f.cancel('CORR-PERSIST-302'), true);
  await assert.rejects(() => queued, /WORKER_JOB_REVOKED/);
  await first;
  const status = await f.shutdown();
  assert.equal(status.state, 'SHUTDOWN');
  assert.equal(status.liveWorkers, 0);
  await assert.rejects(() => f.run(task(), { authorization: auth('CORR-PERSIST-303') }), /WORKER_FACTORY_SHUTDOWN/);
});
