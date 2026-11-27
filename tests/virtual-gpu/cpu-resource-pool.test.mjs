/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.EDGE_GPU.QUALIFICATION
TAG: LEEWAY.EDGE_GPU.CPU_RESOURCE_POOL.V1
WHAT: Fail-closed qualification of bounded simultaneous CPU resource admission.
WHY: Authorization, measured capacity, LDWMD leases and controller admission must fail closed.
WHO: OpenCode authorized implementation contributor.
WHERE: tests/virtual-gpu/cpu-resource-pool.test.mjs
WHEN: 2026-11-27
HOW: Injected test doubles for host/worker/memory boundaries; production factory is exercised only through its contract.
AUTHORITY: TEST_ONLY. No production GPU, provider, Veritas or deployment claim.
LICENSE: Existing repository terms.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CPU_RESOURCE_POOL_SCHEMA,
  measureHostResources,
  createCpuResourcePool
} from '../../core/cpu-resource-pool.mjs';

const auth = (overrides = {}) => ({
  subjectRef: 'LEEWAY_TEST::actor',
  tenantRef: 'LEEWAY_TEST::tenant',
  approvalRef: 'APPR-TEST-001',
  capability: 'LEEWAY_CPU_COMPUTE',
  correlationId: 'CORR-TEST-001',
  ...overrides
});
const resource = (overrides = {}) => ({ resourceClass: 'CPU', logicalWorkers: 2, bytes: 1024, ...overrides });
const probe = () => ({ state: 'MEASURED', reason: null, logicalCpus: 8, totalBytes: 8_000_000, freeBytes: 4_000_000 });

function harness(overrides = {}) {
  const calls = { approve: 0, run: 0, acquire: 0, release: 0, released: [] };
  const controller = { approve: async () => { calls.approve += 1; return true; } };
  const workerFactory = { run: async task => { calls.run += 1; return Float32Array.from([1, 2, 3, 4]); } };
  const memoryOwner = {
    acquire: async () => { calls.acquire += 1; return { leaseRef: 'LEASE-TEST-001', bytes: 1024 }; },
    release: async ({ leaseRef }) => { calls.release += 1; calls.released.push(leaseRef); }
  };
  const pool = createCpuResourcePool({ controller, workerFactory, memoryOwner, resourceProbe: probe, ...overrides });
  return { pool, calls, controller, workerFactory, memoryOwner };
}

test('pool schema is the versioned consumer contract', () => {
  assert.equal(CPU_RESOURCE_POOL_SCHEMA, 'leeway.edge-gpu.cpu-resource-pool.v1');
});

test('host measurement is real and rejects invalid values', () => {
  const os = { cpus: () => [{ model: 'TEST-CPU' }, { model: 'TEST-CPU' }], totalmem: () => 1000, freemem: () => 500 };
  const measured = measureHostResources(os);
  assert.equal(measured.state, 'MEASURED');
  assert.equal(measured.logicalCpus, 2);
  assert.equal(measured.source, 'HOST_OS_MEASUREMENT');
  const broken = measureHostResources({ cpus: () => [], totalmem: () => 0, freemem: () => 0 });
  assert.equal(broken.state, 'UNAVAILABLE');
  assert.equal(broken.reason, 'HOST_RESOURCE_MEASUREMENT_INVALID');
});

test('status fails closed when canonical bindings are missing', () => {
  const pool = createCpuResourcePool({ resourceProbe: probe });
  const status = pool.status();
  assert.equal(status.state, 'BLOCKED');
  assert.ok(status.missing.includes('controller.approve'));
  assert.ok(status.missing.includes('workerFactory.run'));
  assert.ok(status.missing.includes('ldwmd.memoryOwner'));
  assert.equal(status.physicalGpu, 'NOT_EXECUTED');
});

test('status is CONFIGURED only when every canonical binding is present', () => {
  const { pool } = harness();
  assert.equal(pool.status().state, 'CONFIGURED');
});

test('submit is blocked when the pool is unbound', async () => {
  const pool = createCpuResourcePool({ resourceProbe: probe });
  const result = await pool.submit({ authorization: auth(), task: { op: 'TENSOR' }, resource: resource() });
  assert.equal(result.state, 'BLOCKED');
  assert.equal(result.reason, 'CPU_RESOURCE_POOL_UNBOUND');
  assert.equal(result.executed, false);
});

test('authorization fields are required and capability allowlist is enforced', async () => {
  const { pool } = harness();
  const task = { op: 'TENSOR' };
  const cases = [
    [null, 'AUTHORIZATION_REQUIRED'],
    [auth({ subjectRef: '' }), 'AUTHORIZATION_SUBJECTREF_INVALID'],
    [auth({ approvalRef: 'bad ref' }), 'AUTHORIZATION_APPROVALREF_INVALID'],
    [auth({ capability: 'GPU_PHYSICAL_EXECUTION' }), 'CAPABILITY_NOT_AUTHORIZED'],
    [auth({ capability: 'ALL_CONSUMERS' }), 'CAPABILITY_NOT_AUTHORIZED']
  ];
  for (const [authorization, reason] of cases) {
    const result = await pool.submit({ authorization, task, resource: resource() });
    assert.equal(result.reason, reason);
    assert.equal(result.executed, false);
  }
});

test('only CPU resource class is admitted', async () => {
  const { pool, calls } = harness();
  const result = await pool.submit({ authorization: auth(), task: { op: 'TENSOR' }, resource: resource({ resourceClass: 'SYNTHETIC_GPU' }) });
  assert.equal(result.reason, 'NON_CPU_RESOURCE_REJECTED');
  assert.equal(calls.approve, 0);
});

test('measured capacity and memory budget gates reject oversized requests', async () => {
  const { pool, calls } = harness();
  const task = { op: 'TENSOR' };
  const tooManyWorkers = await pool.submit({ authorization: auth(), task, resource: resource({ logicalWorkers: 9 }) });
  assert.equal(tooManyWorkers.reason, 'LOGICAL_WORKERS_EXCEED_MEASURED_CAPACITY');
  const tooMuchMemory = await pool.submit({ authorization: auth(), task, resource: resource({ bytes: 2_000_001 }) });
  assert.equal(tooMuchMemory.reason, 'MEMORY_BUDGET_EXCEEDED');
  assert.equal(calls.approve, 0);
});

test('execution uses the existing controller and LDWMD lease, then reports truthful state', async () => {
  const { pool, calls } = harness();
  const result = await pool.submit({ authorization: auth(), task: { type: 'TENSOR', input: {} }, resource: resource() });
  assert.equal(result.state, 'EXECUTED_UNVERIFIED');
  assert.equal(result.reason, 'CANONICAL_VERITAS_NOT_EXECUTED');
  assert.equal(result.executed, true);
  assert.equal(result.verified, false);
  assert.equal(result.physicalGpu, 'NOT_EXECUTED');
  assert.equal(result.outputSha256.length, 64);
  assert.equal(calls.approve, 1);
  assert.equal(calls.run, 1);
  assert.equal(calls.acquire, 1);
  assert.equal(calls.release, 1);
  assert.deepEqual(calls.released, ['LEASE-TEST-001']);
  assert.equal(pool.status().active, 0);
  assert.equal(pool.status().completed, 1);
});

test('controller denial prevents worker execution and releases the lease', async () => {
  const { pool, calls } = harness({ controller: { approve: async () => false } });
  const result = await pool.submit({ authorization: auth(), task: { op: 'TENSOR' }, resource: resource() });
  assert.equal(result.state, 'FAILED');
  assert.equal(result.reason, 'GPU_EXECUTION_DENIED');
  assert.equal(calls.run, 0);
  assert.equal(calls.release, 1);
});

test('unconfirmed LDWMD lease blocks execution', async () => {
  const { pool, calls } = harness({ memoryOwner: { acquire: async () => ({ bytes: 512 }), release: async () => {} } });
  const result = await pool.submit({ authorization: auth(), task: { op: 'TENSOR' }, resource: resource() });
  assert.equal(result.reason, 'LDWMD_LEASE_UNCONFIRMED');
  assert.equal(calls.run, 0);
});

test('bounded simultaneous execution is supported and capped', async () => {
  let running = 0;
  let peak = 0;
  const calls = { release: 0 };
  const controller = { approve: async () => true };
  const workerFactory = {
    run: async () => {
      running += 1; peak = Math.max(peak, running);
      await new Promise(resolve => setImmediate(resolve));
      running -= 1;
      return { ok: true };
    }
  };
  const memoryOwner = {
    acquire: async () => ({ leaseRef: 'LEASE-CONCURRENT', bytes: 1024 }),
    release: async () => { calls.release += 1; }
  };
  const pool = createCpuResourcePool({ controller, workerFactory, memoryOwner, resourceProbe: probe, limits: { maxConcurrent: 2 } });
  const submissions = Array.from({ length: 3 }, (_, i) => pool.submit({
    authorization: auth({ correlationId: `CORR-${i}` }),
    task: { op: 'TENSOR' },
    resource: resource({ logicalWorkers: 1 })
  }));
  const results = await Promise.all(submissions);
  assert.equal(results.filter(r => r.state === 'EXECUTED_UNVERIFIED').length, 2);
  assert.equal(peak, 2);
  assert.equal(calls.release, 2);
});
